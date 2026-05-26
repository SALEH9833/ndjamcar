import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();
router.use(requireSuperAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        _count: { select: { vehicles: true, admins: true, reservations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: agencies });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true, username: true, email: true, lastLogin: true, createdAt: true } },
        _count: { select: { vehicles: true, reservations: true } },
      },
    });
    if (!agency) { res.status(404).json({ error: 'Agence introuvable' }); return; }
    res.json({ success: true, data: agency });
  } catch (err) { next(err); }
});

const agencySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(120).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  isActive: z.boolean().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = agencySchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const existing = await prisma.agency.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) { res.status(409).json({ error: 'Ce slug est déjà utilisé' }); return; }
    const agency = await prisma.agency.create({ data: parsed.data });
    res.status(201).json({ success: true, data: agency });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { name, phone, email, address, city, whatsapp, isActive, logoUrl } = req.body;
    const agency = await prisma.agency.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(isActive !== undefined && { isActive }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });
    res.json({ success: true, data: agency });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const agency = await prisma.agency.findUnique({ where: { id }, include: { _count: { select: { vehicles: true } } } });
    if (!agency) { res.status(404).json({ error: 'Agence introuvable' }); return; }
    if (agency._count.vehicles > 0) { res.status(409).json({ error: 'Impossible de supprimer : cette agence a des véhicules' }); return; }
    await prisma.agency.delete({ where: { id } });
    res.json({ success: true, message: 'Agence supprimée' });
  } catch (err) { next(err); }
});

router.post('/:id/admin', async (req, res, next) => {
  try {
    const agencyId = parseInt(req.params.id);
    if (isNaN(agencyId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const schema = z.object({
      username: z.string().trim().min(2).max(50),
      password: z.string().min(6),
      email: z.string().email().optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) { res.status(404).json({ error: 'Agence introuvable' }); return; }
    const existing = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
    if (existing) { res.status(409).json({ error: 'Ce nom d\'utilisateur existe déjà' }); return; }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        email: parsed.data.email || null,
        role: 'AGENCY_ADMIN',
        agencyId,
      },
      select: { id: true, username: true, email: true, role: true, agencyId: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: admin });
  } catch (err) { next(err); }
});

router.delete('/:id/admin/:adminId', async (req, res, next) => {
  try {
    const agencyId = parseInt(req.params.id);
    const adminId = parseInt(req.params.adminId);
    if (isNaN(agencyId) || isNaN(adminId)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const admin = await prisma.adminUser.findFirst({ where: { id: adminId, agencyId } });
    if (!admin) { res.status(404).json({ error: 'Admin introuvable dans cette agence' }); return; }
    await prisma.adminUser.delete({ where: { id: adminId } });
    res.json({ success: true, message: 'Admin supprimé' });
  } catch (err) { next(err); }
});

export default router;
