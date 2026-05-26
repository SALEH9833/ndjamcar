import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

interface AdminPayload { id: number; username: string; kind: string }

declare global {
  namespace Express {
    interface Request { admin?: AdminPayload }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token manquant' }); return; }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AdminPayload;
    req.admin = payload;
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

export function signToken(payload: { id: number; username: string }) {
  return jwt.sign({ ...payload, kind: 'admin' }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
