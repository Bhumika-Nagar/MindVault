import express from "express";
import {
  extractArticleController,
  extractAudioController,
  extractYoutubeController,
} from "../controllers/extract.controller.js";

const router = express.Router();

router.post("/article", extractArticleController);
router.post("/youtube", extractYoutubeController);
router.post("/audio", extractAudioController);

export default router;
