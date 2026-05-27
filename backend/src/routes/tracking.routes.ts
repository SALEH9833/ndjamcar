import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { noCacheHeaders } from '../middleware/security';
import { getTraccarDevices } from '../lib/traccar';

const router = Router();

function generateToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

router.post('/gps/:token', noCacheHeaders, async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const { latitude, longitude, speed, heading } = req.body;
    if (!latitude || !longitude) { res.status(400).json({ error: 'Coordonnées requises' }); return; }

    const tracking = await prisma.vehicleTracking.findUnique({ where: { trackingToken: token } });
    if (!tracking) { res.status(404).json({ error: 'Token invalide' }); return; }

    await prisma.vehicleTracking.update({
      where: { id: tracking.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : 0,
        heading: heading ? parseFloat(heading) : 0,
        isOnline: true,
        lastUpdate: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

router.use(requireAdmin);

router.get('/', noCacheHeaders, async (_req, res, next) => {
  try {
    const tracking = await prisma.vehicleTracking.findMany({
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
    const { latitude, longitude, speed, heading, deviceId, isOnline } = req.body;
    const tracking = await prisma.vehicleTracking.upsert({
      where: { vehicleId },
      update: { latitude, longitude, speed, heading, deviceId, isOnline, lastUpdate: new Date() },
      create: { vehicleId, latitude, longitude, speed, heading, deviceId, isOnline, trackingToken: generateToken(), lastUpdate: new Date() },
    });
    res.json({ success: true, data: tracking });
  } catch (err) { next(err); }
});

router.get('/traccar-devices', noCacheHeaders, async (_req, res, next) => {
  try {
    const devices = await getTraccarDevices();
    res.json({ success: true, data: devices });
  } catch (err) { next(err); }
});

router.put('/:vehicleId/imei', noCacheHeaders, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);
    if (isNaN(vehicleId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { imei } = req.body;
    if (!imei) { res.status(400).json({ error: 'IMEI requis' }); return; }
    const tracking = await prisma.vehicleTracking.update({
      where: { vehicleId },
      data: { imei: imei.trim() },
    });
    res.json({ success: true, data: tracking });
  } catch (err) { next(err); }
});

router.delete('/:vehicleId/imei', noCacheHeaders, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);
    if (isNaN(vehicleId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.vehicleTracking.update({
      where: { vehicleId },
      data: { imei: null },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:vehicleId/generate-token', noCacheHeaders, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId as string);
    if (isNaN(vehicleId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const token = generateToken();
    const tracking = await prisma.vehicleTracking.update({
      where: { vehicleId },
      data: { trackingToken: token },
    });
    res.json({ success: true, data: { trackingToken: tracking.trackingToken } });
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
      await prisma.vehicleTracking.upsert({
        where: { vehicleId: pos.vehicleId },
        update: { latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed, heading: pos.heading, isOnline: true, lastUpdate: new Date() },
        create: { vehicleId: pos.vehicleId, latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed, heading: pos.heading, deviceId: pos.deviceId, isOnline: true, trackingToken: generateToken(), lastUpdate: new Date() },
      });
    }
    res.json({ success: true, message: `${positions.length} positions mises à jour` });
  } catch (err) { next(err); }
});

export default router;
