import { Request, Response, NextFunction } from "express";
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

  console.error(err);
  res.status(500).json({
    data: null,
    message: "Internal server error",
    error: null,
  });
}
