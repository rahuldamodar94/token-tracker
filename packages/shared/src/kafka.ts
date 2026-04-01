import { Kafka, logLevel } from "kafkajs";
import config from "./config";

const kafka = new Kafka({
  clientId: "token-tracker",
  brokers: config.KAFKA_BROKERS,
  logLevel: config.NODE_ENV === "production" ? logLevel.WARN : logLevel.INFO,
});

// export const producer = kafka.producer();
// export const consumer = kafka.consumer({ groupId: 'token-tracker-indexer' });

// export async function connectKafka() {
//   await producer.connect();
//   await consumer.connect();
//   console.log("Kafka producer and consumer connected");
// }

// export async function disconnectKafka() {
//   await producer.disconnect();
//   await consumer.disconnect();
// }

export default kafka;
