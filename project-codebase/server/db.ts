import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { logger } from "./logger.js";

export type Entity = { id: string; createdAt: string; updatedAt: string };

export interface Store<T extends Entity> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

class InMemoryStore<T extends Entity> implements Store<T> {
  private items = new Map<string, T>();
  constructor(seed: T[] = []) {
    seed.forEach((i) => this.items.set(i.id, i));
  }
  async list() {
    return [...this.items.values()];
  }
  async get(id: string) {
    return this.items.get(id) ?? null;
  }
  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const item = { ...data, id: randomUUID(), createdAt: now, updatedAt: now } as T;
    this.items.set(item.id, item);
    return item;
  }
  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>) {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() } as T;
    this.items.set(id, updated);
    return updated;
  }
  async delete(id: string) {
    return this.items.delete(id);
  }
}

export type User = Entity & { name: string; email: string; role: "admin" | "member" };
export type Project = Entity & { name: string; description: string; ownerId: string };
export type Task = Entity & {
  title: string;
  status: "todo" | "in_progress" | "done";
  projectId: string;
  assigneeId: string | null;
};
export type Note = Entity & { title: string; body: string; authorId: string };

const now = new Date().toISOString();
const u1 = { id: "u_1", name: "Ada Lovelace", email: "ada@example.com", role: "admin" as const, createdAt: now, updatedAt: now };
const u2 = { id: "u_2", name: "Alan Turing", email: "alan@example.com", role: "member" as const, createdAt: now, updatedAt: now };
const p1 = { id: "p_1", name: "Analytical Engine", description: "First mechanical computer", ownerId: "u_1", createdAt: now, updatedAt: now };

export interface Database {
  kind: "memory" | "external";
  users: Store<User>;
  projects: Store<Project>;
  tasks: Store<Task>;
  notes: Store<Note>;
}

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;
  if (config.databaseUrl) {
    // Stub: real driver (pg, mysql2, etc.) would be initialized here based on DATABASE_URL.
    logger.info("DATABASE_URL detected — plug your driver into server/db.ts", {
      url: config.databaseUrl.replace(/:\/\/[^@]+@/, "://***@"),
    });
  } else {
    logger.warn("No DATABASE_URL set — using in-memory store. Data resets on restart.");
  }
  db = {
    kind: config.databaseUrl ? "external" : "memory",
    users: new InMemoryStore<User>([u1, u2]),
    projects: new InMemoryStore<Project>([p1]),
    tasks: new InMemoryStore<Task>([
      { id: "t_1", title: "Design punch cards", status: "in_progress", projectId: "p_1", assigneeId: "u_1", createdAt: now, updatedAt: now },
    ]),
    notes: new InMemoryStore<Note>([
      { id: "n_1", title: "Kickoff", body: "Meeting notes from project kickoff.", authorId: "u_1", createdAt: now, updatedAt: now },
    ]),
  };
  return db;
}
