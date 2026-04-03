import { Request, Response } from "express";
import { PaginationMeta } from "@token-tracker/shared";
import { AppError } from "../utils/errors";
import { sendSuccess } from "../utils/response";
import {
  ChainIdParams,
  ChainIdAndAddressParams,
  PaginationQuery,
} from "../schema/tokens";
import {
  getAllTokens,
  getAllTransfersByTokenAddress,
  getTokenByAddress,
  getAllTokensByChainId,
} from "../repositories/tokens";

export const getAllTokensHandler = async (req: Request, res: Response) => {
  const { page, limit, sort } = req.validated.query as PaginationQuery;

  const { rows, total } = await getAllTokens({ page, limit, sort });
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  };

  return sendSuccess(res, rows, "Tokens fetched successfully", pagination);
};

export const getAllTokensByChainIdHandler = async (
  req: Request,
  res: Response,
) => {
  const { chainId } = req.validated.params as ChainIdParams;
  const { page, limit, sort } = req.validated.query as PaginationQuery;

  const { rows, total } = await getAllTokensByChainId(chainId, {
    page,
    limit,
    sort,
  });
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  };

  return sendSuccess(res, rows, "Tokens fetched successfully", pagination);
};

export const getTokenByAddressHandler = async (req: Request, res: Response) => {
  const { chainId, address } = req.validated.params as ChainIdAndAddressParams;
  const result = await getTokenByAddress(chainId, address);

  if (!result) {
    throw new AppError(404, "Token not found");
  }
  return sendSuccess(res, result, "Token fetched successfully");
};

export const getAllTransfersByTokenAddressHandler = async (
  req: Request,
  res: Response,
) => {
  const { chainId, address } = req.validated.params as ChainIdAndAddressParams;
  const { page, limit, sort } = req.validated.query as PaginationQuery;

  const { rows, total } = await getAllTransfersByTokenAddress(
    chainId,
    address,
    { page, limit, sort },
  );
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  };

  return sendSuccess(res, rows, "Transfers fetched successfully", pagination);
};
