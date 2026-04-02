import { pool } from "@token-tracker/shared";

interface TokenRow {
  contract_address: string;
  chain_id: number;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  spam_score: number;
}

const REAL_TOKENS: Record<string, string> = {
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
};

function calculateSpamScore(token: TokenRow): number {
  let score = 0;

  if (!token.name) score += 30;
  if (!token.symbol) score += 30;
  if (token.decimals === null) score += 40;
  if (token.symbol && token.symbol.length > 10) score += 20;
  if (token.name && token.name.length > 50) score += 20;
  if (token.name && /[^\x00-\x7F]/.test(token.name)) score += 25;
  if (token.symbol && /[^\x00-\x7F]/.test(token.symbol)) score += 25;

  if (token.symbol && REAL_TOKENS[token.symbol]) {
    if (token.contract_address.trim() !== REAL_TOKENS[token.symbol]) {
      score += 50;
    }
  }

  return Math.min(score, 100);
}

function getStatusFromScore(score: number): string {
  if (score >= 50) return "rejected";
  return "active";
}

export async function scoreToken(contractAddress: string, chainId: number) {
  const result = await pool.query(
    "SELECT contract_address, chain_id, name, symbol, decimals, spam_score FROM tokens WHERE contract_address = $1 AND chain_id = $2",
    [contractAddress, chainId],
  );

  if (result.rows.length === 0) return;

  const token = result.rows[0] as TokenRow;
  const score = calculateSpamScore(token);
  const status = getStatusFromScore(score);

  await pool.query(
    "UPDATE tokens SET spam_score = $1, status = $2, updated_at = NOW() WHERE contract_address = $3 AND chain_id = $4",
    [score, status, contractAddress, chainId],
  );
}
