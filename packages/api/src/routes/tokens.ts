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

router.get("/", validate({ query: paginationQuerySchema }), getAllTokensHandler);

router.get(
  "/:chainId",
  validate({ params: chainIdParamsSchema, query: paginationQuerySchema }),
  getAllTokensByChainIdHandler,
);

router.get(
  "/:chainId/:address",
  validate({ params: chainIdAndAddressParamsSchema }),
  getTokenByAddressHandler,
);

router.get(
  "/:chainId/:address/transfers",
  validate({ params: chainIdAndAddressParamsSchema, query: paginationQuerySchema }),
  getAllTransfersByTokenAddressHandler,
);

export default router;
