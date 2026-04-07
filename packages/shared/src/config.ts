import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const required = ["DATABASE_URL", "REDIS_URL", "ALCHEMY_RPC"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const config = {
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  ALCHEMY_RPC: process.env.ALCHEMY_RPC!,
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "1", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  START_BLOCK: parseInt(process.env.START_BLOCK || "0", 10),
};

export default config;
