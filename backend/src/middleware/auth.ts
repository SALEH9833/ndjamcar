import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

interface AdminPayload {
  id: number;
  username: string;
  role: string;
  agencyId: number | null;
  kind: string;
}

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

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token manquant' }); return; }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AdminPayload;
    if (payload.role !== 'SUPER_ADMIN') { res.status(403).json({ error: 'Accès réservé au super-admin' }); return; }
    req.admin = payload;
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

export function signToken(payload: { id: number; username: string; role: string; agencyId: number | null }) {
  return jwt.sign({ ...payload, kind: 'admin' }, SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string } as any);
}

export function getAgencyFilter(req: Request) {
  if (req.admin?.role === 'SUPER_ADMIN') return {};
  return { agencyId: req.admin?.agencyId || 0 };
}
