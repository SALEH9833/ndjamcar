import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const geofences = await prisma.geofence.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: geofences });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(1).max(100),
      points: z.string().min(10),
      isActive: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const geofence = await prisma.geofence.create({ data: parsed.data });
    res.status(201).json({ success: true, data: geofence });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { name, points, isActive } = req.body;
    const geofence = await prisma.geofence.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(points !== undefined && { points }), ...(isActive !== undefined && { isActive }) },
    });
    res.json({ success: true, data: geofence });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.geofence.delete({ where: { id } });
    res.json({ success: true, message: 'Zone supprimée' });
  } catch (err) { next(err); }
});

router.get('/alerts', async (req, res, next) => {
  try {
    const { unread } = req.query;
    const where: any = {};
    if (unread === 'true') where.isRead = false;
    const alerts = await prisma.geofenceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
});

router.put('/alerts/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.geofenceAlert.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/check', async (req, res, next) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) { res.status(404).json({ error: 'Véhicule introuvable' }); return; }
    const geofences = await prisma.geofence.findMany({ where: { isActive: true } });
    const violations: any[] = [];
    for (const gf of geofences) {
      const points = JSON.parse(gf.points);
      if (!isInsidePolygon(latitude, longitude, points)) {
        violations.push(gf);
        await prisma.geofenceAlert.create({
          data: { vehicleId, geofenceId: gf.id, type: 'EXIT', latitude, longitude },
        });
      }
    }
    res.json({ success: true, violations: violations.length, data: violations });
  } catch (err) { next(err); }
});

function isInsidePolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export default router;
