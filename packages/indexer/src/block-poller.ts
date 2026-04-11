import provider from "./provider";
import { config, pool, logger, BlockEvent } from "@token-tracker/shared";
import { publishBlock } from "./kafka-producer";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getLastProcessedBlock(): Promise<number> {
  const result = await pool.query(
    "SELECT MAX(block_number) as last_block FROM blocks WHERE chain_id = $1",
    [config.CHAIN_ID],
  );
  return parseInt(result.rows[0]?.last_block) || 0;
}

export async function getLatestBlockNumber(retries = 3): Promise<number> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await provider.getBlockNumber();
    } catch (error) {
      logger.error(
        `RPC error fetching latest block number (attempt ${attempt}/${retries}):`,
        error,
      );
    }
    if (attempt < retries) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.warn(
        `Retrying latest block number fetch in ${delay}ms (attempt ${attempt}/${retries})`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Failed to fetch latest block number after all retries");
}

export async function fetchBlock(blockNumber: number, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const block = await provider.getBlock(blockNumber);
      if (!block || !block.hash) {
        return null;
      }
      return {
        block_number: block.number,
        chain_id: config.CHAIN_ID,
        block_hash: block.hash,
        parent_hash: block.parentHash,
        timestamp: block.timestamp,
        transaction_count: block.transactions.length,
      };
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

export async function startBlockPolling() {
  logger.info(
    `Starting block polling from block number: ${config.START_BLOCK}`,
  );

  let lastPublishedBlock = 0;

  while (true) {
    try {
      const lastfromDb = await getLastProcessedBlock();
      const lastProcessedBlock = Math.max(
        lastfromDb > 0 ? lastfromDb : config.START_BLOCK - 1,
        lastPublishedBlock,
      );
      const latestBlockNumber = await getLatestBlockNumber();
      if (latestBlockNumber < lastProcessedBlock) {
        logger.info(
          `Latest block number ${latestBlockNumber} is less than last processed block ${lastProcessedBlock}. Waiting...`,
        );
        await sleep(12000);
        continue;
      }
      const nextBlockNumber = lastProcessedBlock + 1;

      const rawBlockData = await fetchBlock(nextBlockNumber);
      if (!rawBlockData) {
        logger.info(
          `Block data for block number ${nextBlockNumber} is not yet available. Retrying...`,
        );
        await sleep(10000);
        continue;
      }
      const blockData: BlockEvent = {
        ...rawBlockData,
        latestBlockOnChain: latestBlockNumber,
      };
      await publishBlock(blockData);
      lastPublishedBlock = nextBlockNumber;
      logger.info(`Published block ${nextBlockNumber} to Kafka`);

      if (latestBlockNumber - lastProcessedBlock > 1) {
        logger.info(
          `Catching up: ${latestBlockNumber - lastProcessedBlock} blocks behind`,
        );
        await sleep(1000);
      }
    } catch (error) {
      logger.error("Error in block polling loop:", error);
      await sleep(5000);
    }
  }
}
