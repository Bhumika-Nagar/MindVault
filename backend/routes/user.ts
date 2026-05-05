import express, { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../src/db.js";

const router = express.Router();

async function signupHandler(req:Request, res:Response) {
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
}

async function signinHandler(req:Request,res:Response) {
  try {
    const signinSchema = z.object({
      username: z.string().min(3).max(20),
      password: z.string().min(6).max(18),
    });

    const validatedInput = signinSchema.safeParse(req.body);
    if (!validatedInput.success) {
      return res.status(400).json({
        message: "invalid input",
      });
    }

    const{username,password}= validatedInput.data;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      }); 
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    
    const token= jwt.sign({userId:user._id.toString()},process.env.JWT_SECRET as string);
    res.json({
        token,
        message:"you are signed in"
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
}

router.post("/signup", signupHandler);
router.post("/api/v1/signup", signupHandler);
router.post("/signin", signinHandler);
router.post("/login", signinHandler);
export default router;

