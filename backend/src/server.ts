import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';

import prisma from './prisma';
import { applySecurity } from './middleware/security';
import { notFoundHandler, errorHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import brandsRoutes from './routes/brands.routes';
import modelsRoutes from './routes/models.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import reservationsRoutes from './routes/reservations.routes';
import trackingRoutes from './routes/tracking.routes';
import contactRoutes from './routes/contact.routes';
import contentRoutes from './routes/content.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

applySecurity(app);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString() });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('[Bootstrap] ADMIN_PASSWORD missing');
    return;
  }
  try {
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      console.log(`[Bootstrap] Admin "${username}" exists`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({
      data: { username, passwordHash, email: process.env.ADMIN_EMAIL || null },
    });
    console.log(`[Bootstrap] Admin "${username}" created`);
  } catch (err) {
    console.error('[Bootstrap] Failed:', err);
  }
}

(async () => {
  await bootstrap();
  app.listen(PORT, () => {
    console.log(`\n🚗 NdjamCar Backend running`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/health\n`);
  });
})();
