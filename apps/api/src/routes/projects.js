import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authRequired } from "../auth.js";
import { validate } from "../validate.js";
import { getUserId, requireProjectRole } from "../rbac.js";

export const projectsRouter = express.Router();

projectsRouter.use(authRequired);

projectsRouter.get("/", async (req, res) => {
  const userId = await getUserId(req);
  const projects = await prisma.project.findMany({
    where: { memberships: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      createdAt: true,
      memberships: { where: { userId }, select: { role: true } },
      _count: { select: { tasks: true, memberships: true } },
    },
  });

  const shaped = projects.map((p) => ({
    ...p,
    myRole: p.memberships[0]?.role ?? "MEMBER",
    counts: p._count,
    memberships: undefined,
    _count: undefined,
  }));

  return res.json({ projects: shaped });
});

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
  }),
});

projectsRouter.post("/", validate(createProjectSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { name, description } = req.validated.body;

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      memberships: { create: { userId, role: "ADMIN" } },
    },
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });

  return res.status(201).json({ project });
});

const updateProjectSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
  }),
});

projectsRouter.patch("/:projectId", validate(updateProjectSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { projectId } = req.validated.params;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  const { name, description } = req.validated.body;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });

  return res.json({ project });
});

// Members
projectsRouter.get("/:projectId/members", async (req, res) => {
  const userId = await getUserId(req);
  const { projectId } = req.params;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN", "MEMBER"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  const members = await prisma.membership.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
  });
  return res.json({ members });
});

const addMemberSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  }),
});

projectsRouter.post("/:projectId/members", validate(addMemberSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { projectId } = req.validated.params;
  const { email, role } = req.validated.body;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const membership = await prisma.membership.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    update: { role },
    create: { userId: user.id, projectId, role },
    select: { id: true, role: true, createdAt: true },
  });

  return res.status(201).json({ membership: { ...membership, user } });
});

const removeMemberSchema = z.object({
  params: z.object({
    projectId: z.string().min(1),
    memberUserId: z.string().min(1),
  }),
});

projectsRouter.delete("/:projectId/members/:memberUserId", validate(removeMemberSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { projectId, memberUserId } = req.validated.params;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  // prevent removing last admin
  const admins = await prisma.membership.count({ where: { projectId, role: "ADMIN" } });
  const target = await prisma.membership.findUnique({
    where: { userId_projectId: { userId: memberUserId, projectId } },
    select: { role: true },
  });
  if (!target) return res.status(404).json({ error: "Membership not found" });
  if (target.role === "ADMIN" && admins <= 1) return res.status(400).json({ error: "Cannot remove last admin" });

  await prisma.membership.delete({ where: { userId_projectId: { userId: memberUserId, projectId } } });
  return res.status(204).send();
});

