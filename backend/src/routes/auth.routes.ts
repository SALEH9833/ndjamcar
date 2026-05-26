import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { signToken, requireAdmin } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(2),
  password: z.string().min(6),
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Identifiants invalides' }); return; }
    const { username, password } = parsed.data;
    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user) { res.status(401).json({ error: 'Identifiants incorrects' }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Identifiants incorrects' }); return; }
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = signToken({ id: user.id, username: user.username });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) { next(err); }
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: { id: true, username: true, email: true, lastLogin: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.put('/profile', requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(2).optional(),
      email: z.string().email().optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const { username, email } = parsed.data;
    if (username) {
      const existing = await prisma.adminUser.findUnique({ where: { username } });
      if (existing && existing.id !== req.admin!.id) { res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' }); return; }
    }
    const updated = await prisma.adminUser.update({
      where: { id: req.admin!.id },
      data: { ...(username && { username }), ...(email !== undefined && { email }) },
      select: { id: true, username: true, email: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.put('/password', requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides' }); return; }
    const { currentPassword, newPassword } = parsed.data;
    const user = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ message: 'Mot de passe actuel incorrect' }); return; }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (err) { next(err); }
});

export default router;
