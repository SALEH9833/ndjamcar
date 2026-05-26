import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin, getAgencyFilter } from '../middleware/auth';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  email: z.string().email().max(120).optional().nullable(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(3000),
  agencyId: z.number().int().positive().optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const msg = await prisma.contactMessage.create({ data: parsed.data });
    res.status(201).json({ success: true, data: msg });
  } catch (err) { next(err); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const agencyFilter = getAgencyFilter(req);
    const where: any = req.admin?.role === 'SUPER_ADMIN' ? {} : { OR: [agencyFilter, { agencyId: null }] };
    const messages = await prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
});

router.put('/:id/read', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, message: 'Message supprimé' });
  } catch (err) { next(err); }
});

export default router;
