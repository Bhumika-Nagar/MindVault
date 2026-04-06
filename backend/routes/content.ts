import express, { Request, Response } from "express";
import { z } from "zod";
import { Content } from "../src/db";
import { auth_middleware } from "../src/middlewares";
import mongoose= require("mongoose");
import {Link} from "../src/db";
import { random } from "../src/utils";
const router = express.Router();

interface AuthRequest extends Request {
  userId?: string;
}

function getShareUrl(req: Request, hash: string) {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL?.replace(/\/$/, "");
  const requestOrigin = req.get("origin")?.replace(/\/$/, "");
  const baseUrl = frontendBaseUrl || requestOrigin;

  return baseUrl ? `${baseUrl}/shared/${hash}` : null;
}

async function createContentHandler(req: AuthRequest, res:Response) {
    try {
      const createContent = z.object({
        link: z.string().url(),
        type: z.enum(["image", "video", "article", "audio", "tweet"]),
        title: z.string().min(1),
        tags: z.array(z.string()).optional()
      });

      const validatedInput = createContent.safeParse(req.body);

      if (!validatedInput.success) {
        return res.status(400).json({
          message: "invalid input"
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          message: "unauthorized user"
        });
      }

      const { link, type, title, tags } = validatedInput.data;

      const content = await Content.create({
        link,
        type,
        title,
        userId:new mongoose.Types.ObjectId(userId),
        tags:(tags ?? []).map((id: string) => new mongoose.Types.ObjectId(id)),
      });

      return res.status(201).json({
        message: "content added successfully",
        content
      });

    } catch (err) {
      if (err instanceof Error) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(500).json({ error: "Something went wrong" });
      }
    }
  };

async function getContentHandler(req:AuthRequest,res:Response){
  try{
  const userId= req.userId;
   if (!userId) {
        return res.status(401).json({
          message: "unauthorized user"
        });
      }

  const content=await Content.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).populate("tags");
  if(!userId){
    return res.status(401).json({
      success:false,
      message:"unauthorized"
    });
  }

  res.status(200).json({
    success:true,
    content
  })
}catch(err){
  res.status(500).json({
    success:false,
    message:"failed to fetch content"
  });
}


};

async function deleteContentHandler(req:AuthRequest,res:Response){

  const contentId= req.params.contentId as string;
  const userId= req.userId;
   if (!userId) {
        return res.status(401).json({
          message: "unauthorized user"
        });
      }
     

  const deletedContent= await Content.findOneAndDelete({
    _id:new mongoose.Types.ObjectId(contentId),
     userId: new mongoose.Types.ObjectId(userId)
  })

  if(!deletedContent){
    return res.status(404).json({
      message:"content not found"
    });
  }

  return res.status(200).json({
    message:"content deleted successfully"
  });
};


async function shareContentHandler(req: AuthRequest, res: Response) {
  const { share } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (share) {
    let existingLink = await Link.findOne({ userId });

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
  } else {
    await Link.deleteOne({ userId });

    return res.json({
      message: "Sharing disabled"
    });
  }
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
