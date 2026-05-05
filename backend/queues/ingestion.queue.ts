import { createHash } from "node:crypto";
import { Queue } from "bullmq";
import { ValidationError } from "../utils/httpErrors.js";
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

const buildIngestionJobId = (normalizedUrl: string): string =>
  createHash("sha256").update(normalizedUrl).digest("hex");

export const ingestionQueue = new Queue<
  IngestionJobData,
  IngestionResult,
  typeof INGESTION_JOB_NAME
>(INGESTION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2_000,
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

export const enqueueIngestionJob = async (
  url: string,
) => {
  const normalizedUrl = normalizeIngestionUrl(url);

  return ingestionQueue.add(
    INGESTION_JOB_NAME,
    {
      url,
      normalizedUrl,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: buildIngestionJobId(normalizedUrl),
    },
  );
};
