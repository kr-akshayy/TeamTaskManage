import jwt from "jsonwebtoken";
import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
});

function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid API env: ${msg}`);
  }
  return parsed.data;
}

export function signAccessToken(user) {
  const env = getEnv();
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function authRequired(req, res, next) {
  const auth = req.header("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

