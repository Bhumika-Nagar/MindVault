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
  console.log("[AUTH] Authorization header received", {
    method: req.method,
    originalUrl: req.originalUrl,
    authorization: authHeader ?? null,
  });

  if (!authHeader) {
    console.warn("[AUTH] Request blocked: missing Authorization header", {
      method: req.method,
      originalUrl: req.originalUrl,
    });
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      console.warn("[AUTH] Request blocked: token missing after Bearer prefix", {
        method: req.method,
        originalUrl: req.originalUrl,
      });
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    console.log("[AUTH] JWT decoded successfully", decoded);

    req.userId = decoded.userId;
    console.log("[AUTH] Auth passed", {
      userId: req.userId,
      method: req.method,
      originalUrl: req.originalUrl,
    });

    next();
  } catch (err) {
    console.error("[AUTH] Request blocked: JWT verification failed", err);

    return res.status(401).json({
      error: err instanceof Error ? err.message : "Invalid token",
    });
  }
};
