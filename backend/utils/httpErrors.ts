import type { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "APP_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnsupportedSourceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "UNSUPPORTED_SOURCE", details);
  }
}

export class UpstreamServiceError extends AppError {
  constructor(message: string, statusCode = 502, details?: unknown) {
    super(message, statusCode, "UPSTREAM_SERVICE_ERROR", details);
  }
}

export const asyncHandler = <
  TRequest extends Request = Request,
  TResponse extends Response = Response,
>(
  handler: (
    req: TRequest,
    res: TResponse,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    void handler(req as TRequest, res as TResponse, next).catch(next);
  };
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details ?? null,
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Internal server error";
  console.error(error);
  res.status(500).json({
    error: message,
    code: "INTERNAL_SERVER_ERROR",
  });
};
