import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().min(1).optional(),
});

const env = envSchema.parse(process.env);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If the API serves the built web app (same-origin), CORS isn't required.
if (env.WEB_ORIGIN) {
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
}
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

// Serve built SPA (optional) for single-service deployments.
const webDist = path.resolve(__dirname, "../../web/dist");
const webIndex = path.join(webDist, "index.html");
if (fs.existsSync(webIndex)) {
  app.use(express.static(webDist));
  // Express 5 (path-to-regexp v6) is strict about wildcard route patterns.
  // Use a catch-all middleware instead of app.get("*"/"/*").
  app.use((req, res, next) => {
    if (
      req.path.startsWith("/auth") ||
      req.path.startsWith("/projects") ||
      req.path.startsWith("/tasks") ||
      req.path.startsWith("/dashboard") ||
      req.path.startsWith("/health")
    ) {
      return next();
    }
    return res.sendFile(webIndex);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${env.PORT}`);
});

