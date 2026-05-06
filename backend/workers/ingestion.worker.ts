import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import mongoose from "mongoose";
import { summarizeText } from "../services/summarization.service.js";
import type { ContentDocument } from "../src/db.js";
import { Content, ensureDatabaseConnection } from "../src/db.js";
import { redisConnection } from "../queues/ingestion.queue.js";
import type { IngestionJobData, IngestionResult, IngestionSourceType } from "../types/job.types.js";
import { extractAudio } from "../utils/extractAudio.js";
import { extractArticleContent } from "../utils/extractContent.js";
import { extractYoutubeContent } from "../utils/extractYoutube.js";
import { cleanWhitespace, detectIngestionSourceType, mergeMetadata } from "../utils/ingestion.js";

console.log("[INGEST_WORKER] Worker starting", {
  queueName: "ingestion",
  redisConnection,
});

process.on("uncaughtException", (err) => {
  console.error("[INGEST_WORKER] Uncaught exception", err);
});

process.on("unhandledRejection", (err) => {
  console.error("[INGEST_WORKER] Unhandled rejection", err);
});

const buildAudioContent = (
  url: string,
  title: string,
  metadata?: Record<string, unknown>,
): string => {
  const fragments = [
    title,
    typeof metadata?.description === "string" ? metadata.description : "",
    typeof metadata?.showName === "string" ? `Show: ${metadata.showName}` : "",
    typeof metadata?.artistNames === "object" && Array.isArray(metadata.artistNames)
      ? `Artists: ${metadata.artistNames.join(", ")}`
      : "",
    `Source URL: ${url}`,
  ];

  return cleanWhitespace(fragments.filter(Boolean).join(". "));
};

const extractBySource = async (
  url: string,
  contentId: string,
): Promise<IngestionResult> => {
  const sourceType = detectIngestionSourceType(url);

  if (sourceType === "youtube") {
    const result = await extractYoutubeContent(url);
    return {
      ...result,
      contentId,
      content: result.content ?? "",
      normalizedUrl: result.normalizedUrl ?? url,
    };
  }

  if (sourceType === "audio") {
    const audio = await extractAudio(url);
    const content = buildAudioContent(url, audio.title, audio.metadata);
    const result: IngestionResult = {
      contentId,
      url,
      normalizedUrl: url,
      sourceType: "audio",
      title: audio.title,
      content,
      duration: audio.duration,
      processedAt: new Date().toISOString(),
    };

    if (audio.mimeType) {
      result.mimeType = audio.mimeType;
    }

    if (typeof audio.contentLength === "number") {
      result.contentLength = audio.contentLength;
    }

    if (audio.metadata) {
      result.metadata = audio.metadata;
    }

    return result;
  }

  const article = await extractArticleContent(url);
  return {
    ...article,
    contentId,
    content: article.content ?? "",
    normalizedUrl: article.normalizedUrl ?? url,
  };
};

const updateContentStatus = async (
  contentId: string,
  update: Partial<ContentDocument>,
): Promise<void> => {
  await Content.findByIdAndUpdate(
    new mongoose.Types.ObjectId(contentId),
    update,
    { new: false },
  );
};

const worker = new Worker<IngestionJobData, IngestionResult, "process-url">(
  "ingestion",
  async (job) => {
    await ensureDatabaseConnection();

    const { contentId, url } = job.data;

    console.log("[INGEST_WORKER] Worker started job", {
      jobId: String(job.id),
      contentId,
      url,
      attempt: job.attemptsMade + 1,
    });

    const existingContent = await Content.findById(contentId);
    if (!existingContent) {
      throw new Error(`Content document not found for contentId=${contentId}`);
    }

    if (existingContent.status === "completed" && existingContent.content && existingContent.summary) {
      console.log("[INGEST_WORKER] Skipping already completed job", {
        jobId: String(job.id),
        contentId,
      });

      return {
        contentId,
        url: existingContent.link,
        normalizedUrl: job.data.normalizedUrl ?? existingContent.link,
        sourceType: existingContent.sourceType as IngestionSourceType,
        title: existingContent.title,
        content: existingContent.content,
        metadata: existingContent.metadata,
        processedAt: existingContent.updatedAt.toISOString(),
      };
    }

    await updateContentStatus(contentId, {
      status: "processing",
      metadata: mergeMetadata(existingContent.metadata, {
        queueStatus: "processing",
        queueError: null,
        processingStartedAt: new Date().toISOString(),
      }),
    });

    try {
      const extracted = await extractBySource(url, contentId);
      const summary = await summarizeText(extracted.content ?? "", {
        contentId,
        jobId: String(job.id),
      });

      await updateContentStatus(contentId, {
        title: extracted.title || existingContent.title,
        content: extracted.content ?? "",
        summary,
        status: "completed",
        sourceType: extracted.sourceType,
        metadata: mergeMetadata(existingContent.metadata, {
          ...(extracted.metadata ?? {}),
          queueStatus: "completed",
          queueError: null,
          normalizedUrl: extracted.normalizedUrl,
          processedAt: extracted.processedAt,
        }),
      });

      console.log("[INGEST_WORKER] Worker completed job", {
        jobId: String(job.id),
        contentId,
        url,
        sourceType: extracted.sourceType,
      });

      return {
        ...extracted,
        summary,
      } as IngestionResult & { summary: string };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown worker error";

      await updateContentStatus(contentId, {
        status: "failed",
        metadata: mergeMetadata(existingContent.metadata, {
          queueStatus: "failed",
          queueError: errorMessage,
          failedAt: new Date().toISOString(),
        }),
      });

      console.error("[INGEST_WORKER] Worker failed job", {
        jobId: String(job.id),
        contentId,
        url,
        error: errorMessage,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    // Process one ingestion job at a time to avoid overlapping transcript scrapes.
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  console.log("[INGEST_WORKER] BullMQ completed event", {
    jobId: String(job.id),
    contentId: job.data.contentId,
  });
});

worker.on("failed", (job, err) => {
  console.error("[INGEST_WORKER] BullMQ failed event", {
    jobId: job ? String(job.id) : null,
    contentId: job?.data?.contentId ?? null,
    error: err.message,
  });
});
