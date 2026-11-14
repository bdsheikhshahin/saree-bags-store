import type { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  const coded = err as Error & { code?: number; name?: string };
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

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
