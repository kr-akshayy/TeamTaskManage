import express from "express";
import { prisma } from "../db.js";
import { authRequired } from "../auth.js";
import { getUserId } from "../rbac.js";

export const dashboardRouter = express.Router();

dashboardRouter.use(authRequired);

dashboardRouter.get("/", async (req, res) => {
  const userId = await getUserId(req);
  const now = new Date();

  const myTasks = await prisma.task.findMany({
    where: {
      assignedToId: userId,
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      project: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  const counts = myTasks.reduce(
    (acc, t) => {
      acc.byStatus[t.status] = (acc.byStatus[t.status] || 0) + 1;
      if (t.dueDate && t.dueDate < now && t.status !== "DONE") acc.overdue += 1;
      return acc;
    },
    { byStatus: { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 }, overdue: 0 }
  );

  return res.json({ myTasks, counts });
});

