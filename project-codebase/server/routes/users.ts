import { z } from "zod";
import { getDb } from "../db.js";
import { makeCrudRouter } from "./crud.js";

const base = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  role: z.enum(["admin", "member"]).default("member"),
});

export const usersRouter = makeCrudRouter({
  resource: "user",
  store: () => getDb().users,
  createSchema: base,
  updateSchema: base.partial(),
});
