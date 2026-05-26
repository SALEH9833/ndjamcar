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
  adminCount: z.number().int().min(1).max(10).optional(),
  adminNames: z.string().trim().max(500).optional().nullable(),
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

    const { admins } = req.body;
    if (!admins || !Array.isArray(admins) || admins.length === 0) {
      res.status(422).json({ error: 'Au moins un compte admin est requis (format: [{username, password, email?}])' }); return;
    }

    for (const admin of admins) {
      if (!admin.username || !admin.password) {
        res.status(422).json({ error: 'Chaque admin doit avoir un username et password' }); return;
      }
      const exists = await prisma.adminUser.findUnique({ where: { username: admin.username } });
      if (exists) { res.status(409).json({ error: `Le nom d'utilisateur "${admin.username}" existe déjà` }); return; }
    }

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

    const createdAdmins: any[] = [];
    for (const admin of admins) {
      const passwordHash = await bcrypt.hash(admin.password, 12);
      const created = await prisma.adminUser.create({
        data: {
          username: admin.username,
          passwordHash,
          email: admin.email || null,
          role: 'AGENCY_ADMIN',
          agencyId: agency.id,
        },
        select: { id: true, username: true, email: true },
      });
      createdAdmins.push(created);
    }

    await prisma.agencyRequest.update({ where: { id }, data: { status: 'APPROVED' } });

    res.json({
      success: true,
      data: {
        agency,
        admins: createdAdmins,
        message: `Agence "${agency.name}" créée avec ${createdAdmins.length} admin(s)`,
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
