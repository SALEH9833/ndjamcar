import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { sendReservationNotifEmail, buildWhatsAppReservationUrl } from '../lib/mailer';
import { generateInvoicePDF } from '../lib/invoice';

const router = Router();

const reservationSchema = z.object({
  vehicleId: z.number().int().positive(),
  clientName: z.string().trim().min(2).max(100),
  clientPhone: z.string().trim().min(5).max(30),
  clientEmail: z.string().email().max(120).optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  totalPrice: z.number().nonnegative(),
  notes: z.string().max(500).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = reservationSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const { vehicleId, startDate, endDate, ...rest } = parsed.data;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) { res.status(404).json({ error: 'Véhicule introuvable' }); return; }
    if (vehicle.status !== 'AVAILABLE') { res.status(409).json({ error: 'Ce véhicule n\'est pas disponible' }); return; }
    const overlap = await prisma.reservation.findFirst({
      where: {
        vehicleId,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
    });
    if (overlap) { res.status(409).json({ error: 'Ce véhicule est déjà réservé pour ces dates' }); return; }
    const reservation = await prisma.reservation.create({
      data: { vehicleId, startDate: new Date(startDate), endDate: new Date(endDate), ...rest },
      include: { vehicle: { include: { model: { include: { brand: true } } } } },
    });

    const vehicleName = `${reservation.vehicle.model.brand.name} ${reservation.vehicle.model.name}`;
    const days = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
    const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const notif = {
      clientName: rest.clientName,
      clientPhone: rest.clientPhone,
      clientEmail: rest.clientEmail || null,
      vehicleName,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      totalPrice: rest.totalPrice,
      days,
    };
    sendReservationNotifEmail(notif).catch(() => {});
    const whatsappUrl = buildWhatsAppReservationUrl(notif);

    res.status(201).json({ success: true, data: reservation, whatsappUrl });
  } catch (err) { next(err); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const reservations = await prisma.reservation.findMany({
      where: status ? { status: status as string } : {},
      include: { vehicle: { include: { model: { include: { brand: true } }, images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reservations });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { status, paidAmount, notes } = req.body;
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) { res.status(404).json({ error: 'Réservation introuvable' }); return; }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (notes !== undefined) updateData.notes = notes;

    if (status === 'CONFIRMED' || status === 'ACTIVE') {
      await prisma.vehicle.update({ where: { id: reservation.vehicleId }, data: { status: 'RENTED' } });
    }
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const otherActive = await prisma.reservation.findFirst({
        where: { vehicleId: reservation.vehicleId, id: { not: id }, status: { in: ['CONFIRMED', 'ACTIVE'] } },
      });
      if (!otherActive) {
        await prisma.vehicle.update({ where: { id: reservation.vehicleId }, data: { status: 'AVAILABLE' } });
      }
    }

    const updated = await prisma.reservation.update({
      where: { id }, data: updateData,
      include: { vehicle: { include: { model: { include: { brand: true } } } } },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.get('/:id/invoice', async (req, res, next) => {
  try {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ error: 'Non autorisé' }); return; }
    const jwt = await import('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'dev-secret';
    let payload: any;
    try { payload = jwt.default.verify(token, SECRET); } catch { res.status(401).json({ error: 'Token invalide' }); return; }
    const user = await prisma.adminUser.findUnique({ where: { id: payload.id }, select: { sessionToken: true } });
    if (!user || user.sessionToken !== payload.sessionToken) { res.status(401).json({ error: 'Session expirée' }); return; }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: { include: { model: { include: { brand: true } } } } },
    });
    if (!reservation) { res.status(404).json({ error: 'Réservation introuvable' }); return; }

    const days = Math.max(1, Math.ceil((reservation.endDate.getTime() - reservation.startDate.getTime()) / 86400000));
    const doc = generateInvoicePDF({
      id: reservation.id,
      clientName: reservation.clientName,
      clientPhone: reservation.clientPhone,
      clientEmail: reservation.clientEmail,
      vehicleName: `${reservation.vehicle.model.brand.name} ${reservation.vehicle.model.name}`,
      plateNumber: reservation.vehicle.plateNumber,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      days,
      pricePerDay: reservation.vehicle.pricePerDay,
      totalPrice: reservation.totalPrice,
      paidAmount: reservation.paidAmount,
      status: reservation.status,
      createdAt: reservation.createdAt,
    });

    const filename = `facture-${String(id).padStart(5, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.reservation.delete({ where: { id } });
    res.json({ success: true, message: 'Réservation supprimée' });
  } catch (err) { next(err); }
});

export default router;
