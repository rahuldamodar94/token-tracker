import { Kafka, logLevel } from "kafkajs";
import config from "./config";

const kafka = new Kafka({
  clientId: "token-tracker",
  brokers: config.KAFKA_BROKERS,
  logLevel: config.NODE_ENV === "production" ? logLevel.WARN : logLevel.INFO,
});

export default kafka;
