import { createClient } from "redis";
import config from "./config";

const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

export async function connectRedis() {
  await redisClient.connect();
}

export default redisClient;