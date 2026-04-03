import { Request, Response, NextFunction } from "express";
import { logger } from "@token-tracker/shared";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      message: err.message,
      error: null,
    });
    return;
  }

  logger.error(err);
  res.status(500).json({
    data: null,
    message: "Internal server error",
    error: null,
  });
}
