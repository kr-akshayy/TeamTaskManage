import { PrismaClient } from "@prisma/client";

// Railway (and other PaaS) may not provide DATABASE_URL unless you set it.
// Provide a safe default for SQLite to avoid crashing on boot.
const datasourceUrl = process.env.DATABASE_URL || "file:./dev.db";

export const prisma = new PrismaClient({ datasourceUrl });

