import { connectProducer } from "./kafka-producer";
import { startBlockProcessor } from "./block-processor";
import { startBlockPolling } from "./block-poller";
import { testConnection } from "@token-tracker/shared";

async function main() {
  console.log("Starting Token Tracker Indexer...");
  await testConnection();
  await connectProducer();
  await startBlockProcessor();
  await startBlockPolling();
}

main().catch((error) => {
  console.error("Error starting indexer:", error);
  process.exit(1);
});
