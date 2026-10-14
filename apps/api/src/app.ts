import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getPool } from "./db/pool.js";
import { batchesRouter } from "./routes/batches.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "snaptext-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health/ready", async (_request, response) => {
  try {
    await getPool().query("SELECT 1");
    response.status(200).json({ status: "ready", database: "ok" });
  } catch {
    response.status(503).json({
      status: "not_ready",
      database: "unavailable"
    });
  }
});

app.use("/api", batchesRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found."
    }
  });
});
