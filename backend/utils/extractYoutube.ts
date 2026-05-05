import ytdl from "@distube/ytdl-core";
import type { IngestionResult } from "../types/job.types.js";

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
  if (!ytdl.validateURL(url)) {
    throw new Error("Invalid YouTube URL");
  }

  const info = await ytdl.getBasicInfo(url);
  const title = cleanText(info.videoDetails.title) || "Untitled video";
  const description = cleanText(info.videoDetails.description);

  let transcriptStatus: "available" | "fallback" = "available";
  let transcriptError: string | null = null;
  let content = "";

  try {
    const { fetchTranscript } = await loadYoutubeTranscriptApi();
    const transcript = await fetchTranscript(url);

    content = cleanText(transcript.map((item) => item.text).join(" "));
  } catch (error) {
    transcriptStatus = "fallback";
    transcriptError =
      error instanceof Error ? error.message : "Unknown transcript error";
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
    url,
    normalizedUrl: url,
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
