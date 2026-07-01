import { z } from "zod";
import { getDb } from "../db.js";
import { makeCrudRouter } from "./crud.js";

const base = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  ownerId: z.string().trim().min(1),
});

export const projectsRouter = makeCrudRouter({
  resource: "project",
  store: () => getDb().projects,
  createSchema: base,
  updateSchema: base.partial(),
});
