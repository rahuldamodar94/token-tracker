import { z } from "zod";

const SUPPORTED_CHAIN_IDS = ["1", "137"] as const;

const chainIdSchema = z.enum(SUPPORTED_CHAIN_IDS, {
  message: "Unsupported chain ID. Supported: 1 (Ethereum), 137 (Polygon)",
}).transform(Number);

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
  .transform((val) => val.toLowerCase());

export const chainIdParamsSchema = z.object({
  chainId: chainIdSchema,
});

export const chainIdAndAddressParamsSchema = z.object({
  chainId: chainIdSchema,
  address: addressSchema,
});

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, "Page must be a positive integer").default("1").transform(Number).pipe(z.number().min(1)),
  limit: z.string().regex(/^\d+$/, "Limit must be a positive integer").default("20").transform(Number).pipe(z.number().min(1).max(100)),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export type ChainIdParams = z.infer<typeof chainIdParamsSchema>;
export type ChainIdAndAddressParams = z.infer<typeof chainIdAndAddressParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
