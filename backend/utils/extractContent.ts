import axios from "axios";
import * as cheerio from "cheerio";
import type { IngestionResult } from "../types/job.types.js";

export const extractArticleContent = async (
  url: string,
): Promise<IngestionResult> => {
  const { data } = await axios.get<string>(url);
  const $ = cheerio.load(data);

  $("script, style, noscript").remove();

  const title = $("title").text().trim();
  let content = "";

  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      content += `${text}\n`;
    }
  });

  return {
    title,
    content: content.trim(),
    sourceType: "article",
    url,
    normalizedUrl: url,
    processedAt: new Date().toISOString(),
  };
};
