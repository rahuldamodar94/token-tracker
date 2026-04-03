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
import { getCache, setCache } from "@token-tracker/shared";

export const getAllTokensHandler = async (req: Request, res: Response) => {
  const { page, limit, sort } = req.validated.query as PaginationQuery;

  const cacheKey = `tokens:page=${page}:limit=${limit}:sort=${sort}`;

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return sendSuccess(
      res,
      cachedData.rows,
      "Tokens fetched successfully",
      cachedData.pagination,
    );
  }

  const { rows, total } = await getAllTokens({ page, limit, sort });
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
  };
  await setCache(cacheKey, { rows, pagination }, 60);

  return sendSuccess(res, rows, "Tokens fetched successfully", pagination);
};

export const getAllTokensByChainIdHandler = async (
  req: Request,
  res: Response,
) => {
  const { chainId } = req.validated.params as ChainIdParams;
  const { page, limit, sort } = req.validated.query as PaginationQuery;

  const cacheKey = `tokens:chainId=${chainId}:page=${page}:limit=${limit}:sort=${sort}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return sendSuccess(
      res,
      cachedData.rows,
      "Tokens fetched successfully",
      cachedData.pagination,
    );
  }

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

  await setCache(cacheKey, { rows, pagination }, 60);

  return sendSuccess(res, rows, "Tokens fetched successfully", pagination);
};

export const getTokenByAddressHandler = async (req: Request, res: Response) => {
  const { chainId, address } = req.validated.params as ChainIdAndAddressParams;

  const cacheKey = `token:chainId=${chainId}:address=${address}`;

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return sendSuccess(res, cachedData, "Token fetched successfully");
  }

  const result = await getTokenByAddress(chainId, address);

  if (!result) {
    throw new AppError(404, "Token not found");
  }
  await setCache(cacheKey, result, 60);
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
