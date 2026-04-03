import app from "./app";
import { config, connectRedis, logger } from "@token-tracker/shared";
import pool from "@token-tracker/shared/src/db";

const PORT = config.PORT || 4000;

async function start() {
  try {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connected");
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`API server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
