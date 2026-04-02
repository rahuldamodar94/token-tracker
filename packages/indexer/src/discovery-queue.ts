import { Queue } from "bullmq";
import { config } from "@token-tracker/shared";

const url = new URL(config.REDIS_URL);

const connection = {
  host: url.hostname,
  port: parseInt(url.port || "6379"),
};

export const discoveryQueue = new Queue("discovery-queue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
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
  }));
  if (jobs.length > 0) {
    await discoveryQueue.addBulk(jobs);
    console.log(`Queued ${jobs.length} tokens for discovery`);
  }
}
