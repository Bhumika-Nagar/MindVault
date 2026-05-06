import OpenAI from "openai";
import { cleanWhitespace } from "../utils/ingestion.js";

const PRIMARY_SUMMARY_MODEL = "llama-3.1-8b-instant";
const FALLBACK_SUMMARY_MODEL = "llama-3.3-70b-versatile";
const SUMMARY_TIMEOUT_MS = 12_000;
const MAX_SUMMARY_INPUT_CHARS = 16_000;
const MIN_SUMMARY_INPUT_CHARS = 120;
const FALLBACK_SUMMARY_CHARS = 200;

interface SummarizationContext {
  contentId?: string;
  jobId?: string;
}

interface SummarizationLogContext extends SummarizationContext {
  model: string | null;
  contentLength: number;
  reason?: string | undefined;
  error?: string | undefined;
}

interface SummaryAttemptResult {
  summary: string | null;
  model: string;
  reason?: string | undefined;
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const getClient = (): OpenAI => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    maxRetries: 1,
  });
};

const SUMMARY_SYSTEM_PROMPT = [
  "Summarize the provided content in 3 to 6 sentences.",
  "Keep the wording beginner-friendly and concise.",
  "Preserve key insights and factual meaning.",
  "Do not invent missing details.",
  "Avoid filler, bullets, or markdown.",
].join(" ");

const createLogPayload = (
  event: "summary_started" | "summary_success" | "summary_fallback_used" | "summary_failed",
  context: SummarizationLogContext,
): string =>
  JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    model: context.model,
    contentLength: context.contentLength,
    reason: context.reason ?? null,
    error: context.error ?? null,
    contentId: context.contentId ?? null,
    jobId: context.jobId ?? null,
  });

const logSummaryInfo = (
  event: "summary_started" | "summary_success" | "summary_fallback_used",
  context: SummarizationLogContext,
): void => {
  console.log(createLogPayload(event, context));
};

const logSummaryError = (
  event: "summary_failed",
  context: SummarizationLogContext,
): void => {
  console.error(createLogPayload(event, context));
};

const buildFallbackSummary = (content: string): string => {
  const normalizedContent = cleanWhitespace(content);

  if (normalizedContent.length < MIN_SUMMARY_INPUT_CHARS) {
    return "Content too short to summarize";
  }

  return normalizedContent.slice(0, FALLBACK_SUMMARY_CHARS);
};

const prepareContentForSummary = (content: string): string => {
  const normalizedContent = cleanWhitespace(content);

  if (normalizedContent.length <= MAX_SUMMARY_INPUT_CHARS) {
    return normalizedContent;
  }

  // Preserve both the beginning and the ending of long documents so the model
  // sees the primary setup plus later conclusions without sending gigantic transcripts.
  const headLength = Math.floor(MAX_SUMMARY_INPUT_CHARS * 0.7);
  const tailLength = MAX_SUMMARY_INPUT_CHARS - headLength;
  const head = normalizedContent.slice(0, headLength);
  const tail = normalizedContent.slice(-tailLength);

  return `${head} ...[truncated for summarization]... ${tail}`;
};

const extractSummaryText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedSummary = cleanWhitespace(value);
  return normalizedSummary.length > 0 ? normalizedSummary : null;
};

const extractReasonFromError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "unknown_error";
  }

  const message = error.message.toLowerCase();

  if (message.includes("rate limit") || message.includes("429")) {
    return "rate_limited";
  }

  if (message.includes("timeout")) {
    return "timeout";
  }

  if (message.includes("401") || message.includes("403") || message.includes("api key")) {
    return "authentication_failed";
  }

  return "provider_request_failed";
};

const buildMessages = (content: string): ChatMessage[] => [
  {
    role: "system",
    content: SUMMARY_SYSTEM_PROMPT,
  },
  {
    role: "user",
    content,
  },
];

const attemptSummary = async (
  preparedContent: string,
  model: string,
): Promise<SummaryAttemptResult> => {
  const client = getClient();
  const completion = await client.chat.completions.create(
    {
      model,
      temperature: 0.2,
      max_tokens: 220,
      messages: buildMessages(preparedContent),
    },
    {
      timeout: SUMMARY_TIMEOUT_MS,
      maxRetries: 1,
    },
  );

  const firstChoice = completion.choices[0];
  const summary = extractSummaryText(firstChoice?.message?.content);

  if (!summary) {
    return {
      summary: null,
      model,
      reason: "empty_summary_response",
    };
  }

  return {
    summary,
    model,
  };
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
    const fallbackSummary = buildFallbackSummary("");

    logSummaryInfo("summary_fallback_used", {
      ...context,
      model: null,
      contentLength: 0,
      reason: "invalid_content_type",
    });

    return fallbackSummary;
  }

  const preparedContent = prepareContentForSummary(content);
  const fallbackSummary = buildFallbackSummary(preparedContent);
  const contentLength = preparedContent.length;

  if (!preparedContent) {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      model: null,
      contentLength,
      reason: "empty_content",
    });

    return "Content too short to summarize";
  }

  if (preparedContent.length < MIN_SUMMARY_INPUT_CHARS) {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      model: null,
      contentLength,
      reason: "content_too_short",
    });

    return fallbackSummary;
  }

  if (!process.env.OPENAI_API_KEY) {
    logSummaryInfo("summary_fallback_used", {
      ...context,
      model: null,
      contentLength,
      reason: "missing_api_key",
    });

    return fallbackSummary;
  }

  const modelsToTry = [PRIMARY_SUMMARY_MODEL, FALLBACK_SUMMARY_MODEL] as const;
  let lastFailureReason = "provider_request_failed";
  let lastErrorMessage: string | undefined;

  for (const model of modelsToTry) {
    logSummaryInfo("summary_started", {
      ...context,
      model,
      contentLength,
      reason: preparedContent.length < cleanWhitespace(content).length ? "truncated_input" : "standard_input",
    });

    try {
      const result = await attemptSummary(preparedContent, model);

      if (result.summary) {
        logSummaryInfo("summary_success", {
          ...context,
          model: result.model,
          contentLength,
        });

        return result.summary;
      }

      lastFailureReason = result.reason ?? "empty_summary_response";

      logSummaryError("summary_failed", {
        ...context,
        model,
        contentLength,
        reason: lastFailureReason,
      });
    } catch (error) {
      lastFailureReason = extractReasonFromError(error);
      lastErrorMessage = error instanceof Error ? error.message : "Unknown summarization error";

      logSummaryError("summary_failed", {
        ...context,
        model,
        contentLength,
        reason: lastFailureReason,
        error: lastErrorMessage,
      });
    }
  }

  logSummaryInfo("summary_fallback_used", {
    ...context,
    model: PRIMARY_SUMMARY_MODEL,
    contentLength,
    reason: lastFailureReason,
    error: lastErrorMessage,
  });

  return fallbackSummary;
}

export type { SummarizationContext };
