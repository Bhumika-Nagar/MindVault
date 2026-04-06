import { Request } from "express";
declare global{
    namespace Express{
        interface Request{
            userId?: string;
        }
    }
}
import { Response} from "express";
import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { string } from "zod";

function auth_middleware(req:Request,res:Response,next:NextFunction):any{
    const token =req.headers.authorization;

if(!token){
    return res.status(401).json({
        message:"no token provided"
    });
}
try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET as string)as{
        userId:string;
    }
    next();

    req.userId= decoded.userId;

}catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }

}
export {auth_middleware}
