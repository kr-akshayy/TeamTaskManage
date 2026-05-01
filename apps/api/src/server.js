import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { z } from "zod";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});

const env = envSchema.parse(process.env);

const app = express();
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  // simple DB check too
  await prisma.user.count();
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/tasks", tasksRouter);
app.use("/dashboard", dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

