import { z } from "zod";
import { getDb } from "../db.js";
import { makeCrudRouter } from "./crud.js";

const base = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(10_000).default(""),
  authorId: z.string().trim().min(1),
});

export const notesRouter = makeCrudRouter({
  resource: "note",
  store: () => getDb().notes,
  createSchema: base,
  updateSchema: base.partial(),
});
