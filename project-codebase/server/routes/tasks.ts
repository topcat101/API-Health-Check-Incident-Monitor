import { z } from "zod";
import { getDb } from "../db.js";
import { makeCrudRouter } from "./crud.js";

const base = z.object({
  title: z.string().trim().min(1).max(200),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  projectId: z.string().trim().min(1),
  assigneeId: z.string().trim().min(1).nullable().default(null),
});

export const tasksRouter = makeCrudRouter({
  resource: "task",
  store: () => getDb().tasks,
  createSchema: base,
  updateSchema: base.partial(),
});
