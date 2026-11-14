"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFound = notFound;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    console.error(err);
    const coded = err;
    if (coded.code === 11000) {
        res.status(409).json({ error: 'Already exists — a record with this slug already exists' });
        return;
    }
    if (coded.name === 'ValidationError') {
        res.status(400).json({ error: err.message });
        return;
    }
    res.status(500).json({ error: 'Internal server error' });
}
function notFound(_req, res) {
    res.status(404).json({ error: 'Not found' });
}
//# sourceMappingURL=errorHandler.js.map