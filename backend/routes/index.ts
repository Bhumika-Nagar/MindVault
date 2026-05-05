import express from "express";
import contentRouter from "./content.js";
import userRouter from "./user.js";
import extractRouter from "./extract.js";
import ingestRouter from "./ingest.js";
import jobRouter from "./job.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/content", contentRouter);
router.use("/extract", extractRouter);
router.use("/ingest", ingestRouter);
router.use("/job", jobRouter);

export default router;
