import { prisma } from "./db.js";

export async function getUserId(req) {
  return req.auth?.sub;
}

export async function requireProjectRole(projectId, userId, allowedRoles) {
  const membership = await prisma.membership.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  if (!membership) return { ok: false, status: 403, error: "Not a project member" };
  if (!allowedRoles.includes(membership.role)) return { ok: false, status: 403, error: "Insufficient role" };
  return { ok: true, role: membership.role };
}

