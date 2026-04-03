import { Pool } from "pg";
import config from "./config";
import logger from "./logger";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  max: 20,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
});

export async function testConnection() {
  try {
    await pool.query("SELECT NOW()");
    logger.info("Database connection successful");
  } catch (err) {
    logger.error("Database connection error", err);
  }
}

export { PoolClient } from "pg";

export default pool;
