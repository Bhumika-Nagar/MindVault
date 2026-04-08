import express, { Request, Response } from "express";
import { extractArticleContent } from "../utils/extractContent";
import {extractYoutubeContent} from "../utils/extractYoutube";
import { AudioExtractionError, extractAudio } from "../utils/extractAudio"
import { generateEmbedding } from "../services/ai.services";

const router = express.Router();

router.post("/article", async (req:Request, res:Response) => {
  const { url } = req.body;
  const data = await extractArticleContent(url);

  if (!data) return res.status(500).json({ message: "fail" });

  const trimmedContent = data.content.slice(0, 2000);
  const embedding = await generateEmbedding(trimmedContent);

      res.json({
      data,
      embedding,
});
});


router.post("/youtube", async (req:Request, res:Response) => {

const { url } = req.body;

let data = null;

// Detect type
if (url.includes("youtube.com") || url.includes("youtu.be")) {
  data = await extractYoutubeContent(url);
} else {
  data = await extractArticleContent(url);
}

if (!data) {
  return res.status(500).json({ message: "Extraction failed" });
}

const trimmedContent = data.content.slice(0, 2000);


const embedding = await generateEmbedding(trimmedContent);

const finalData = {
    data,
  embedding,
};

res.json(finalData);
});

router.post("/audio", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const audioPath = await extractAudio(url);

    res.json({
      message: "Audio extracted successfully",
      path: audioPath,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof AudioExtractionError) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    const message =
      err instanceof Error ? err.message : "Failed to extract audio";

    res.status(500).json({ error: message });
  }
});

export default router;
