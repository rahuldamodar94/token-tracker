import { kafka, pool, BlockEvent } from "@token-tracker/shared";

const consumer = kafka.consumer({ groupId: "block-processors" });

export async function storeBlock(block: BlockEvent) {
  await pool.query(
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
      try {
        const blockData: BlockEvent = JSON.parse(message.value!.toString());
        await storeBlock(blockData);
        console.log(`Stored block ${blockData.block_number} in database`);
      } catch (error) {
        console.error("Error processing block event:", error);
      }
    },
  });
}
