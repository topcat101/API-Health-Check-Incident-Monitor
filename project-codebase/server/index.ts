import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { usersRouter } from "./routes/users.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { notesRouter } from "./routes/notes.js";
import { getDb } from "./db.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: config.nodeEnv,
    db: getDb().kind,
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Mock REST API",
    version: "1.0.0",
    resources: ["users", "projects", "tasks", "notes"],
    docs: "See the front-end explorer for interactive documentation.",
  });
});

app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(
    `API listening on http://localhost:${config.port} (env=${config.nodeEnv}, db=${getDb().kind})`,
  );
});
