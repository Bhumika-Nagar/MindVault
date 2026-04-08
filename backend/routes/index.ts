import express from "express";
import contentRouter from "./content";
import userRouter from "./user";
import extractRouter from "./extract";

const router = express.Router();

router.use("/user", userRouter);
router.use("/content", contentRouter);
router.use("/extract", extractRouter);

export default router;
