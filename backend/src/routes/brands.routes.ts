import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { ssrCacheHeaders } from '../middleware/security';

const router = Router();

const brandSchema = z.object({
  name: z.string().trim().min(1).max(100),
  logoUrl: z.string().url().optional().nullable(),
  order: z.number().int().default(0),
});

router.get('/', ssrCacheHeaders(120), async (_req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({
      include: { models: { orderBy: { name: 'asc' } } },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: brands });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = brandSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const brand = await prisma.brand.create({ data: parsed.data });
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const parsed = brandSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const brand = await prisma.brand.update({ where: { id }, data: parsed.data });
    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.brand.delete({ where: { id } });
    res.json({ success: true, message: 'Marque supprimée' });
  } catch (err) { next(err); }
});

export default router;
