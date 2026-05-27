import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { ssrCacheHeaders } from '../middleware/security';
import { upload, uploadToCloudinary } from '../middleware/upload';

const router = Router();

const vehicleSchema = z.object({
  modelId: z.number().int().positive(),
  year: z.number().int().min(1990).max(2030),
  color: z.string().trim().max(50).optional().nullable(),
  plateNumber: z.string().trim().min(2).max(20),
  seats: z.number().int().min(1).max(50).default(5),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).default('MANUAL'),
  fuelType: z.enum(['ESSENCE', 'DIESEL', 'HYBRID', 'ELECTRIC']).default('ESSENCE'),
  pricePerDay: z.number().int().positive(),
  pricePerWeek: z.number().int().positive().optional().nullable(),
  pricePerMonth: z.number().int().positive().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  features: z.string().max(1000).optional().nullable(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']).default('AVAILABLE'),
  mileage: z.number().int().min(0).optional().nullable(),
  isFeatured: z.boolean().default(false),
});

router.get('/', ssrCacheHeaders(30), async (req, res, next) => {
  try {
    const { brand, model, status, transmission, fuel, minPrice, maxPrice, seats, featured } = req.query;
    const where: any = {};
    if (status) where.status = status;
    else where.status = { in: ['AVAILABLE', 'RENTED'] };
    if (transmission) where.transmission = transmission;
    if (fuel) where.fuelType = fuel;
    if (seats) where.seats = { gte: parseInt(seats as string) };
    if (minPrice) where.pricePerDay = { ...where.pricePerDay, gte: parseInt(minPrice as string) };
    if (maxPrice) where.pricePerDay = { ...where.pricePerDay, lte: parseInt(maxPrice as string) };
    if (featured === 'true') where.isFeatured = true;
    if (brand) where.model = { brandId: parseInt(brand as string) };
    if (model) where.modelId = parseInt(model as string);

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        model: { include: { brand: { select: { id: true, name: true, logoUrl: true } } } },
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.get('/all', requireAdmin, async (_req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        model: { include: { brand: true } },
        images: { orderBy: { order: 'asc' } },
        reservations: { where: { status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } }, take: 1, orderBy: { startDate: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.get('/stats', requireAdmin, async (_req, res, next) => {
  try {
    const [total, available, rented, maintenance] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'RENTED' } }),
      prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
    ]);
    const pendingReservations = await prisma.reservation.count({ where: { status: 'PENDING' } });
    res.json({
      success: true,
      data: { total, available, rented, maintenance, pendingReservations },
    });
  } catch (err) { next(err); }
});

router.get('/:id', ssrCacheHeaders(30), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        model: { include: { brand: true } },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!vehicle) { res.status(404).json({ error: 'Véhicule introuvable' }); return; }
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.get('/:id/reservations', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { model: { include: { brand: true } } },
    });
    if (!vehicle) { res.status(404).json({ error: 'Véhicule introuvable' }); return; }
    const reservations = await prisma.reservation.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' },
    });
    const stats = {
      total: reservations.length,
      completed: reservations.filter(r => r.status === 'COMPLETED').length,
      cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
      totalRevenue: reservations.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + r.paidAmount, 0),
    };
    res.json({ success: true, data: { vehicle, reservations, stats } });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const vehicle = await prisma.vehicle.create({
      data: parsed.data,
      include: { model: { include: { brand: true } }, images: true },
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const parsed = vehicleSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const vehicle = await prisma.vehicle.update({
      where: { id }, data: parsed.data,
      include: { model: { include: { brand: true } }, images: true },
    });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true, message: 'Véhicule supprimé' });
  } catch (err) { next(err); }
});

router.post('/:id/images', requireAdmin, upload.array('files', 10), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ error: 'Aucun fichier' }); return; }
    const existing = await prisma.vehicleImage.count({ where: { vehicleId: id } });
    const images: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const { url } = await uploadToCloudinary(files[i].buffer, 'ndjamcar/vehicles');
      const img = await prisma.vehicleImage.create({
        data: { vehicleId: id, url, isPrimary: existing === 0 && i === 0, order: existing + i },
      });
      images.push(img);
    }
    res.status(201).json({ success: true, data: images });
  } catch (err) { next(err); }
});

router.delete('/:id/images/:imageId', requireAdmin, async (req, res, next) => {
  try {
    const imageId = parseInt(req.params.imageId as string);
    if (isNaN(imageId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.vehicleImage.delete({ where: { id: imageId } });
    res.json({ success: true, message: 'Image supprimée' });
  } catch (err) { next(err); }
});

export default router;
