import express from "express";
import cors from "cors";
import helmet from "helmet";
import tokenRoutes from "./routes/tokens";
import { errorHandler } from "./middleware/error-handler";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET"],
  }),
);

app.use(helmet());
app.use(express.json());

app.use("/api/tokens", tokenRoutes);

app.use((req, res) => {
  res.status(404).json({ data: null, message: "Route not found", error: null });
});

app.use(errorHandler);

export default app;
