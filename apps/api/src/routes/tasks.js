import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authRequired } from "../auth.js";
import { validate } from "../validate.js";
import { getUserId, requireProjectRole } from "../rbac.js";

export const tasksRouter = express.Router();

tasksRouter.use(authRequired);

const listSchema = z.object({
  query: z.object({
    projectId: z.string().min(1),
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
    assignedToMe: z.coerce.boolean().optional(),
    overdue: z.coerce.boolean().optional(),
  }),
});

tasksRouter.get("/", validate(listSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { projectId, status, assignedToMe, overdue } = req.validated.query;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN", "MEMBER"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
      ...(assignedToMe ? { assignedToId: userId } : {}),
      ...(overdue ? { dueDate: { lt: now }, status: { not: "DONE" } } : {}),
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      createdBy: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
    },
  });

  return res.json({ tasks });
});

const createSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().min(1).optional(),
  }),
});

tasksRouter.post("/", validate(createSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { projectId, title, description, dueDate, assignedToId } = req.validated.body;

  const roleCheck = await requireProjectRole(projectId, userId, ["ADMIN", "MEMBER"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  if (assignedToId) {
    const member = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: assignedToId, projectId } },
      select: { id: true },
    });
    if (!member) return res.status(400).json({ error: "Assignee must be a project member" });
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: userId,
      assignedToId: assignedToId || null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      createdBy: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
    },
  });

  return res.status(201).json({ task });
});

const patchSchema = z.object({
  params: z.object({ taskId: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    assignedToId: z.string().min(1).nullable().optional(),
  }),
});

tasksRouter.patch("/:taskId", validate(patchSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { taskId } = req.validated.params;
  const { title, description, status, dueDate, assignedToId } = req.validated.body;

  const existing = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, assignedToId: true } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const roleCheck = await requireProjectRole(existing.projectId, userId, ["ADMIN", "MEMBER"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  const isAdmin = roleCheck.role === "ADMIN";
  const isAssignee = existing.assignedToId && existing.assignedToId === userId;

  // Members can only update status of tasks assigned to them; admins can update everything.
  if (!isAdmin) {
    const allowedKeys = new Set(["status"]);
    const keys = Object.keys(req.validated.body);
    const allAllowed = keys.every((k) => allowedKeys.has(k));
    if (!allAllowed) return res.status(403).json({ error: "Members can only update status" });
    if (!isAssignee) return res.status(403).json({ error: "Only assignee can update status" });
  }

  if (assignedToId !== undefined) {
    if (!isAdmin) return res.status(403).json({ error: "Only admins can reassign tasks" });
    if (assignedToId) {
      const member = await prisma.membership.findUnique({
        where: { userId_projectId: { userId: assignedToId, projectId: existing.projectId } },
        select: { id: true },
      });
      if (!member) return res.status(400).json({ error: "Assignee must be a project member" });
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(assignedToId !== undefined ? { assignedToId: assignedToId || null } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      createdBy: { select: { id: true, email: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
    },
  });

  return res.json({ task });
});

const deleteSchema = z.object({
  params: z.object({ taskId: z.string().min(1) }),
});

tasksRouter.delete("/:taskId", validate(deleteSchema), async (req, res) => {
  const userId = await getUserId(req);
  const { taskId } = req.validated.params;

  const existing = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const roleCheck = await requireProjectRole(existing.projectId, userId, ["ADMIN"]);
  if (!roleCheck.ok) return res.status(roleCheck.status).json({ error: roleCheck.error });

  await prisma.task.delete({ where: { id: taskId } });
  return res.status(204).send();
});

