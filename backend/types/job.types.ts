export type IngestionSourceType = "youtube" | "article" | "audio" | "generic";

export type IngestionJobState = "waiting" | "active" | "completed" | "failed";

export interface IngestionJobData {
  url: string;
  contentId: string;
  normalizedUrl?: string;
  requestedAt?: string;
}

export interface IngestionResult {
  contentId?: string;
  url: string;
  normalizedUrl: string;
  sourceType: IngestionSourceType;
  title: string;
  content?: string;
  summary?: string;
  duration?: number | null;
  mimeType?: string;
  contentLength?: number;
  metadata?: Record<string, unknown>;
  processedAt: string;
}

export interface IngestionJobStatusResponse {
  id: string;
  state: IngestionJobState;
  result: IngestionResult | null;
  failedReason: string | null;
  progress?: unknown;
}
