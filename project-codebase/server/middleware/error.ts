import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { logger } from "../logger.js";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    logger.warn("Validation failed", { path: req.path, issues: err.issues });
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body failed validation",
        details: z.treeifyError(err),
      },
    });
  }
  if (err instanceof HttpError) {
    logger.warn("HTTP error", { status: err.status, message: err.message, path: req.path });
    return res.status(err.status).json({
      error: { code: err.status === 404 ? "NOT_FOUND" : "REQUEST_ERROR", message: err.message, details: err.details },
    });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { message, path: req.path });
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}
