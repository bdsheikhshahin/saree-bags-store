"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAsyncRoutes = wrapAsyncRoutes;
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
function wrapAsyncRoutes(router) {
    const stack = router.stack ?? [];
    stack.forEach((layer) => {
        const route = layer.route;
        if (!route?.stack)
            return;
        route.stack.forEach((sub) => {
            const original = sub.handle;
            if (typeof original !== 'function')
                return;
            const flagged = original;
            if (flagged.__asyncWrapped)
                return;
            const wrapped = (req, res, next) => {
                try {
                    const out = original(req, res, next);
                    if (out && typeof out.then === 'function') {
                        out.then(undefined, next);
                    }
                }
                catch (err) {
                    next(err);
                }
            };
            wrapped.__asyncWrapped = true;
            sub.handle = wrapped;
        });
    });
    return router;
}
//# sourceMappingURL=asyncHandler.js.map