import { Request, Response } from "express";
import { z } from "zod";
import {
  enqueueIngestionJob,
  ingestionQueue,
  normalizeIngestionUrl,
} from "../queues/ingestion.queue.js";
import type {
  IngestionJobState,
  IngestionJobStatusResponse,
} from "../types/job.types.js";
import {
  AppError,
  ValidationError,
  asyncHandler,
} from "../utils/httpErrors.js";

const ingestionRequestSchema = z
  .object({
    url: z.string().trim().min(1).url(),
    contentId: z.string().trim().min(1),
  })
  .strict();

const parseIngestionPayload = (body: unknown): { url: string; contentId: string } => {
  const result = ingestionRequestSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(
      "Request body must be exactly { url: string, contentId: string }.",
      result.error.flatten()
    );
  }

  return {
    url: normalizeIngestionUrl(result.data.url),
    contentId: result.data.contentId,
  };
};

const normalizeJobState = (state: string): IngestionJobState => {
  switch (state) {
    case "completed":
    case "failed":
    case "active":
      return state;
    default:
      return "waiting";
  }
};

export const createIngestionJob = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("[INGEST_CONTROLLER] Entered createIngestionJob", {
      method: req.method,
      originalUrl: req.originalUrl,
      body: req.body,
      userId: req.userId ?? null,
    });

    const payload = parseIngestionPayload(req.body);
    console.log("[INGEST_CONTROLLER] Request body validated", payload);

    console.log("[INGEST_CONTROLLER] Calling enqueueIngestionJob", payload);
    const job = await enqueueIngestionJob(payload);
    console.log("[INGEST_CONTROLLER] enqueueIngestionJob completed", {
      jobId: String(job.id),
      contentId: payload.contentId,
      url: payload.url,
    });

    const isDuplicate = job.attemptsMade > 0 || job.processedOn !== undefined;

    res.status(202).json({
      jobId: String(job.id),
      deduplicated: isDuplicate,
    });
  }
);

export const getIngestionJobStatus = asyncHandler(
  async (
    req: Request<{ id: string }>,
    res: Response<IngestionJobStatusResponse>
  ) => {
    const { id } = req.params;
    console.log("[INGEST_CONTROLLER] Fetching ingestion job status", { id });

    const job = await ingestionQueue.getJob(id);

    if (!job) {
      throw new AppError("Job not found.", 404, "JOB_NOT_FOUND");
    }

    const state = normalizeJobState(await job.getState());

    res.json({
      id: String(job.id),
      state,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
      progress: job.progress ?? 0,
    });
  }
);
