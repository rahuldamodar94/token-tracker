export interface Block {
  block_number: number;
  chain_id: number;
  block_hash: string;
  parent_hash: string;
  status: "provisional" | "confirmed";
  indexed_at: Date;
}

export interface Token {
  contract_address: string;
  chain_id: number;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  spam_score: number;
  status: "pending" | "active" | "rejected";
  discovered_at_block: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transfer {
  id: string;
  chain_id: number;
  token_address: string;
  from_address: string;
  to_address: string;
  value: string;
  tx_hash: string;
  block_number: number;
  log_index: number;
  created_at: Date;
}

export interface BlockEvent {
  block_number: number;
  chain_id: number;
  block_hash: string;
  parent_hash: string;
  timestamp: number;
  transaction_count: number;
}

export interface RawTransfer {
  tokenAddress: string;
  from: string;
  to: string;
  value: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}
