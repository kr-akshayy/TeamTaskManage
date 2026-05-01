import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { signAccessToken } from "../auth.js";
import { validate } from "../validate.js";

export const authRouter = express.Router();

const signupSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(200),
    name: z.string().min(1).max(120).optional(),
  }),
});

authRouter.post("/signup", validate(signupSchema), async (req, res) => {
  const { email, password, name } = req.validated.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signAccessToken(user);
  return res.status(201).json({ token, user });
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(200),
  }),
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken(user);
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
});

