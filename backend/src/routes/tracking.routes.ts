import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin, getAgencyFilter } from '../middleware/auth';
import { noCacheHeaders } from '../middleware/security';

const router = Router();

router.use(requireAdmin);

router.get('/', noCacheHeaders, async (req, res, next) => {
  try {
    const agencyFilter = getAgencyFilter(req);
    const tracking = await prisma.vehicleTracking.findMany({
      where: agencyFilter,
      include: {
        vehicle: {
          select: {
            id: true, plateNumber: true, status: true, color: true,
            model: { include: { brand: { select: { name: true } } } },
          },
        },
      },
    });
    res.json({ success: true, data: tracking });
  } catch (err) { next(err); }
});

router.put('/:vehicleId', noCacheHeaders, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);
    if (isNaN(vehicleId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const agencyId = req.admin?.agencyId || 0;
    if (req.admin?.role !== 'SUPER_ADMIN') {
      const v = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { agencyId: true } });
      if (v?.agencyId !== agencyId) { res.status(403).json({ error: 'Accès interdit' }); return; }
    }
    const { latitude, longitude, speed, heading, deviceId, isOnline } = req.body;
    const tracking = await prisma.vehicleTracking.upsert({
      where: { vehicleId },
      update: { latitude, longitude, speed, heading, deviceId, isOnline, lastUpdate: new Date() },
      create: { vehicleId, agencyId: req.admin?.role === 'SUPER_ADMIN' ? (await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { agencyId: true } }))!.agencyId : agencyId, latitude, longitude, speed, heading, deviceId, isOnline, lastUpdate: new Date() },
    });
    res.json({ success: true, data: tracking });
  } catch (err) { next(err); }
});

router.delete('/:vehicleId', noCacheHeaders, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);
    if (isNaN(vehicleId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.vehicleTracking.delete({ where: { vehicleId } });
    res.json({ success: true, message: 'Tracking supprimé' });
  } catch (err) { next(err); }
});

router.post('/update-batch', noCacheHeaders, async (req, res, next) => {
  try {
    const { positions } = req.body;
    if (!Array.isArray(positions)) { res.status(400).json({ error: 'Format invalide' }); return; }
    for (const pos of positions) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: pos.vehicleId }, select: { agencyId: true } });
      if (!vehicle) continue;
      await prisma.vehicleTracking.upsert({
        where: { vehicleId: pos.vehicleId },
        update: { latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed, heading: pos.heading, isOnline: true, lastUpdate: new Date() },
        create: { vehicleId: pos.vehicleId, agencyId: vehicle.agencyId, latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed, heading: pos.heading, deviceId: pos.deviceId, isOnline: true, lastUpdate: new Date() },
      });
    }
    res.json({ success: true, message: `${positions.length} positions mises à jour` });
  } catch (err) { next(err); }
});

export default router;
