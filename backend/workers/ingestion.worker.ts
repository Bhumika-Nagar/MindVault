import { Worker } from "bullmq";

console.log("🚀 Worker starting...");

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Rejection:", err);
});

const worker = new Worker(
  "ingestion",
  async (job) => {
    console.log("🟡 Job received:", job.data);

    // force a controlled test
    if (!job.data?.url) {
      throw new Error("URL missing in job data");
    }

    console.log("✅ Worker basic logic working");

    return { success: true };
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  console.log("🟢 Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("🔴 Job failed:", err);
});