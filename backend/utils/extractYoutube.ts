import axios from "axios";

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
}

export const extractYoutubeContent = async (
  url: string
): Promise<ExtractedContent | null> => {
  try {
    const videoIdMatch = url.match(
      /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (!videoIdMatch) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = videoIdMatch[1];

    const videoPage = await axios.get(
      `https://www.youtube.com/watch?v=${videoId}`
    );

    const html = videoPage.data;
    const captionUrlMatch = html.match(/"baseUrl":"(https:[^"]+)"/);

    if (!captionUrlMatch) {
    throw new Error("No captions available");
    }


const captionUrl = captionUrlMatch[1]
  .replace(/\\u0026/g, "&")
  .replace(/\\/g, "");
    const transcriptRes = await axios.get(captionUrl);
    const xml = transcriptRes.data;

    const textMatches = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/g)];

    const content = textMatches
      .map((match) => match[1])
      .join(" ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'");

    return {
      title: "YouTube Video",
      content,
      url,
    };
  } catch (error: any) {
    console.error("YouTube extraction error:", error.message);
    return null;
  }
};