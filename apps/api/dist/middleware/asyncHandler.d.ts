import type { Router } from 'express';
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
export declare function wrapAsyncRoutes(router: Router): Router;
//# sourceMappingURL=asyncHandler.d.ts.map