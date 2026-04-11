import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const required = ["DATABASE_URL", "REDIS_URL", "ALCHEMY_RPC"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function parseIntOrThrow(value: string, name: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`${name} must be a number, got: "${value}"`);
  return parsed;
}

const config = {
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  ALCHEMY_RPC: process.env.ALCHEMY_RPC!,
  CHAIN_ID: parseIntOrThrow(process.env.CHAIN_ID || "1", "CHAIN_ID"),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseIntOrThrow(process.env.PORT || "4000", "PORT"),
  START_BLOCK: parseIntOrThrow(process.env.START_BLOCK || "0", "START_BLOCK"),
};

export default config;
