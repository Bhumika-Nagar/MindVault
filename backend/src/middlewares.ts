import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const auth_middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("No Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      console.log("Token missing after Bearer");
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    console.log("JWT decoded:", decoded);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);

    return res.status(401).json({
      error: err instanceof Error ? err.message : "Invalid token",
    });
  }
};