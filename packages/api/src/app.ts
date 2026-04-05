import express from "express";
import cors from "cors";
import helmet from "helmet";
import tokenRoutes from "./routes/tokens";
import { errorHandler } from "./middleware/error-handler";
import { pool, redisClient } from "@token-tracker/shared";
import swaggerUI from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET"],
  }),
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use("/api/tokens", tokenRoutes);

app.get("/api/health-check", (req, res) => {
  res
    .status(200)
    .json({ data: "OK", message: "Health check passed", error: null });
});

app.get("/api/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1"); // Check database connectivity
    await redisClient.ping(); // Check Redis connectivity
    res
      .status(200)
      .json({ data: "OK", message: "Readiness check passed", error: null });
  } catch (error) {
    res.status(503).json({
      data: null,
      message: "Readiness check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ data: null, message: "Route not found", error: null });
});

app.use(errorHandler);

export default app;
