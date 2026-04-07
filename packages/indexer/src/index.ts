import { connectProducer, disconnectProducer } from "./kafka-producer";
import consumer, { startBlockProcessor } from "./block-processor";
import { startBlockPolling } from "./block-poller";
import { testConnection, logger, pool } from "@token-tracker/shared";
import discoveryWorker from "./discovery-worker";

async function main() {
  logger.info("Starting Token Tracker Indexer...");
  await testConnection();
  await connectProducer();
  await startBlockProcessor();
  await startBlockPolling();
}

main().catch((error) => {
  logger.error("Error starting indexer:", error);
  process.exit(1);
});

async function gracefulShutdown() {
  try {
    logger.info("Shutting down indexer...");
    await consumer.disconnect();
    await disconnectProducer();
    await discoveryWorker.close();
    await pool.end();
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
  process.exit(0);
}

process.on("SIGINT", () => {
  gracefulShutdown();
});

process.on("SIGTERM", () => {
  gracefulShutdown();
});
