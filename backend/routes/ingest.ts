import express from "express";
import { createIngestionJob } from "../controllers/ingest.controller.js";

const router = express.Router();

router.post("/", createIngestionJob);

export default router;
