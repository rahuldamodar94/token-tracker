import app from "./app";
import http from "http";
import register from "./metrics";

import {
  config,
  connectRedis,
  logger,
  pool,
  redisClient,
} from "@token-tracker/shared";

const PORT = config.PORT || 4000;

async function start() {
  try {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connected");
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info(`API server is running on port ${PORT}`);
    });

    const metricsServer = http.createServer(async (req, res) => {
      if (req.url === "/metrics") {
        res.setHeader("Content-Type", register.contentType);
        res.end(await register.metrics());
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    metricsServer.listen(9100, () => {
      logger.info("Metrics server running on port 9100");
    });

    const gracefulShutdown = async () => {
      try {
        logger.info("Shutting down API...");
        server.close();
        metricsServer.close();
        await pool.end();
        await redisClient.quit();
      } catch (error) {
        logger.error("Error during shutdown:", error);
        process.exit(1);
      }
      process.exit(0);
    };

    process.on("SIGINT", () => {
      gracefulShutdown();
    });

    process.on("SIGTERM", () => {
      gracefulShutdown();
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
