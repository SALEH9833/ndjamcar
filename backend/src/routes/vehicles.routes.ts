import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin, getAgencyFilter } from '../middleware/auth';
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
    const { brand, model, status, transmission, fuel, minPrice, maxPrice, seats, featured, agency } = req.query;
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
    if (agency) where.agencyId = parseInt(agency as string);
    where.agency = { isActive: true };

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        model: { include: { brand: { select: { id: true, name: true, logoUrl: true } } } },
        images: { orderBy: { order: 'asc' } },
        agency: { select: { id: true, name: true, slug: true, phone: true, whatsapp: true, city: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const agencyFilter = getAgencyFilter(req);
    const vehicles = await prisma.vehicle.findMany({
      where: agencyFilter,
      include: {
        model: { include: { brand: true } },
        images: { orderBy: { order: 'asc' } },
        reservations: { where: { status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } }, take: 1, orderBy: { startDate: 'asc' } },
        agency: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: vehicles });
  } catch (err) { next(err); }
});

router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const agencyFilter = getAgencyFilter(req);
    const [total, available, rented, maintenance] = await Promise.all([
      prisma.vehicle.count({ where: agencyFilter }),
      prisma.vehicle.count({ where: { ...agencyFilter, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { ...agencyFilter, status: 'RENTED' } }),
      prisma.vehicle.count({ where: { ...agencyFilter, status: 'MAINTENANCE' } }),
    ]);
    const pendingReservations = await prisma.reservation.count({ where: { ...agencyFilter, status: 'PENDING' } });
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
        agency: { select: { id: true, name: true, slug: true, phone: true, whatsapp: true, city: true } },
      },
    });
    if (!vehicle) { res.status(404).json({ error: 'Véhicule introuvable' }); return; }
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    if (!req.admin?.agencyId && req.admin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Aucune agence associée' }); return;
    }
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const agencyId = req.body.agencyId && req.admin?.role === 'SUPER_ADMIN'
      ? parseInt(req.body.agencyId) : req.admin!.agencyId!;
    const vehicle = await prisma.vehicle.create({
      data: { ...parsed.data, agencyId },
      include: { model: { include: { brand: true } }, images: true },
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    if (req.admin?.role !== 'SUPER_ADMIN') {
      const v = await prisma.vehicle.findUnique({ where: { id }, select: { agencyId: true } });
      if (v?.agencyId !== req.admin?.agencyId) { res.status(403).json({ error: 'Accès interdit' }); return; }
    }
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
    if (req.admin?.role !== 'SUPER_ADMIN') {
      const v = await prisma.vehicle.findUnique({ where: { id }, select: { agencyId: true } });
      if (v?.agencyId !== req.admin?.agencyId) { res.status(403).json({ error: 'Accès interdit' }); return; }
    }
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
