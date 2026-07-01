import { Router, type Request, type Response, type NextFunction } from "express";
import type { ZodType } from "zod";
import type { Entity, Store } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../logger.js";

export function makeCrudRouter<T extends Entity>(opts: {
  resource: string;
  store: () => Store<T>;
  createSchema: ZodType<Omit<T, "id" | "createdAt" | "updatedAt">>;
  updateSchema: ZodType<Partial<Omit<T, "id" | "createdAt" | "updatedAt">>>;
}) {
  const r = Router();
  const asyncH =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) =>
      fn(req, res, next).catch(next);

  r.get(
    "/",
    asyncH(async (_req, res) => {
      const items = await opts.store().list();
      res.status(200).json({ data: items, count: items.length });
    }),
  );

  r.get(
    "/:id",
    asyncH(async (req, res) => {
      const item = await opts.store().get(req.params.id);
      if (!item) throw new HttpError(404, `${opts.resource} ${req.params.id} not found`);
      res.status(200).json({ data: item });
    }),
  );

  r.post(
    "/",
    asyncH(async (req, res) => {
      const parsed = opts.createSchema.parse(req.body);
      const item = await opts.store().create(parsed);
      logger.info(`${opts.resource} created`, { id: item.id });
      res.status(201).json({ data: item });
    }),
  );

  r.put(
    "/:id",
    asyncH(async (req, res) => {
      const parsed = opts.updateSchema.parse(req.body);
      const item = await opts.store().update(req.params.id, parsed);
      if (!item) throw new HttpError(404, `${opts.resource} ${req.params.id} not found`);
      logger.info(`${opts.resource} updated`, { id: item.id });
      res.status(200).json({ data: item });
    }),
  );

  r.delete(
    "/:id",
    asyncH(async (req, res) => {
      const ok = await opts.store().delete(req.params.id);
      if (!ok) throw new HttpError(404, `${opts.resource} ${req.params.id} not found`);
      logger.info(`${opts.resource} deleted`, { id: req.params.id });
      res.status(204).send();
    }),
  );

  return r;
}
