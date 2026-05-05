import ytdl from "@distube/ytdl-core";
import { fetch } from "undici";
import { Readable } from "node:stream";
import { basename, extname } from "node:path";
import {
  AppError,
  UnsupportedSourceError,
  UpstreamServiceError,
  ValidationError,
} from "./httpErrors.js";

export type AudioSourceType = "youtube" | "spotify" | "direct_url";

export interface AudioExtractionResult {
  stream?: Readable;
  title: string;
  duration: number | null;
  sourceType: AudioSourceType;
  mimeType?: string;
  contentLength?: number;
  metadata?: Record<string, unknown>;
}

export interface AudioExtractorStrategy {
  readonly sourceType: AudioSourceType;
  extract(inputUrl: string): Promise<AudioExtractionResult>;
}

type SpotifyResourceType = "track" | "episode";

interface SpotifyResourceDescriptor {
  resourceType: SpotifyResourceType;
  resourceId: string;
}

const AUDIO_FILE_EXTENSIONS = new Set([
  ".aac",
  ".flac",
  ".m4a",
  ".mp3",
  ".ogg",
  ".oga",
  ".opus",
  ".wav",
  ".webm",
]);

const DEFAULT_USER_AGENT =
  "MindVaultAudioIngestion/1.0 (+https://mindvault.local)";

export class AudioExtractionError extends AppError {}

const sanitizeFilename = (value: string): string =>
  value.replace(/[^\w.\- ]+/g, "").trim() || "audio";

const toNumberOrNull = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const detectSourceType = (inputUrl: string): AudioSourceType => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    throw new ValidationError("A valid absolute URL is required.");
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === "youtu.be" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube.com"
  ) {
    return "youtube";
  }

  if (hostname === "open.spotify.com" || hostname.endsWith(".spotify.com")) {
    return "spotify";
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new UnsupportedSourceError("Only HTTP and HTTPS URLs are supported.");
  }

  return "direct_url";
};

const buildExtractorRegistry = (): Record<AudioSourceType, AudioExtractorStrategy> => ({
  youtube: new YouTubeAudioExtractor(),
  spotify: new SpotifyMetadataExtractor(),
  direct_url: new DirectAudioUrlExtractor(),
});

class YouTubeAudioExtractor implements AudioExtractorStrategy {
  public readonly sourceType = "youtube" as const;

  public async extract(inputUrl: string): Promise<AudioExtractionResult> {
    if (!ytdl.validateURL(inputUrl)) {
      throw new ValidationError("The provided YouTube URL is invalid.");
    }

    const info = await ytdl.getInfo(inputUrl);
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!audioFormat) {
      throw new UpstreamServiceError("No audio-only stream was available for this YouTube video.", 502);
    }

    const stream = ytdl.downloadFromInfo(info, {
      quality: audioFormat.itag,
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });
    const contentLength = audioFormat.contentLength
      ? toNumberOrNull(audioFormat.contentLength)
      : null;
    const result: AudioExtractionResult = {
      stream,
      title: info.videoDetails.title,
      duration: toNumberOrNull(info.videoDetails.lengthSeconds),
      sourceType: this.sourceType,
      metadata: {
        videoId: info.videoDetails.videoId,
        author: info.videoDetails.author.name,
      },
    };

    if (audioFormat.mimeType) {
      const mimeType = audioFormat.mimeType.split(";")[0];
      if (mimeType) {
        result.mimeType = mimeType;
      }
    }

    if (typeof contentLength === "number") {
      result.contentLength = contentLength;
    }

    return result;
  }
}

class SpotifyMetadataExtractor implements AudioExtractorStrategy {
  public readonly sourceType = "spotify" as const;

