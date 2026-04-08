import axios from "axios";
import * as cheerio from "cheerio";

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
}

export const extractArticleContent = async (
  url: string
): Promise<ExtractedContent | null> => {
  try {
    const { data } = await axios.get<string>(url);

    const $ = cheerio.load(data);

    
    $("script, style, noscript").remove();

    const title: string = $("title").text().trim();

    let content = "";

    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        content += text + "\n";
      }
    });

    return {
      title,
      content: content.trim(),
      url,
    };
  } catch (error: any) {
    console.error("Error extracting content:", error.message);
    return null;
  }
};