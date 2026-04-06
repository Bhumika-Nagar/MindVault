import express from "express";
import contentRouter from "./content";
import userRouter from "./user";

const router = express.Router();

router.use("/user", userRouter);
router.use("/content", contentRouter);

export default router;
