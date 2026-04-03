import { pool, PaginationParams } from "@token-tracker/shared";

export async function getAllTokens({ page, limit, sort }: PaginationParams) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT contract_address, chain_id, name, symbol, decimals, spam_score, status,
            COUNT(*) OVER() AS total_count
     FROM tokens
     ORDER BY created_at ${sort === "asc" ? "ASC" : "DESC"}
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const total =
    result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
  const rows = result.rows.map(({ total_count, ...row }) => row);
  return { rows, total };
}

export async function getAllTokensByChainId(
  chainId: number,
  { page, limit, sort }: PaginationParams,
) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT contract_address, chain_id, name, symbol, decimals, spam_score, status,
            COUNT(*) OVER() AS total_count
     FROM tokens
     WHERE chain_id = $1
     ORDER BY created_at ${sort === "asc" ? "ASC" : "DESC"}
     LIMIT $2 OFFSET $3`,
    [chainId, limit, offset],
  );

  const total =
    result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
  const rows = result.rows.map(({ total_count, ...row }) => row);
  return { rows, total };
}

export async function getTokenByAddress(chainId: number, address: string) {
  const result = await pool.query(
    `SELECT contract_address, chain_id, name, symbol, decimals, spam_score, status
     FROM tokens WHERE chain_id = $1 AND contract_address = $2`,
    [chainId, address],
  );

  return result.rows[0];
}

export async function getAllTransfersByTokenAddress(
  chainId: number,
  address: string,
  { page, limit, sort }: PaginationParams,
) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT token_address, chain_id, from_address, to_address, value, tx_hash, block_number,
            COUNT(*) OVER() AS total_count
     FROM transfers
     WHERE chain_id = $1 AND token_address = $2
     ORDER BY created_at ${sort === "asc" ? "ASC" : "DESC"}
     LIMIT $3 OFFSET $4`,
    [chainId, address, limit, offset],
  );

  const total =
    result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
  const rows = result.rows.map(({ total_count, ...row }) => row);
  return { rows, total };
}
