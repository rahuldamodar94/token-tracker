import { kafka, BlockEvent } from "@token-tracker/shared";

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
  console.log("Kafka producer connected");
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
  console.log("Kafka producer disconnected");
}
