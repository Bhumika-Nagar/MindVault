import ytdl from "@distube/ytdl-core";
import type { IngestionResult } from "../types/job.types.js";
import { normalizeYoutubeUrl } from "./normalizeUrl.js";

interface TranscriptLine {
  text: string;
}

interface YoutubeTranscriptApi {
  fetchTranscript(url: string): Promise<TranscriptLine[]>;
}

interface YoutubeTranscriptModule {
  YoutubeTranscript?: YoutubeTranscriptApi;
}

const cleanText = (value: string | null | undefined): string =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const TRANSCRIPT_FETCH_DELAY_MS = 2_000;

const loadYoutubeTranscriptApi = async (): Promise<YoutubeTranscriptApi> => {
  const module = (await import(
    "youtube-transcript/dist/youtube-transcript.esm.js"
  )) as YoutubeTranscriptModule;

  if (!module.YoutubeTranscript) {
    throw new Error(
      "youtube-transcript ESM entrypoint did not expose YoutubeTranscript.",
    );
  }

  return module.YoutubeTranscript;
};

export const extractYoutubeContent = async (
  url: string,
): Promise<IngestionResult> => {
  const normalizedUrl = normalizeYoutubeUrl(url);

  if (!normalizedUrl || !ytdl.validateURL(normalizedUrl)) {
    throw new Error("Invalid YouTube URL");
  }

  const info = await ytdl.getBasicInfo(normalizedUrl);
  const title = cleanText(info.videoDetails.title) || "Untitled video";
  const description = cleanText(info.videoDetails.description);

  let transcriptStatus: "available" | "fallback" = "available";
  let transcriptError: string | null = null;
  let content = "";

  try {
    const { fetchTranscript } = await loadYoutubeTranscriptApi();

    // Slow transcript requests slightly to reduce YouTube rate limiting.
    await new Promise((resolve) => setTimeout(resolve, TRANSCRIPT_FETCH_DELAY_MS));

    const transcript = await fetchTranscript(normalizedUrl);

    content = cleanText(transcript.map((item) => item.text).join(" "));
  } catch (error) {
    transcriptStatus = "fallback";

    if (error instanceof Error) {
      transcriptError = error.message;

      // Keep transcript failures observable without failing the ingestion job.
      console.error("[YOUTUBE_TRANSCRIPT_ERROR]", {
        url: normalizedUrl,
        originalUrl: url,
        message: error.message,
        stack: error.stack,
      });
    } else {
      transcriptError = "Unknown transcript error";
    }
  }

  if (!content) {
    content =
      description ||
      `Transcript unavailable for YouTube video titled "${title}".`;
  }

  return {
    title,
    content,
    sourceType: "youtube",
    url: normalizedUrl,
    normalizedUrl,
    processedAt: new Date().toISOString(),
    metadata: {
      videoId: info.videoDetails.videoId,
      author: info.videoDetails.author.name,
      duration: Number.parseInt(info.videoDetails.lengthSeconds, 10) || null,
      transcriptStatus,
      transcriptError,
    },
  };
};
