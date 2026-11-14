import type { NextFunction, Request, Response, Router } from 'express';

/**
 * Express 4 does not forward rejected promises from async route handlers to
 * the error middleware — an unhandled rejection (e.g. a Mongoose duplicate
 * key error when an admin re-uses a slug) crashes the Node process instead.
 * Wrapping each route handler forwards rejections to next(err), so the
 * error middleware can answer 409/400 instead of the process dying.
 *
 * Applied once, in index.ts, to every mounted router. Safe to call twice
 * (already-wrapped handlers are skipped).
 */
export function wrapAsyncRoutes(router: Router): Router {
  const stack = (router as unknown as { stack?: unknown[] }).stack ?? [];
  stack.forEach((layer) => {
    const route = (layer as { route?: { stack?: { handle?: unknown }[] } }).route;
    if (!route?.stack) return;
    route.stack.forEach((sub) => {
      const original = sub.handle as
        | ((req: Request, res: Response, next: NextFunction) => unknown)
        | undefined;
      if (typeof original !== 'function') return;
      const flagged = original as ((req: Request, res: Response, next: NextFunction) => unknown) & {
        __asyncWrapped?: boolean;
      };
      if (flagged.__asyncWrapped) return;
      const wrapped = (req: Request, res: Response, next: NextFunction): void => {
        try {
          const out = original(req, res, next);
          if (out && typeof (out as PromiseLike<unknown>).then === 'function') {
            (out as PromiseLike<unknown>).then(undefined, next);
          }
        } catch (err) {
          next(err);
        }
      };
      (wrapped as typeof flagged).__asyncWrapped = true;
      sub.handle = wrapped as never;
    });
  });
  return router;
}
