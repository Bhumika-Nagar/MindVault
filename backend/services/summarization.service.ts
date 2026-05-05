import { cleanWhitespace } from "../utils/ingestion.js";

const OPENAI_RESPONSES_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4.1-mini";
const MAX_SUMMARY_INPUT_CHARS = 12_000;
const MIN_AI_SUMMARY_CONTENT_CHARS = 120;

interface ResponsesApiPayload {
  output_text?: unknown;
}

const truncateForSummary = (content: string): string =>
  cleanWhitespace(content).slice(0, MAX_SUMMARY_INPUT_CHARS);

export const buildFallbackSummary = (content: string): string => {
  const normalized = truncateForSummary(content);

  if (!normalized) {
    return "Content too short";
  }

  return normalized.slice(0, 200);
};

export const shouldAttemptAiSummary = (content: string): boolean =>
  truncateForSummary(content).length >= MIN_AI_SUMMARY_CONTENT_CHARS;

const parseSummaryFromResponse = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { output_text: outputText } = payload as ResponsesApiPayload;

  if (typeof outputText !== "string") {
    return null;
  }

  const normalized = cleanWhitespace(outputText);
  return normalized.length > 0 ? normalized : null;
};

const logSummarizationEvent = (
  level: "info" | "error",
  message: string,
  context: Record<string, unknown>,
): void => {
  const payload = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.log(payload);
};

export const summarizeText = async (content: string): Promise<string> => {
  if (typeof content !== "string") {
    logSummarizationEvent("error", "summary_generation_failed", {
      reason: "invalid_content_type",
      contentType: typeof content,
    });
    return buildFallbackSummary("");
  }

  const preparedContent = truncateForSummary(content);

  if (!preparedContent) {
    logSummarizationEvent("info", "summary_fallback_used", {
      reason: "empty_content",
    });
    return buildFallbackSummary(preparedContent);
  }

  if (!shouldAttemptAiSummary(preparedContent)) {
    logSummarizationEvent("info", "summary_fallback_used", {
      reason: "content_too_short",
      contentLength: preparedContent.length,
    });
    return buildFallbackSummary(preparedContent);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logSummarizationEvent("info", "summary_fallback_used", {
      reason: "missing_api_key",
      contentLength: preparedContent.length,
    });
    return buildFallbackSummary(preparedContent);
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_API_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_SUMMARY_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Summarize the content in 2 to 4 sentences.",
                  "Capture the main points and preserve factual accuracy.",
                  "Do not use filler, boilerplate, or markdown bullets.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: preparedContent,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => null);
      logSummarizationEvent("error", "summary_generation_failed", {
        reason: "api_response_not_ok",
        statusCode: response.status,
        responseBody: responseBody?.slice(0, 500) ?? null,
      });
      return buildFallbackSummary(preparedContent);
    }

    const payload = (await response.json()) as unknown;
    const summary = parseSummaryFromResponse(payload);

    if (!summary) {
      logSummarizationEvent("error", "summary_generation_failed", {
        reason: "empty_summary_response",
      });
      return buildFallbackSummary(preparedContent);
    }

    return summary;
  } catch (error) {
    logSummarizationEvent("error", "summary_generation_failed", {
      reason: "request_error",
      error: error instanceof Error ? error.message : "Unknown summarization error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return buildFallbackSummary(preparedContent);
  }
};