  public async extract(inputUrl: string): Promise<AudioExtractionResult> {
    const descriptor = this.parseResource(inputUrl);
    const accessToken = await this.getAccessToken();
    const endpoint = `https://api.spotify.com/v1/${descriptor.resourceType}s/${descriptor.resourceId}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "user-agent": DEFAULT_USER_AGENT,
      },
      redirect: "follow",
    });

    if (response.status === 404) {
      throw new UnsupportedSourceError("Spotify resource was not found.");
    }

    if (!response.ok) {
      throw new UpstreamServiceError("Spotify metadata lookup failed.", 502, {
        statusCode: response.status,
      });
    }

    const payload = (await response.json()) as SpotifyTrackPayload | SpotifyEpisodePayload;

    if ("name" in payload === false) {
      throw new UpstreamServiceError("Spotify returned an unexpected payload.");
    }

    if (descriptor.resourceType === "track") {
      const track = payload as SpotifyTrackPayload;

      return {
        title: track.name,
        duration: Math.round(track.duration_ms / 1000),
        sourceType: this.sourceType,
        metadata: {
          artistNames: track.artists.map((artist) => artist.name),
          albumName: track.album.name,
          spotifyId: track.id,
          externalUrl: track.external_urls.spotify,
        },
      };
    }

    const episode = payload as SpotifyEpisodePayload;

    return {
      title: episode.name,
      duration: Math.round(episode.duration_ms / 1000),
      sourceType: this.sourceType,
      metadata: {
        showName: episode.show.name,
        description: episode.description,
        spotifyId: episode.id,
        externalUrl: episode.external_urls.spotify,
      },
    };
  }

  private parseResource(inputUrl: string): SpotifyResourceDescriptor {
    const parsedUrl = new URL(inputUrl);
    const [, resourceType, resourceId] = parsedUrl.pathname.split("/");

    if (!resourceType || !resourceId) {
      throw new ValidationError("Spotify URL must include a resource type and identifier.");
    }

    if (resourceType !== "track" && resourceType !== "episode") {
      throw new UnsupportedSourceError(
        "Spotify ingestion currently supports track and episode URLs only.",
      );
    }

    return {
      resourceType,
      resourceId,
    };
  }

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new UpstreamServiceError(
        "Spotify credentials are missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
        503,
      );
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        authorization: `Basic ${basicAuth}`,
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": DEFAULT_USER_AGENT,
      },
      body: "grant_type=client_credentials",
      redirect: "error",
    });

    if (!response.ok) {
      throw new UpstreamServiceError("Failed to authenticate with Spotify.", 502, {
        statusCode: response.status,
      });
    }

    const payload = (await response.json()) as SpotifyTokenResponse;

    if (!payload.access_token) {
      throw new UpstreamServiceError("Spotify auth response did not include an access token.");
    }

    return payload.access_token;
  }
}

class DirectAudioUrlExtractor implements AudioExtractorStrategy {
  public readonly sourceType = "direct_url" as const;

  public async extract(inputUrl: string): Promise<AudioExtractionResult> {
    const response = await fetch(inputUrl, {
      method: "GET",
      headers: {
        "user-agent": DEFAULT_USER_AGENT,
        accept: "audio/*,application/octet-stream;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new UpstreamServiceError("Failed to fetch audio from the direct URL.", 502, {
        statusCode: response.status,
      });
    }

    const mimeType = response.headers.get("content-type") ?? undefined;
    const parsedUrl = new URL(inputUrl);
    const fileExtension = extname(parsedUrl.pathname).toLowerCase();
    const looksLikeAudio =
      mimeType?.toLowerCase().startsWith("audio/") || AUDIO_FILE_EXTENSIONS.has(fileExtension);

    if (!looksLikeAudio) {
      throw new UnsupportedSourceError("The provided direct URL does not appear to point to audio.");
    }

    const contentLengthValue = response.headers.get("content-length") ?? undefined;
    const rawFileName = basename(parsedUrl.pathname) || "audio";
    const titleFromPath = sanitizeFilename(rawFileName.replace(fileExtension, ""));

    if (!response.body) {
      throw new UpstreamServiceError("Direct audio response did not include a readable body.");
    }
    const contentLength = contentLengthValue
      ? toNumberOrNull(contentLengthValue)
      : null;
    const result: AudioExtractionResult = {
      stream: Readable.from(response.body as AsyncIterable<Uint8Array>),
      title: titleFromPath,
      duration: null,
      sourceType: this.sourceType,
      metadata: {
        originalUrl: inputUrl,
      },
    };

    if (mimeType) {
      result.mimeType = mimeType;
    }

    if (typeof contentLength === "number") {
      result.contentLength = contentLength;
    }

    return result;
  }
}

export const extractAudio = async (inputUrl: string): Promise<AudioExtractionResult> => {
  const sourceType = detectSourceType(inputUrl);
  const extractor = buildExtractorRegistry()[sourceType];

  return extractor.extract(inputUrl);
};

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtistPayload {
  name: string;
}

interface SpotifyAlbumPayload {
  name: string;
}

interface SpotifyTrackPayload {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtistPayload[];
  album: SpotifyAlbumPayload;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyShowPayload {
  name: string;
}

interface SpotifyEpisodePayload {
  id: string;
  name: string;
  duration_ms: number;
  description: string;
  show: SpotifyShowPayload;
  external_urls: {
    spotify: string;
  };
}
