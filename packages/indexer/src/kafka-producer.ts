import { kafka, BlockEvent, logger } from "@token-tracker/shared";

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
  logger.info("Kafka producer connected");
}

export async function publishBlock(block: BlockEvent) {
  await producer.send({
    topic: "block-events",
    messages: [
      {
        key: String(block.block_number),
        value: JSON.stringify(block),
      },
    ],
  });
}

export async function disconnectProducer() {
  await producer.disconnect();
  logger.info("Kafka producer disconnected");
}
