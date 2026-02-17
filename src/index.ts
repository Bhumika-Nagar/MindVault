import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import z,{string} from "zod";
import { validateHeaderName } from "node:http";
import bcrypt from "bcrypt";
import {User} from "./db";
import {Content} from "./db";
import {auth_middleware} from "./middlewares"
import { Response} from "express";
import { Request } from "express";
import {Link} from "./db";
import { random } from "./utils"
import { hash } from "node:crypto";

interface AuthRequest extends Request {
  userId?: string;
}

const app= express();

app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  try {
    const signupSchema = z.object({
      username: z.string().min(3).max(20),
      password: z.string().min(6).max(18),
    });

    const validatedInput = signupSchema.safeParse(req.body);

    if (!validatedInput.success) {
      return res.status(400).json({
        message: "invalid input",
      });
    }

    const { username, password } = validatedInput.data;

    const hashedPassword = await bcrypt.hash(password, 5);

    await User.create({
      username,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});



app.post("/login",async(req,res)=>{
    const{username,password}= req.body;
    const user = await User.findOne({ username });

if (!user) {
    throw new Error("User not found"); 
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
    throw new Error("Invalid credentials");
}
    
    const token= jwt.sign({id:user._id.toString()},process.env.JWT_SECRET as string);
    res.json({
        token,
        message:"you are signed in"
    });

})


app.post(
  "/api/v1/content",
  auth_middleware,
  async (req: AuthRequest, res) => {
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
        tags:(tags ?? []).map(id => new mongoose.Types.ObjectId(id)),
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

app.get("/api/v1/content",auth_middleware,async(req:AuthRequest,res:Response)=>{
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

app.delete("/api/v1/content/:contentId",auth_middleware,async(req:AuthRequest,res:Response)=>{

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

app.post("/api/v1/brain/share",auth_middleware,async(req,res)=>{
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

app.post("/api/v1/brain/:shareLink",async(req,res)=>{
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



const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server failed to start", error);
    }
}

startServer();