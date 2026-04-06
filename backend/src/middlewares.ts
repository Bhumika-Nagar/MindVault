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
import * as jwt from "jsonwebtoken";

function auth_middleware(req:Request,res:Response,next:NextFunction):any{
    const authHeader = req.headers.authorization;

if(!authHeader){
    return res.status(401).json({
        message:"no token provided"
    });
}
try{
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const decoded=jwt.verify(token,process.env.JWT_SECRET as string)as{
        userId:string;
    }
    req.userId= decoded.userId;
    next();

}catch (err) {
    if (err instanceof Error) {
      res.status(401).json({ error: err.message });
    } else {
      res.status(401).json({ error: "Something went wrong" });
    }
  }

}
export {auth_middleware}
