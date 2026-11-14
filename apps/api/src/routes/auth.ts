import bcrypt from 'bcryptjs';
import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { isDbConnected } from '../config/db';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';

// Phase 1: register/login stubs that work against MongoDB when connected.
// Without a DB they return a clear 503 instead of silently succeeding.
export const authRouter = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB to register users' }); return; }
  const { name, email, password } = parsed.data;
  const existing = await UserModel.findOne({ email });
  if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name: name ?? email.split('@')[0], email, passwordHash, role: 'customer' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB to log in' }); return; }
  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Any logged-in user changes their OWN password (id comes from their JWT).
authRouter.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB to change password' }); return; }
  const user = await UserModel.findById(req.user?.id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { currentPassword, newPassword } = parsed.data;
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    // 400, not 401: the admin client treats 401 as "session expired" and logs out.
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
});
