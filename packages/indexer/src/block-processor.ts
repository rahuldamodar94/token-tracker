import {
  kafka,
  PoolClient,
  pool,
  BlockEvent,
  RawTransfer,
} from "@token-tracker/shared";
import {
  findNewTokens,
  scanTransfers,
  storeTransfers,
} from "./transfer-scanner";
import { addToDiscoveryQueue } from "./discovery-queue";

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

export async function startBlockProcessor() {
  await consumer.connect();
  await consumer.subscribe({ topic: "block-events", fromBeginning: true });
  console.log(
    "Block processor connected to Kafka and subscribed to block-events topic",
  );

  await consumer.run({
    eachMessage: async ({ message }) => {
      const client = await pool.connect();

      try {
        const blockData: BlockEvent = JSON.parse(message.value!.toString());
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

        console.log(
          `Block ${blockData.block_number}: stored with ${transfers.length} transfers`,
        );
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error processing block event:", error);
        throw error;
      } finally {
        await client.release();
      }
    },
  });
}
