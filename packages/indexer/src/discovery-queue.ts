import { Queue } from "bullmq";
import { config, logger } from "@token-tracker/shared";

const connection = { url: config.REDIS_URL };

export const discoveryQueue = new Queue("discovery-queue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export async function addToDiscoveryQueue(
  tokenAddresses: string[],
  chainId: number,
  blockNumber: number,
) {
  const jobs = tokenAddresses.map((address) => ({
    name: "discover-token",
    data: { contractAddress: address, chainId, discoveredAtBlock: blockNumber },
    opts: { jobId: `discover-${chainId}-${address}` },
  }));
  if (jobs.length > 0) {
    await discoveryQueue.addBulk(jobs);
    logger.info(`Queued ${jobs.length} tokens for discovery`);
  }
}
