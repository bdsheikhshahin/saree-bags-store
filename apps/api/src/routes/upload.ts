import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import multer, { type FileFilterCallback } from 'multer';
import { requireAdmin, requireAuth, type AuthRequest } from '../middleware/auth';

// Image upload for the admin panel — stores files under the web app's
// public/images so Next.js serves them at /images/<filename>.
// Mounted at /api/admin/upload (see index.ts); admin JWT required.
export const uploadRouter = Router();
uploadRouter.use(requireAuth, requireAdmin);

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', 'web', 'public', 'images');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    // Create the upload directory on first use (it is not in the repo yet).
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    // Safe unique filename: timestamp + random + sanitised original name.
    // basename/extname strip any directory parts, so no path traversal.
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50) || 'image';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${unique}-${base}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES } });

uploadRouter.post('/', (req: AuthRequest, res: Response) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message;
      res.status(400).json({ error: message });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No image file received (field name "image")' });
      return;
    }
    res.status(201).json({ url: `/images/${req.file.filename}` });
  });
});
