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

export async function getLatestBlockNumber(): Promise<number> {
  return await provider.getBlockNumber();
}

export async function fetchBlock(blockNumber: number) {
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
  logger.info(
    `Starting block polling from block number: ${config.START_BLOCK}`,
  );

  while (true) {
    try {
      const lastfromDb = await getLastProcessedBlock();
      const lastProcessedBlock =
        lastfromDb > 0 ? lastfromDb : config.START_BLOCK;
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
          `Block data for block number ${nextBlockNumber} is null. Retrying...`,
        );
        await sleep(10000);
        continue;
      }
      const blockData: BlockEvent = {
        ...rawBlockData,
        latestBlockOnChain: latestBlockNumber,
      };
      await publishBlock(blockData);
      logger.info(`Published block ${nextBlockNumber} to Kafka`);

      if (latestBlockNumber - lastProcessedBlock > 1) {
        logger.info(`Catching up: ${latestBlockNumber - lastProcessedBlock} blocks behind`);
        await sleep(100);
      }
    } catch (error) {
      logger.error("Error occurred while fetching latest block number:", error);
      await sleep(5000);
    }
  }
}
