import { Response } from "express";
import { PaginationMeta } from "@token-tracker/shared";

export function sendSuccess(
  res: Response,
  data: any,
  message: string,
  pagination?: PaginationMeta,
) {
  return res
    .status(200)
    .json({ data, message, error: null, pagination: pagination ?? null });
}
