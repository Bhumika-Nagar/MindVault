import express from "express";
import { createIngestionJob } from "../controllers/ingest.controller.js";
import { auth_middleware } from "../src/middlewares.js";

const router = express.Router();

router.post(
  "/",
  (req, _res, next) => {
    console.log("[INGEST_ROUTE] Route hit", {
      method: req.method,
      originalUrl: req.originalUrl,
      body: req.body,
    });
    next();
  },
  auth_middleware,
  createIngestionJob
);

export default router;
