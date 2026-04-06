const express= require("express");
const router=express.Router();
const z= require("zod");
const bcrypt= require("bcrypt");
const jwt= require("jsonwebtoken");
import { User } from "../src/db";
import { Content } from "../src/db";
import { Response} from "express";
import { Request } from "express";
import { auth_middleware } from "../src/middlewares";
import mongoose= require("mongoose");
import {Link} from "../src/db";
import { random } from "../src/utils";

interface AuthRequest extends Request {
  userId?: string;
}

router.post("/api/v1/createcontent",auth_middleware,async (req: AuthRequest, res:Response) => {
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
  }
);

router.get("/api/v1/content",auth_middleware,async(req:AuthRequest,res:Response)=>{
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


});

router.delete("/api/v1/content/:contentId",auth_middleware,async(req:AuthRequest,res:Response)=>{

  const contentId= req.params.contentId as string;
  const userId= req.userId;
   if (!userId) {
        return res.status(401).json({
          message: "unauthorized user"
        });
      }
     

  const deleteContent= await Content.findOneAndDelete({
    _id:new mongoose.Types.ObjectId(contentId),
     userId: new mongoose.Types.ObjectId(userId)
  })
});

router.post("/api/v1/brain/share",auth_middleware,async(req:AuthRequest,res:Response)=>{
  const share=req.body.share;
  const userId= req.userId;
  if(!userId){
      return res.status(401).json({
          message: "unauthorized user"
        });
      
  }
  if(share){
    const existingLink= await Link.findOne({
        userId
    });
    if(existingLink){
      res.json({
        hash:existingLink.hash
      })
      return;
    }

    const hash=random(10);
    await Link.create({
      userId,
      hash:hash
    })
  

  res.json({
    message:"updated sharable link",
    hash:hash
  })
}else{
    await  Link.deleteOne({
      userId
    });
    res.json({
      message:"Removed Link"
    })
}
});

router.post("/api/v1/brain/:shareLink",async(req:Request<{ shareLink: string }>,res:Response)=>{
  //a random user wants to see publicly available content provided by a creator
  const hash= req.params.shareLink;
  
  const link= await Link.findOne({
    hash:hash
  })

  if(!link){
    res.status(411).json({
       message:"sorry incorrect input"
    })
    return;
  }

  const content= await Content.find({
    userId:link.userId
  })

  const user= await User.findOne({
      _id:link.userId
  })
  if(!user){
    res.status(411).json({
      message:"user not found"
    })
    return;
  }

  res.json({
    username:user.username,
    content:content
  })

});


