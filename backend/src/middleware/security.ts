import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

export function applySecurity(app: express.Application) {
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || '']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  }));
  app.disable('x-powered-by');
}

export function ssrCacheHeaders(seconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`);
    next();
  };
}

export function noCacheHeaders(_req: Request, res: Response, next: NextFunction) {
  res.set('Cache-Control', 'no-store');
  next();
}
