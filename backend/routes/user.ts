const express= require("express");
const router=express.Router();
const z= require("zod");
const bcrypt= require("bcrypt");
const jwt= require("jsonwebtoken");
import { User } from "../src/db";
import { Response} from "express";
import { Request } from "express";


router.post("/api/v1/signup", async (req:Request, res:Response) => {
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



router.post("/login",async(req:Request,res:Response)=>{
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


