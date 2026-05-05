import type { IngestionSourceType } from "../types/job.types.js";

export type Metadata = Record<string, unknown>;

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

const MIN_CONTENT_LENGTH = 80;
const MIN_SUMMARY_LENGTH = 16;

const isPlainObject = (value: unknown): value is Metadata => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
};

export const cleanWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const hasMeaningfulContent = (content: string): boolean =>
  cleanWhitespace(content).length >= MIN_CONTENT_LENGTH;

export const hasValidSummary = (summary: string): boolean =>
  cleanWhitespace(summary).length >= MIN_SUMMARY_LENGTH;

export const detectIngestionSourceType = (
  inputUrl: string,
): IngestionSourceType => {
  const parsedUrl = new URL(inputUrl);
  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();

  if (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com")
  ) {
    return "youtube";
  }

  if (
    hostname === "open.spotify.com" ||
    hostname.endsWith(".spotify.com") ||
    hostname === "soundcloud.com" ||
    hostname.endsWith(".soundcloud.com")
  ) {
    return "audio";
  }

  for (const extension of AUDIO_FILE_EXTENSIONS) {
    if (pathname.endsWith(extension)) {
      return "audio";
    }
  }

  return "article";
};

export const mergeMetadata = (
  existing: Metadata | undefined,
  incoming: Metadata | undefined,
): Metadata => {
  const base = isPlainObject(existing) ? existing : {};
  const next = isPlainObject(incoming) ? incoming : {};
  const merged: Metadata = { ...base };

  for (const [key, incomingValue] of Object.entries(next)) {
    if (incomingValue === undefined) {
      continue;
    }

    const existingValue = merged[key];

    if (isPlainObject(existingValue) && isPlainObject(incomingValue)) {
      merged[key] = mergeMetadata(existingValue, incomingValue);
      continue;
    }

    merged[key] = incomingValue;
  }

  return merged;
};
