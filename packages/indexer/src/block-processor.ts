import {
  kafka,
  PoolClient,
  pool,
  BlockEvent,
  RawTransfer,
  logger,
} from "@token-tracker/shared";
import {
  findNewTokens,
  scanTransfers,
  storeTransfers,
} from "./transfer-scanner";
import { addToDiscoveryQueue } from "./discovery-queue";
import { fetchBlock } from "./block-poller";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const consumer = kafka.consumer({ groupId: "block-processors" });

export async function storeBlock(client: PoolClient, block: BlockEvent) {
  await client.query(
    "INSERT INTO blocks ( block_number, chain_id, block_hash, parent_hash, status, indexed_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (block_number, chain_id) DO NOTHING",
    [
      block.block_number,
      block.chain_id,
      block.block_hash,
      block.parent_hash,
      "provisional",
    ],
  );
}

async function fetchBlockWithRetry(
  blockNumber: number,
  retries = 3,
): Promise<ReturnType<typeof fetchBlock>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const block = await fetchBlock(blockNumber);
      if (block) return block;
    } catch (error) {
      logger.error(
        `RPC error fetching block ${blockNumber} (attempt ${attempt}/${retries}):`,
        error,
      );
    }

    if (attempt < retries) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.warn(
        `Retrying block ${blockNumber} in ${delay}ms (attempt ${attempt}/${retries})`,
      );
      await sleep(delay);
    }
  }
  return null;
}

async function checkForReorg(block: BlockEvent): Promise<number | null> {
  const previousBlockFromDb = await pool.query(
    "SELECT block_hash FROM blocks WHERE block_number = $1 AND chain_id = $2",
    [block.block_number - 1, block.chain_id],
  );

  if (
    !previousBlockFromDb.rows.length ||
    previousBlockFromDb.rows[0].block_hash === block.parent_hash
  ) {
    return null;
  }
  return getForkPoint(block.block_number - 1, block.chain_id);
}

async function getForkPoint(
  block_number: number,
  chain_id: number,
): Promise<number> {
  const blockFromChain = await fetchBlockWithRetry(block_number);
  const dbResult = await pool.query(
    "SELECT block_hash FROM blocks WHERE block_number = $1 AND chain_id = $2",
    [block_number - 1, chain_id],
  );

  if (!blockFromChain) {
    throw new Error(
      `RPC failure: could not fetch block ${block_number} after retries during reorg detection`,
    );
  }

  if (!dbResult.rows.length) {
    logger.warn(
      `DB gap detected: block ${block_number - 1} not found in DB during reorg detection, using ${block_number} as fork point`,
    );
    return block_number;
  }

  if (blockFromChain.parent_hash === dbResult.rows[0].block_hash) {
    return block_number;
  }

  return getForkPoint(block_number - 1, chain_id);
}

async function handleReorg(
  client: PoolClient,
  blockData: BlockEvent,
): Promise<boolean> {
  if (blockData.latestBlockOnChain - blockData.block_number >= 64) return false;

  const forkPoint = await checkForReorg(blockData);
  if (forkPoint === null) return false;

  logger.warn(
    `Reorg detected at block ${blockData.block_number}. Fork point: ${forkPoint}`,
  );
  await client.query("BEGIN");
  await client.query(
    "DELETE FROM transfers WHERE block_number >= $1 AND chain_id = $2",
    [forkPoint, blockData.chain_id],
  );
  await client.query(
    "DELETE FROM blocks WHERE block_number >= $1 AND chain_id = $2",
    [forkPoint, blockData.chain_id],
  );
  await client.query("COMMIT");
  logger.info(`Rolled back blocks from ${forkPoint} onwards`);
  return true;
}

export async function startBlockProcessor() {
  await consumer.connect();
  await consumer.subscribe({ topic: "block-events", fromBeginning: true });
  logger.info(
    "Block processor connected to Kafka and subscribed to block-events topic",
  );

  await consumer.run({
    eachMessage: async ({ message }) => {
      const client = await pool.connect();

      try {
        if (!message.value) {
          logger.warn("Received empty Kafka message, skipping");
          return;
        }

        let blockData: BlockEvent;
        try {
          blockData = JSON.parse(message.value.toString());
        } catch (parseError) {
          logger.error("Failed to parse block event, skipping:", {
            value: message.value.toString().slice(0, 200),
          });
          return;
        }

        if (await handleReorg(client, blockData)) return;

        const transfers: RawTransfer[] = await scanTransfers(
          blockData.block_number,
        );

        await client.query("BEGIN");
        await storeBlock(client, blockData);
        await storeTransfers(client, transfers, blockData.chain_id);

        const newTokens = await findNewTokens(
          client,
          transfers,
          blockData.chain_id,
        );

        await client.query("COMMIT");

        if (newTokens.length > 0) {
          addToDiscoveryQueue(
            newTokens,
            blockData.chain_id,
            blockData.block_number,
          );
        }

        logger.info(
          `Block ${blockData.block_number}: stored with ${transfers.length} transfers`,
        );
      } catch (error) {
        await client.query("ROLLBACK");
        logger.error("Error processing block event:", error);
        throw error;
      } finally {
        await client.release();
      }
    },
  });
}
