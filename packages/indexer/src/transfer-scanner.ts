import provider from "./provider";
import { RawTransfer, PoolClient } from "@token-tracker/shared";
import { TRANSFER_EVENT_TOPIC } from "./constants";
import { trace } from "node:console";

function parseAddress(paddedAddress: string): string {
  // Topics are 32 bytes (64 hex chars), addresses are 20 bytes (40 hex chars)
  // "0x000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b"
  // becomes "0xab5801a7d398351b8be11c439e05c5b3259aec9b"
  return "0x" + paddedAddress.slice(26).toLowerCase();
}

export async function scanTransfers(
  blockNumber: number,
): Promise<RawTransfer[]> {
  const logs = await provider.getLogs({
    fromBlock: blockNumber,
    toBlock: blockNumber,
    topics: [TRANSFER_EVENT_TOPIC],
  });

  const transfers: RawTransfer[] = [];

  for (const log of logs) {
    try {
      transfers.push({
        tokenAddress: log.address.toLowerCase(),
        from: parseAddress(log.topics[1]),
        to: parseAddress(log.topics[2]),
        value: log.data === "0x" ? "0" : BigInt(log.data).toString(),
        txHash: log.transactionHash.toLowerCase(),
        blockNumber: blockNumber,
        logIndex: log.index,
      });
    } catch (error) {
      console.error(
        `Skipping bad log at index ${log.index} in block ${blockNumber}:`,
        error,
      );
    }
  }
  return transfers;
}

export async function storeTransfers(
  client: PoolClient,
  transfers: RawTransfer[],
  chainId: number,
) {
  if (transfers.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  transfers.forEach((t, i) => {
    const offset = i * 8;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`,
    );
    values.push(
      chainId,
      t.tokenAddress,
      t.from,
      t.to,
      t.value,
      t.txHash,
      t.blockNumber,
      t.logIndex,
    );
  });

  await client.query(
    `INSERT INTO transfers (chain_id, token_address, from_address, to_address, value, tx_hash, block_number, log_index)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (chain_id, tx_hash, log_index) DO NOTHING`,
    values,
  );
}

export async function findNewTokens(
  client: PoolClient,
  transfers: RawTransfer[],
  chainId: number,
): Promise<string[]> {
  if (transfers.length === 0) return [];

  const uniqueAddresses = [...new Set(transfers.map((t) => t.tokenAddress))];

  const result = await client.query(
    `SELECT contract_address FROM tokens WHERE chain_id = $1 AND contract_address = ANY($2)`,
    [chainId, uniqueAddresses],
  );

  const existingAddresses = new Set(
    result.rows.map((r: any) => r.contract_address.trim()),
  );

  return uniqueAddresses.filter((addr) => !existingAddresses.has(addr));
}
