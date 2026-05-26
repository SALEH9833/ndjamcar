import { Router } from 'express';
import prisma from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { ssrCacheHeaders } from '../middleware/security';

const router = Router();

router.get('/', ssrCacheHeaders(60), async (_req, res, next) => {
  try {
    const items = await prisma.siteContent.findMany();
    const map: Record<string, string> = {};
    items.forEach(i => { map[i.key] = i.value; });
    res.json({ success: true, data: map });
  } catch (err) { next(err); }
});

router.get('/all', requireAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.siteContent.findMany({ orderBy: [{ group: 'asc' }, { id: 'asc' }] });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) { res.status(400).json({ error: 'Format invalide' }); return; }
    await prisma.$transaction(
      items.map((item: { key: string; value: string }) =>
        prisma.siteContent.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        })
      )
    );
    res.json({ success: true, message: 'Contenu mis à jour' });
  } catch (err) { next(err); }
});

export default router;
