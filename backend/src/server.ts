import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';

import prisma from './prisma';
import { applySecurity } from './middleware/security';
import { notFoundHandler, errorHandler } from './middleware/error';
import { startScheduler } from './lib/scheduler';
import { startTraccarSync } from './lib/traccar';

import authRoutes from './routes/auth.routes';
import brandsRoutes from './routes/brands.routes';
import modelsRoutes from './routes/models.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import reservationsRoutes from './routes/reservations.routes';
import trackingRoutes from './routes/tracking.routes';
import contactRoutes from './routes/contact.routes';
import contentRoutes from './routes/content.routes';
import geofenceRoutes from './routes/geofence.routes';

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
app.use('/api/geofences', geofenceRoutes);

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

async function seedBrandsAndModels(): Promise<void> {
  try {
    const count = await prisma.brand.count();
    if (count > 0) return;
    const data: Record<string, string[]> = {
      'Toyota': ['Corolla','Hilux','Land Cruiser','RAV4','Camry','Prado','Fortuner','Yaris','Rush','Avanza'],
      'Hyundai': ['Tucson','Santa Fe','Accent','Creta','Elantra','Sonata','i10','i20'],
      'Nissan': ['Patrol','X-Trail','Navara','Sentra','Sunny','Kicks','Pathfinder'],
      'Mercedes-Benz': ['Classe C','Classe E','Classe S','GLE','GLC','Classe A','Sprinter'],
      'Suzuki': ['Jimny','Swift','Vitara','Alto','Dzire','Ertiga'],
      'Mitsubishi': ['L200','Pajero','Outlander','ASX','Eclipse Cross'],
      'BMW': ['Série 3','Série 5','X3','X5','Série 7','X1'],
      'Renault': ['Duster','Clio','Symbol','Megane','Kwid','Logan'],
      'Peugeot': ['3008','2008','208','301','508','Partner'],
      'Kia': ['Sportage','Sorento','Picanto','Rio','Seltos','Carnival'],
      'Honda': ['Civic','CR-V','HR-V','Accord','City'],
      'Ford': ['Ranger','Everest','Focus','EcoSport','Explorer'],
      'Volkswagen': ['Golf','Tiguan','Polo','Passat','Touareg','Amarok'],
      'Lexus': ['RX','LX','NX','ES','GX'],
    };
    let order = 1;
    for (const [brandName, models] of Object.entries(data)) {
      const brand = await prisma.brand.create({ data: { name: brandName, order: order++ } });
      await prisma.model.createMany({ data: models.map(name => ({ name, brandId: brand.id })) });
    }
    console.log(`[Bootstrap] ${Object.keys(data).length} marques et modèles créés`);
  } catch (err) {
    console.error('[Bootstrap] Seed brands failed:', err);
  }
}

async function seedContent(): Promise<void> {
  try {
    const count = await prisma.siteContent.count();
    if (count > 0) return;
    const defaults = [
      { key: 'hero_title', value: 'Louez votre voiture en toute simplicité', label: 'Titre principal', type: 'text', group: 'hero' },
      { key: 'hero_subtitle', value: 'Large choix de véhicules pour tous vos besoins. Réservez en quelques clics et contactez-nous directement via WhatsApp.', label: 'Sous-titre principal', type: 'textarea', group: 'hero' },
      { key: 'phone', value: '+235 60 93 57 74', label: 'Téléphone', type: 'text', group: 'contact' },
      { key: 'email', value: 'contact@ndjamcar.com', label: 'Email', type: 'text', group: 'contact' },
      { key: 'address', value: "N'Djaména, Tchad", label: 'Adresse', type: 'text', group: 'contact' },
      { key: 'whatsapp', value: '23560935774', label: 'Numéro WhatsApp', type: 'text', group: 'contact' },
      { key: 'about_text', value: "Service de location de voitures de confiance à N'Djaména, Tchad. Large gamme de véhicules pour tous vos besoins.", label: 'Texte à propos', type: 'textarea', group: 'general' },
      { key: 'footer_text', value: '© 2026 NdjamCar. Tous droits réservés.', label: 'Texte footer', type: 'text', group: 'general' },
    ];
    await prisma.siteContent.createMany({ data: defaults });
    console.log('[Bootstrap] Contenu par défaut créé');
  } catch (err) {
    console.error('[Bootstrap] Seed content failed:', err);
  }
}

(async () => {
  await bootstrap();
  await seedBrandsAndModels();
  await seedContent();
  startScheduler();
  startTraccarSync();
  app.listen(PORT, () => {
    console.log(`\n🚗 NdjamCar Backend running`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/health\n`);
  });
})();
