import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { enqueueIngestionJob } from "../queues/ingestion.queue.js";
import { Content, Link } from "../src/db.js";
import { auth_middleware } from "../src/middlewares.js";
import { random } from "../src/utils.js";

const router = express.Router();

interface AuthRequest extends Request {
  userId?: string;
}

const createContentSchema = z.object({
  link: z.string().trim().url(),
  type: z.enum(["image", "video", "article", "audio"]),
  title: z.string().trim().min(1),
  tags: z.array(z.string()).optional(),
});

const contentLog = (message: string, context: Record<string, unknown>): void => {
  console.log(`[CONTENT] ${message}`, {
    timestamp: new Date().toISOString(),
    ...context,
  });
};

function getShareUrl(req: Request, hash: string) {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL?.replace(/\/$/, "");
  const requestOrigin = req.get("origin")?.replace(/\/$/, "");
  const baseUrl = frontendBaseUrl || requestOrigin;

  return baseUrl ? `${baseUrl}/shared/${hash}` : null;
}

async function createContentHandler(req: AuthRequest, res: Response) {
  try {
    const validatedInput = createContentSchema.safeParse(req.body);

    if (!validatedInput.success) {
      return res.status(400).json({
        message: "invalid input",
        details: validatedInput.error.flatten(),
      });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "unauthorized user",
      });
    }

    const { link, type, title, tags } = validatedInput.data;
    const tagIds = (tags ?? []).map((id) => new mongoose.Types.ObjectId(id));
    const ownerId = new mongoose.Types.ObjectId(userId);

    let content = await Content.findOne({ link });

    const wasExistingContent = Boolean(content);

    if (content) {
      contentLog("Existing content found for link", {
        contentId: content._id.toString(),
        link,
        currentStatus: content.status,
      });
    } else {
      try {
        content = await Content.create({
          link,
          type,
          title,
          userId: ownerId,
          tags: tagIds,
          status: "pending",
          metadata: {
            queueStatus: "pending",
          },
        });

        contentLog("Content created", {
          contentId: content._id.toString(),
          link,
          userId,
          status: content.status,
        });
      } catch (error) {
        if (
          error instanceof MongoServerError &&
          error.code === 11000
        ) {
          content = await Content.findOne({ link });
        } else {
          throw error;
        }
      }
    }

    if (!content) {
      throw new Error("Content document could not be created or loaded.");
    }

    if (content.userId && content.userId.toString() !== userId) {
      return res.status(409).json({
        message: "content already exists for another user",
      });
    }

    if (wasExistingContent && content.status === "completed" && content.content && content.summary) {
      contentLog("Returning existing completed content without re-enqueue", {
        contentId: content._id.toString(),
        link: content.link,
      });

      return res.status(200).json({
        message: "content already exists",
        content,
      });
    }

    if (
      content.title !== title ||
      content.type !== type ||
      content.userId?.toString() !== userId ||
      content.tags.length !== tagIds.length
    ) {
      content.title = title;
      content.type = type;
      content.userId = ownerId;
      content.tags = tagIds;
    }

    content.status = "pending";
    content.metadata = {
      ...(content.metadata ?? {}),
      queueStatus: "pending",
      queueError: null,
      lastEnqueuedAt: new Date().toISOString(),
    };

    await content.save();

    try {
      const job = await enqueueIngestionJob({
        url: content.link,
        contentId: content._id.toString(),
      });

      contentLog("Job enqueued", {
        contentId: content._id.toString(),
        jobId: String(job.id),
        link: content.link,
      });
    } catch (error) {
      content.status = "failed";
      content.metadata = {
        ...(content.metadata ?? {}),
        queueStatus: "failed",
        queueError: error instanceof Error ? error.message : "Queue enqueue failed",
      };
      await content.save();

      console.error("[CONTENT] Failed to enqueue ingestion job", {
        contentId: content._id.toString(),
        link: content.link,
        error: error instanceof Error ? error.message : error,
      });

      return res.status(500).json({
        message: "failed to queue content ingestion",
      });
    }

    return res.status(wasExistingContent ? 200 : 201).json({
      message: wasExistingContent ? "content queued successfully" : "content added successfully",
      content,
    });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function getContentHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "unauthorized user"
      });
    }

    const content = await Content.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).populate("tags");

    res.status(200).json({
      success: true,
      content
    });
  } catch (_err) {
    res.status(500).json({
      success: false,
      message: "failed to fetch content"
    });
  }
}

async function deleteContentHandler(req: AuthRequest, res: Response) {
  const contentId = req.params.contentId as string;
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({
      message: "unauthorized user"
    });
  }

  const deletedContent = await Content.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(contentId),
    userId: new mongoose.Types.ObjectId(userId)
  });

  if (!deletedContent) {
    return res.status(404).json({
      message: "content not found"
    });
  }

  return res.status(200).json({
    message: "content deleted successfully"
  });
}

async function shareContentHandler(req: AuthRequest, res: Response) {
  const { share } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (share) {
    const existingLink = await Link.findOne({ userId });

    if (existingLink?.hash) {
      return res.json({
        hash: existingLink.hash,
        shareUrl: getShareUrl(req, existingLink.hash)
      });
    }

    const hash = random(12);

    await Link.create({
      userId,
      hash
    });

    return res.json({
      message: "Sharable link created",
      hash,
      shareUrl: getShareUrl(req, hash)
    });
  }

  await Link.deleteOne({ userId });

  return res.json({
    message: "Sharing disabled"
  });
}

async function getSharedContentHandler(
  req: Request<{ shareLink: string }>,
  res: Response
) {
  const hash = req.params.shareLink;

  const link = await Link.findOne({ hash }).populate<{ userId: { _id: mongoose.Types.ObjectId; username: string } }>("userId");

  if (!link || !link.userId) {
    return res.status(404).json({
      message: "Link not found"
    });
  }

  const content = await Content.find({
    userId: link.userId._id
  });

  return res.json({
    username: link.userId.username,
    content
  });
}

router.post("/", auth_middleware, createContentHandler);
router.post("/api/v1/createcontent", auth_middleware, createContentHandler);
router.get("/", auth_middleware, getContentHandler);
router.get("/api/v1/content", auth_middleware, getContentHandler);
router.delete("/:contentId", auth_middleware, deleteContentHandler);
router.delete("/api/v1/content/:contentId", auth_middleware, deleteContentHandler);
router.post("/share", auth_middleware, shareContentHandler);
router.post("/api/v1/brain/share", auth_middleware, shareContentHandler);
router.get("/share/:shareLink", getSharedContentHandler);
router.post("/api/v1/brain/:shareLink", getSharedContentHandler);

export default router;
