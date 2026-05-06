import { Queue } from "bullmq";
import { ValidationError } from "../utils/httpErrors.js";
import { normalizeYoutubeUrl } from "../utils/normalizeUrl.js";
import type { IngestionJobData, IngestionResult } from "../types/job.types.js";

export const INGESTION_QUEUE_NAME = "ingestion";
export const INGESTION_JOB_NAME = "process-url";

const redisPort = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10);

export const redisConnection = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number.isNaN(redisPort) ? 6379 : redisPort,
};

export const normalizeIngestionUrl = (inputUrl: string): string => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl.trim());
  } catch {
    throw new ValidationError("The 'url' field must be a valid absolute URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ValidationError("Only HTTP and HTTPS URLs are supported for ingestion.");
  }

  // Canonicalize YouTube links early so every downstream step sees one stable URL format.
  const normalizedYoutubeUrl = normalizeYoutubeUrl(parsedUrl.toString());
  if (normalizedYoutubeUrl) {
    return normalizedYoutubeUrl;
  }

  parsedUrl.hash = "";
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  if (
    (parsedUrl.protocol === "http:" && parsedUrl.port === "80") ||
    (parsedUrl.protocol === "https:" && parsedUrl.port === "443")
  ) {
    parsedUrl.port = "";
  }

  if (parsedUrl.pathname.length > 1) {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
  }

  const sortedEntries = [...parsedUrl.searchParams.entries()].sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );
  parsedUrl.search = "";

  for (const [key, value] of sortedEntries) {
    parsedUrl.searchParams.append(key, value);
  }

  return parsedUrl.toString();
};

export const ingestionQueue = new Queue<
  IngestionJobData,
  IngestionResult,
  typeof INGESTION_JOB_NAME
>(INGESTION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    // Retry more patiently when YouTube or transcript extraction hits temporary rate limits.
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1_000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
      count: 5_000,
    },
  },
});

export interface EnqueueIngestionJobInput {
  url: string;
  contentId: string;
}

export const enqueueIngestionJob = async (
  input: EnqueueIngestionJobInput,
) => {
  console.log("[INGEST_QUEUE] enqueueIngestionJob called", input);

  const normalizedUrl = normalizeIngestionUrl(input.url);

  console.log("[INGEST_QUEUE] Adding BullMQ job", {
    queueName: INGESTION_QUEUE_NAME,
    jobName: INGESTION_JOB_NAME,
    contentId: input.contentId,
    url: input.url,
    normalizedUrl,
    redisConnection,
  });

  const job = await ingestionQueue.add(
    INGESTION_JOB_NAME,
    {
      url: input.url,
      contentId: input.contentId,
      normalizedUrl,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: input.contentId,
      // Keep per-job retries explicit at enqueue time so ingestion behavior is easy to trace.
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5_000,
      },
    }
  );

  console.log("[INGEST_QUEUE] BullMQ job added", {
    jobId: String(job.id),
    contentId: input.contentId,
    queueName: INGESTION_QUEUE_NAME,
  });

  return job;
};
