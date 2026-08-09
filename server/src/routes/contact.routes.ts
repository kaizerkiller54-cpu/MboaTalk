import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import { contacts, users } from '../../db/schema';
import { and, eq, like } from 'drizzle-orm';

export const contactRouter = Router();

// Search users by email (excluding self)
contactRouter.get(
  '/search',
  requireAuth,
  validateQuery(z.object({ email: z.string().email('Email invalide.') })),
  async (req, res, next) => {
    try {
      const email = req.query.email!.toString().toLowerCase().trim();
      const userId = req.user!.id;

      const rows: any[] = await db
        .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatarUrl: users.avatarUrl, statusText: users.statusText, isOnline: users.isOnline })
        .from(users)
        .where(and(like(users.email, `%${email}%`), eq(users.id, userId)));

      // Exclude self and check if already a contact
      const existingContacts: any[] = await db.select({ contactUserId: contacts.contactUserId }).from(contacts).where(eq(contacts.userId, userId));
      const existingIds = new Set(existingContacts.map((c) => c.contactUserId));

      const results = rows
        .filter((u) => u.id !== userId)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          statusText: u.statusText,
          isOnline: u.isOnline,
          isContact: existingIds.has(u.id)
        }));

      return res.json({ success: true, users: results });
    } catch (err) {
      next(err);
    }
  }
);

// Add a contact by user ID
const addContactSchema = z.object({
  email: z.string().email('Email invalide.').optional(),
  userId: z.string().min(1).optional()
});

contactRouter.post('/', requireAuth, validateBody(addContactSchema), async (req, res, next) => {
  try {
    const { email, userId: targetUserId } = req.body;
    const userId = req.user!.id;

    if (!email && !targetUserId) {
      throw new AppError('Email ou userId requis.', 400);
    }

    // Find target user
    let target: any;
    if (targetUserId) {
      const rows: any[] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      target = rows[0];
    } else {
      const rows: any[] = await db.select().from(users).where(eq(users.email, email!.toLowerCase().trim())).limit(1);
      target = rows[0];
    }

    if (!target) throw new AppError('Aucun utilisateur trouvé avec cet email.', 404);
    if (target.id === userId) throw new AppError('Vous ne pouvez pas vous ajouter vous-même.', 400);

    // Check if already a contact
    const existing: any[] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.contactUserId, target.id)))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError('Ce contact existe déjà.', 409);
    }

    // Create contact (both directions)
    const contactId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reverseId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(contacts).values([
      { id: contactId, userId, contactUserId: target.id, name: target.name, phone: target.phone, avatar: target.avatarUrl, statusText: target.statusText, isOnline: target.isOnline },
      { id: reverseId, userId: target.id, contactUserId: userId, name: req.user!.name, phone: req.user!.phone, avatar: req.user!.avatarUrl, statusText: req.user!.statusText, isOnline: req.user!.isOnline }
    ]);

    return res.status(201).json({
      success: true,
      contact: {
        id: contactId,
        contactUserId: target.id,
        name: target.name,
        phone: target.phone,
        avatar: target.avatarUrl,
        statusText: target.statusText,
        isOnline: target.isOnline
      }
    });
  } catch (err) {
    next(err);
  }
});
