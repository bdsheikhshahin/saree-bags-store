"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
// Image upload for the admin panel — stores files under the web app's
// public/images so Next.js serves them at /images/<filename>.
// Mounted at /api/admin/upload (see index.ts); admin JWT required.
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.use(auth_1.requireAuth, auth_1.requireAdmin);
const UPLOAD_DIR = node_path_1.default.resolve(__dirname, '..', '..', '..', 'web', 'public', 'images');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_BYTES = 5 * 1024 * 1024;
const storage = multer_1.default.diskStorage({
    destination(_req, _file, cb) {
        // Create the upload directory on first use (it is not in the repo yet).
        node_fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename(_req, file, cb) {
        // Safe unique filename: timestamp + random + sanitised original name.
        // basename/extname strip any directory parts, so no path traversal.
        const ext = node_path_1.default.extname(file.originalname).toLowerCase();
        const base = node_path_1.default
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 50) || 'image';
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        cb(null, `${unique}-${base}${ext}`);
    },
});
function fileFilter(_req, file, cb) {
    const ext = node_path_1.default.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
    }
}
const upload = (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: MAX_BYTES } });
exports.uploadRouter.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
//# sourceMappingURL=upload.js.map