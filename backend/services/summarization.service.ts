import { cleanWhitespace } from "../utils/ingestion.js";

const MAX_SUMMARY_INPUT_CHARS = 16_000;
const MIN_SUMMARY_INPUT_CHARS = 120;
const MIN_SENTENCE_LENGTH = 25;
const MIN_ALPHA_NUMERIC_CHARS = 12;
const TARGET_SENTENCE_COUNT = 4;
const MAX_SENTENCE_COUNT = 5;
const MAX_SUMMARY_CHARS = 420;
const FALLBACK_SUMMARY_CHARS = 220;

interface SummarizationContext {
  contentId?: string;
  jobId?: string;
}

interface SummarizationLogContext extends SummarizationContext {
  contentLength: number;
  reason?: string | undefined;
}

const createLogPayload = (
  event: "summary_started" | "summary_success" | "summary_fallback_used",
  context: SummarizationLogContext,
): string =>
  JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    contentLength: context.contentLength,
    reason: context.reason ?? null,
    contentId: context.contentId ?? null,
    jobId: context.jobId ?? null,
  });

const logSummaryInfo = (
  event: "summary_started" | "summary_success" | "summary_fallback_used",
  context: SummarizationLogContext,
): void => {
  console.log(createLogPayload(event, context));
};

const prepareContentForSummary = (content: string): string => {
  const normalizedContent = cleanWhitespace(content);

  if (normalizedContent.length <= MAX_SUMMARY_INPUT_CHARS) {
    return normalizedContent;
  }

  const headLength = Math.floor(MAX_SUMMARY_INPUT_CHARS * 0.75);
  const tailLength = MAX_SUMMARY_INPUT_CHARS - headLength;
  const head = normalizedContent.slice(0, headLength);
  const tail = normalizedContent.slice(-tailLength);

  return cleanWhitespace(`${head} ${tail}`);
};

const truncateAtWordBoundary = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  const sliced = value.slice(0, maxLength - 3);
  const lastSpace = sliced.lastIndexOf(" ");
  const safeSlice = lastSpace >= Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced;

  return `${safeSlice.trimEnd()}...`;
};

const normalizeSentence = (sentence: string): string =>
  cleanWhitespace(
    sentence
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s*([,;:!?])\s*/g, "$1 ")
      .replace(/\s*\.\s*/g, ". ")
      .replace(/\s+/g, " "),
  );

const splitIntoSentences = (content: string): string[] => {
  const matches = content.match(/[^.!?]+[.!?]+|[^.!?]+$/g);

  if (!matches) {
    return [];
  }

  return matches
    .map(normalizeSentence)
    .filter((sentence) => sentence.length > 0);
};

const isMeaningfulSentence = (sentence: string): boolean => {
  const alphaNumericCount = (sentence.match(/[A-Za-z0-9]/g) ?? []).length;

  if (alphaNumericCount < MIN_ALPHA_NUMERIC_CHARS) {
    return false;
  }

  if (sentence.length < MIN_SENTENCE_LENGTH) {
    return false;
  }

  const lowered = sentence.toLowerCase();

  return !(
    lowered.startsWith("subscribe") ||
    lowered.startsWith("follow us") ||
    lowered.startsWith("visit ") ||
    lowered.startsWith("click here") ||
    lowered === "source url."
  );
};

const buildPreviewSummary = (content: string): string => {
  const sentences = splitIntoSentences(content).filter(isMeaningfulSentence);

  if (sentences.length === 0) {
    return truncateAtWordBoundary(content, FALLBACK_SUMMARY_CHARS);
  }

  const selected: string[] = [];

  for (const sentence of sentences) {
    const nextSummary = selected.length === 0
      ? sentence
      : `${selected.join(" ")} ${sentence}`;

    if (
      selected.length >= TARGET_SENTENCE_COUNT &&
      nextSummary.length > MAX_SUMMARY_CHARS
    ) {
      break;
    }

    if (selected.length === MAX_SENTENCE_COUNT) {
      break;
    }

    selected.push(sentence);

    if (
      selected.length >= TARGET_SENTENCE_COUNT &&
      selected.join(" ").length >= Math.floor(MAX_SUMMARY_CHARS * 0.7)
    ) {
      break;
    }
  }

  const summary = selected.join(" ");

  if (!summary) {
    return truncateAtWordBoundary(content, FALLBACK_SUMMARY_CHARS);
  }

  return truncateAtWordBoundary(summary, MAX_SUMMARY_CHARS);
};

const buildFallbackSummary = (content: string): string => {
  const normalizedContent = cleanWhitespace(content);

  if (normalizedContent.length === 0) {
    return "Content too short to summarize";
  }

  if (normalizedContent.length < MIN_SUMMARY_INPUT_CHARS) {
    return truncateAtWordBoundary(normalizedContent, FALLBACK_SUMMARY_CHARS);
  }

  const previewSummary = buildPreviewSummary(normalizedContent);
  return previewSummary || truncateAtWordBoundary(normalizedContent, FALLBACK_SUMMARY_CHARS);
};

export async function summarizeText(content: string): Promise<string>;
export async function summarizeText(
  content: string,
  context: SummarizationContext,
): Promise<string>;
export async function summarizeText(
  content: string,
  context: SummarizationContext = {},
): Promise<string> {
  if (typeof content !== "string") {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      contentLength: 0,
      reason: "invalid_content_type",
    });

    return "Content too short to summarize";
  }

  const preparedContent = prepareContentForSummary(content);
  const contentLength = preparedContent.length;

  if (!preparedContent) {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      contentLength,
      reason: "empty_content",
    });

    return "Content too short to summarize";
  }

  logSummaryInfo("summary_started", {
    ...context,
    contentLength,
    reason:
      preparedContent.length < cleanWhitespace(content).length
        ? "truncated_input"
        : "standard_input",
  });

  const summary = buildFallbackSummary(preparedContent);

  if (preparedContent.length < MIN_SUMMARY_INPUT_CHARS) {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      contentLength,
      reason: "content_too_short",
    });

    return summary;
  }

  logSummaryInfo("summary_success", {
    ...context,
    contentLength,
  });

  return summary;
}

export type { SummarizationContext };
