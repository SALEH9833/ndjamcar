import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const modelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  brandId: z.number().int().positive(),
});

router.get('/', async (_req, res, next) => {
  try {
    const models = await prisma.model.findMany({
      include: { brand: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: models });
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = modelSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const model = await prisma.model.create({ data: parsed.data, include: { brand: true } });
    res.status(201).json({ success: true, data: model });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    const parsed = modelSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const model = await prisma.model.update({ where: { id }, data: parsed.data, include: { brand: true } });
    res.json({ success: true, data: model });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    await prisma.model.delete({ where: { id } });
    res.json({ success: true, message: 'Modèle supprimé' });
  } catch (err) { next(err); }
});

export default router;
