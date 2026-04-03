import { createClient } from "redis";
import config from "./config";
import logger from "./logger";

const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => {
  logger.error("Redis error", err);
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

export async function connectRedis() {
  await redisClient.connect();
}

export async function setCache(key: string, value: any, ttlSeconds?: number) {
  const stringValue = JSON.stringify(value);
  if (ttlSeconds) {
    await redisClient.setEx(key, ttlSeconds, stringValue);
  } else {
    await redisClient.set(key, stringValue);
  }
}

export async function getCache(key: string) {
  const value = await redisClient.get(key);
  if (value) {
    return JSON.parse(value);
  }
  return null;
}

export default redisClient;
