import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

interface AdminPayload {
  id: number;
  username: string;
  sessionToken: string;
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
    prisma.adminUser.findUnique({ where: { id: payload.id }, select: { sessionToken: true } })
      .then(user => {
        if (!user || user.sessionToken !== payload.sessionToken) {
          res.status(401).json({ error: 'Session expirée. Un autre appareil s\'est connecté.' });
          return;
        }
        req.admin = payload;
        next();
      })
      .catch(() => { res.status(401).json({ error: 'Erreur de vérification' }); });
  } catch { res.status(401).json({ error: 'Token invalide' }); }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signToken(payload: { id: number; username: string; sessionToken: string }) {
  return jwt.sign({ ...payload, kind: 'admin' }, SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string } as any);
}
