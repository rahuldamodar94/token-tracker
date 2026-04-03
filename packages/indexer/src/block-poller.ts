import provider from "./provider";
import { config, pool, logger } from "@token-tracker/shared";
import { publishBlock } from "./kafka-producer";

async function getLastProcessedBlock(): Promise<number> {
  const result = await pool.query(
    "SELECT MAX(block_number) as last_block FROM blocks WHERE chain_id = $1",
    [config.CHAIN_ID],
  );
  return parseInt(result.rows[0]?.last_block) || 0;
}

async function getLatestBlockNumber(): Promise<number> {
  return await provider.getBlockNumber();
}

async function fetchBlock(blockNumber: number) {
  const block = await provider.getBlock(blockNumber);
  if (!block) {
    return null;
  }
  return {
    block_number: block.number,
    chain_id: config.CHAIN_ID,
    block_hash: block.hash!,
    parent_hash: block.parentHash,
    timestamp: block.timestamp,
    transaction_count: block.transactions.length,
  };
}

export async function startBlockPolling() {
  const lastfromDb = await getLastProcessedBlock();
  let lastProcessedBlock = lastfromDb > 0 ? lastfromDb : config.START_BLOCK;

  logger.info(
    `Starting block polling from block number: ${lastProcessedBlock}`,
  );

  while (true) {
    try {
      const latestBlockNumber = await getLatestBlockNumber();
      if (latestBlockNumber < lastProcessedBlock) {
        logger.info(
          `Latest block number ${latestBlockNumber} is less than last processed block ${lastProcessedBlock}. Waiting...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 12000));
        continue;
      }
      const nextBlockNumber = lastProcessedBlock + 1;

      const blockData = await fetchBlock(nextBlockNumber);
      if (!blockData) {
        logger.info(
          `Block data for block number ${nextBlockNumber} is null. Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }
      await publishBlock(blockData);
      logger.info(`Published block ${nextBlockNumber} to Kafka`);
      lastProcessedBlock = nextBlockNumber;

      if (latestBlockNumber - lastProcessedBlock > 1) {
        logger.info(
          `Catching up... Latest block: ${latestBlockNumber}, Last processed block: ${lastProcessedBlock}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100)); // Short delay to catch up faster
      }
    } catch (error) {
      logger.error(
        "Error occurred while fetching latest block number:",
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before retrying on error
    }
  }
}
