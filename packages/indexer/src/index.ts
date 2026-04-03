import { connectProducer } from "./kafka-producer";
import { startBlockProcessor } from "./block-processor";
import { startBlockPolling } from "./block-poller";
import { testConnection, logger } from "@token-tracker/shared";
import "./discovery-worker";

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
