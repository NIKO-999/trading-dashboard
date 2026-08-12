/* ============================================================
   Screenshot uploads → data/media/

   Writes only ever land in data/media — never in the vault. This is what
   makes journaling from the phone's camera roll work at all.
   ============================================================ */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import multer from 'multer';
import { MEDIA_DIR } from './config.mjs';

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);
const MAX_BYTES = 20 * 1024 * 1024;

export async function ensureMediaDir() {
  await mkdir(MEDIA_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client filename — derive our own, keep only the extension.
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 6) || '.png';
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error('Unsupported image type'));
    cb(null, true);
  },
});

export function mediaRouter() {
  const router = express.Router();

  router.post('/', (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      res.json({ url: `/media/${req.file.filename}`, name: req.file.filename });
    });
  });

  return router;
}
