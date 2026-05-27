import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../prisma';
import { signToken, requireAdmin, generateSessionToken } from '../middleware/auth';
import { sendWelcomeEmail } from '../lib/mailer';

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

    const sessionToken = generateSessionToken();
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { sessionToken, lastLogin: new Date() },
    });

    const token = signToken({ id: user.id, username: user.username, sessionToken });
    res.json({
      success: true,
      token,
      mustChangePassword: user.mustChangePassword,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) { next(err); }
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: { id: true, username: true, email: true, lastLogin: true, mustChangePassword: true },
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
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (err) { next(err); }
});

router.put('/force-password', requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({ newPassword: z.string().min(6) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' }); return; }
    const user = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
    if (!user.mustChangePassword) { res.status(400).json({ error: 'Aucun changement requis' }); return; }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err) { next(err); }
});

router.get('/admins', requireAdmin, async (_req, res, next) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, username: true, email: true, lastLogin: true, mustChangePassword: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: admins });
  } catch (err) { next(err); }
});

router.post('/admins', requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(2).max(50),
      email: z.string().email().max(120),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: 'Données invalides', details: parsed.error.flatten() }); return; }
    const { username, email } = parsed.data;

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) { res.status(409).json({ error: 'Ce nom d\'utilisateur existe déjà' }); return; }

    const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const admin = await prisma.adminUser.create({
      data: { username, email, passwordHash, mustChangePassword: true },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const emailSent = await sendWelcomeEmail(email, username, tempPassword);

    res.status(201).json({
      success: true,
      data: admin,
      emailSent,
      message: emailSent
        ? `Admin "${username}" créé. Un email a été envoyé à ${email}`
        : `Admin "${username}" créé. L'email n'a pas pu être envoyé. Mot de passe temporaire : ${tempPassword}`,
    });
  } catch (err) { next(err); }
});

router.delete('/admins/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: 'ID invalide' }); return; }
    if (id === req.admin!.id) { res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }); return; }
    const count = await prisma.adminUser.count();
    if (count <= 1) { res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' }); return; }
    await prisma.adminUser.delete({ where: { id } });
    res.json({ success: true, message: 'Administrateur supprimé' });
  } catch (err) { next(err); }
});

export default router;
