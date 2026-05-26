import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

const requestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  ownerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  email: z.string().email().max(120).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  vehicleCount: z.number().int().min(0).max(1000).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const existing = await prisma.agencyRequest.findFirst({
      where: { phone: parsed.data.phone, status: 'PENDING' },
    });
    if (existing) { res.status(409).json({ error: 'Une demande est déjà en cours avec ce numéro' }); return; }
    const request = await prisma.agencyRequest.create({ data: parsed.data });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
});

router.get('/', requireSuperAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status as string } : {};
    const requests = await prisma.agencyRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

router.get('/count', requireSuperAdmin, async (_req, res, next) => {
  try {
    const count = await prisma.agencyRequest.count({ where: { status: 'PENDING' } });
    res.json({ success: true, data: count });
  } catch (err) { next(err); }
});

router.put('/:id/notes', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { adminNotes } = req.body;
    const updated = await prisma.agencyRequest.update({ where: { id }, data: { adminNotes } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.put('/:id/approve', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const request = await prisma.agencyRequest.findUnique({ where: { id } });
    if (!request) { res.status(404).json({ error: 'Demande introuvable' }); return; }
    if (request.status !== 'PENDING') { res.status(409).json({ error: 'Cette demande a déjà été traitée' }); return; }

    const slug = request.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existingSlug = await prisma.agency.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    const agency = await prisma.agency.create({
      data: {
        name: request.name,
        slug: finalSlug,
        phone: request.phone,
        email: request.email,
        whatsapp: request.whatsapp || request.phone,
        city: request.city,
        address: request.address,
        isActive: true,
      },
    });

    const { username, password } = req.body;
    if (!username || !password) { res.status(422).json({ error: 'username et password requis pour créer le compte admin' }); return; }
    const existingUser = await prisma.adminUser.findUnique({ where: { username } });
    if (existingUser) { res.status(409).json({ error: 'Ce nom d\'utilisateur existe déjà' }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        email: request.email,
        role: 'AGENCY_ADMIN',
        agencyId: agency.id,
      },
    });

    await prisma.agencyRequest.update({ where: { id }, data: { status: 'APPROVED' } });

    res.json({
      success: true,
      data: {
        agency,
        admin: { id: admin.id, username: admin.username },
        message: `Agence "${agency.name}" créée avec le compte admin "${username}"`,
      },
    });
  } catch (err) { next(err); }
});

router.put('/:id/reject', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const { adminNotes } = req.body;
    const updated = await prisma.agencyRequest.update({
      where: { id },
      data: { status: 'REJECTED', ...(adminNotes && { adminNotes }) },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.agencyRequest.delete({ where: { id } });
    res.json({ success: true, message: 'Demande supprimée' });
  } catch (err) { next(err); }
});

export default router;
