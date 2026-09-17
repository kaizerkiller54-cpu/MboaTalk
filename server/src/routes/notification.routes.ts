import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import { notifications, users, contacts, groupPosts } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { buildBundle } from '../services/bundle.service';
import { notificationToLegacy } from '../services/serializers';
import { storageService } from '../services/storage.service';

export const notificationRouter = Router();
export const profileRouter = Router();

notificationRouter.post('/notifications/mark-read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return res.json({ success: true, notifications: rows.map(notificationToLegacy) });
  } catch (err) {
    next(err);
  }
});

const clearSchema = z.object({ id: z.string().min(1) });

notificationRouter.post('/notifications/clear', requireAuth, validateBody(clearSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.body;
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .catch(() => {});

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return res.json({ success: true, notifications: rows.map(notificationToLegacy) });
  } catch (err) {
    next(err);
  }
});

const updateProfileSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'Le PIN doit contenir exactement 4 chiffres.').optional(),
  email: z.string().email('Email invalide.').optional(),
  avatar: z.string().min(1).max(8000000).optional()
});

profileRouter.post('/profile/update', requireAuth, validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { pin, email, avatar } = req.body;

    if (pin) {
      const pinHash = await bcrypt.hash(pin, 12);
      await db.update(users).set({ pinHash }).where(eq(users.id, userId));
    }
    if (email) {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        throw new AppError('Un compte avec cet email existe déjà.', 409);
      }
      await db.update(users).set({ email: email.trim().toLowerCase() }).where(eq(users.id, userId));
    }
    if (avatar) {
      let avatarUrl = avatar;
      if (avatar.startsWith('data:')) {
        const uploaded = await storageService.uploadBase64(avatar, 'avatars', userId);
        avatarUrl = uploaded.url;
      }
      await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));
      await db.update(contacts).set({ avatar: avatarUrl }).where(eq(contacts.contactUserId, userId));
      await db.update(groupPosts).set({ authorAvatar: avatarUrl }).where(eq(groupPosts.authorName, 'Moi'));
    }

    const bundle = await buildBundle(userId);
    return res.json({ success: true, user: bundle });
  } catch (err) {
    next(err);
  }
});
