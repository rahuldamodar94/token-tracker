import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  chainIdParamsSchema,
  chainIdAndAddressParamsSchema,
  paginationQuerySchema,
} from "../schema/tokens";

import {
  getAllTokensHandler,
  getAllTokensByChainIdHandler,
  getTokenByAddressHandler,
  getAllTransfersByTokenAddressHandler,
} from "../controllers/tokens";

const router = Router();

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: Get all tokens
 *     description: Retrieves all indexed ERC-20 tokens across all chains with pagination and sorting. Results are cached for 60 seconds.
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tokens fetched successfully
 */
router.get(
  "/",
  validate({ query: paginationQuerySchema }),
  getAllTokensHandler,
);

/**
 * @swagger
 * /api/tokens/{chainId}:
 *   get:
 *     summary: Get tokens by chain ID
 *     description: Retrieves all indexed ERC-20 tokens for a specific chain with pagination and sorting. Results are cached for 60 seconds.
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 137]
 *         description: "Chain ID (1: Ethereum, 137: Polygon)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tokens fetched successfully
 */
router.get(
  "/:chainId",
  validate({ params: chainIdParamsSchema, query: paginationQuerySchema }),
  getAllTokensByChainIdHandler,
);

/**
 * @swagger
 * /api/tokens/{chainId}/{address}:
 *   get:
 *     summary: Get token by address
 *     description: Retrieves a single ERC-20 token by chain ID and contract address. Result is cached for 60 seconds.
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 137]
 *         description: "Chain ID (1: Ethereum, 137: Polygon)"
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^0x[a-fA-F0-9]{40}$"
 *         description: Token contract address
 *     responses:
 *       200:
 *         description: Token fetched successfully
 *       404:
 *         description: Token not found
 */
router.get(
  "/:chainId/:address",
  validate({ params: chainIdAndAddressParamsSchema }),
  getTokenByAddressHandler,
);

/**
 * @swagger
 * /api/tokens/{chainId}/{address}/transfers:
 *   get:
 *     summary: Get transfers by token address
 *     description: Retrieves all transfer events for a specific ERC-20 token with pagination and sorting.
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 137]
 *         description: "Chain ID (1: Ethereum, 137: Polygon)"
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^0x[a-fA-F0-9]{40}$"
 *         description: Token contract address
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Transfers fetched successfully
 */
router.get(
  "/:chainId/:address/transfers",
  validate({
    params: chainIdAndAddressParamsSchema,
    query: paginationQuerySchema,
  }),
  getAllTransfersByTokenAddressHandler,
);

export default router;
