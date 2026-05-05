import express from "express";
import { getIngestionJobStatus } from "../controllers/ingest.controller.js";

const router = express.Router();

router.get("/:id", getIngestionJobStatus);

export default router;
