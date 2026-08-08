import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import {
  users, transactions, notifications, contacts, chatMembers, groups, groupMembers, invitations, channels, channelFollows, stories, messages, chats
} from '../../db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { createDirectChat, insertMessage } from '../services/chat.service';
import { buildBundle } from '../services/bundle.service';
import { transactionToLegacy } from '../services/serializers';
import crypto from 'crypto';

export const walletRouter = Router();

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'Le PIN doit contenir exactement 4 chiffres.')
});

walletRouter.post('/wallet/verify-pin', requireAuth, validateBody(pinSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);

    const valid = await bcrypt.compare(req.body.pin, user.pinHash);
    if (!valid) throw new AppError('PIN incorrect.', 400);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

const transferSchema = z.object({
  contactPhone: z.string().min(6),
  amount: z.coerce.number().positive(),
  fee: z.coerce.number().min(0).default(0)
});

walletRouter.post('/wallet/transfer', requireAuth, validateBody(transferSchema), async (req, res, next) => {
  try {
    const { contactPhone, amount, fee } = req.body;
    const userId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);

    if (amount + fee > user.balanceFcfa) {
      throw new AppError('Solde insuffisant.', 400);
    }

    const cleanPhone = contactPhone.replace(/\s+/g, '');
    const myContacts = await db.select().from(contacts).where(eq(contacts.userId, userId));
    const contact = myContacts.find((c) => c.phone.replace(/\s+/g, '') === cleanPhone);
    const contactName = contact ? contact.name : 'Inconnu';

    const now = new Date();

    // 1. Debit sender + record transaction
    const newBalance = +(user.balanceFcfa - (amount + fee)).toFixed(2);
    const txId = `tx_virement_${Date.now()}`;
    await db.update(users).set({ balanceFcfa: newBalance }).where(eq(users.id, userId));
    await db.insert(transactions).values({
      id: txId,
      userId,
      type: 'send',
      amountFcfa: amount,
      feesFcfa: fee,
      contactName,
      contactPhone,
      createdAt: now
    });

    // 2. Receipt message for sender chat (if contact linked to a user)
    let chatsResult: any[] = [];
    if (contact?.contactUserId) {
      const chatId = await createDirectChat(userId, contact.contactUserId);
      const receipt = await insertMessage(chatId, userId, {
        type: 'document',
        text: `💵 Transfert de ${amount.toFixed(2)} FCFA effectué avec succès !`,
        fileName: `Reçu_Transfert_${Math.round(amount)}FCFA.pdf`,
        fileSize: '1.2 Kb'
      });
      await db
        .update(chatMembers)
        .set({ unreadCount: 1 })
        .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, contact.contactUserId)));
    }

    // 3. Credit recipient if they have an account
    const cleanDestPhone = cleanPhone.replace(/^\+/, '');
    const recipient = await db
      .select()
      .from(users)
      .where(
        sql`replace(replace(phone, ' ', ''), '+', '') = ${cleanDestPhone}`
      )
      .limit(1);

    if (recipient.length > 0) {
      const r = recipient[0];
      const recipientNewBalance = +(r.balanceFcfa + amount).toFixed(2);
      await db.update(users).set({ balanceFcfa: recipientNewBalance }).where(eq(users.id, r.id));

      await db.insert(transactions).values({
        id: `tx_received_${Date.now()}`,
        userId: r.id,
        type: 'receive',
        amountFcfa: amount,
        feesFcfa: 0,
        contactName: user.phone,
        contactPhone: user.phone,
        createdAt: now
      });

      await db.insert(notifications).values({
        id: `n_tx_${Date.now()}`,
        userId: r.id,
        title: 'Virement reçu ! ✅',
        body: `Vous avez reçu ${amount.toFixed(2)} FCFA de la part de ${user.name}.`,
        type: 'transaction',
        isRead: false,
        createdAt: now
      });

      // Ensure sender is in recipient's contacts + receipt message
      let senderContact = (
        await db.select().from(contacts).where(eq(contacts.userId, r.id))
      ).find((c) => c.contactUserId === userId);

      if (!senderContact) {
        const contactId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        senderContact = await db
          .insert(contacts)
          .values({
            id: contactId,
            userId: r.id,
            contactUserId: userId,
            name: user.name,
            phone: user.phone,
            avatar: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            isOnline: false
          })
          .returning()
          .then((rows) => rows[0]);
      }

      const chatId = await createDirectChat(r.id, userId);
      await insertMessage(chatId, userId, {
        type: 'document',
        text: `💵 Vous avez reçu un virement de ${amount.toFixed(2)} FCFA !`,
        fileName: `Reçu_Virement_${Math.round(amount)}FCFA.pdf`,
        fileSize: '1.2 Kb'
      });
      await db
        .update(chatMembers)
        .set({ unreadCount: 1 })
        .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, r.id)));
    }

    const bundle = await buildBundle(userId);
    chatsResult = bundle.chats;

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);

    return res.json({
      success: true,
      balance: newBalance,
      transaction: transactionToLegacy(tx),
      chats: chatsResult
    });
  } catch (err) {
    next(err);
  }
});

const topUpSchema = z.object({
  amount: z.coerce.number().positive()
});

walletRouter.post('/wallet/top-up', requireAuth, validateBody(topUpSchema), async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);

    const newBalance = +(user.balanceFcfa + amount).toFixed(2);
    const txId = `tx_recharge_${Date.now()}`;
    await db.update(users).set({ balanceFcfa: newBalance }).where(eq(users.id, userId));
    await db.insert(transactions).values({
      id: txId,
      userId,
      type: 'top_up',
      amountFcfa: amount,
      feesFcfa: 0,
      createdAt: new Date()
    });

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);

    return res.json({ success: true, balance: newBalance, transaction: transactionToLegacy(tx) });
  } catch (err) {
    next(err);
  }
});

const referralSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(6)
});

walletRouter.post('/wallet/referral', requireAuth, validateBody(referralSchema), async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);

    const bonusReferrer = 5.0;
    const newBalance = +(user.balanceFcfa + bonusReferrer).toFixed(2);
    const now = new Date();

    await db.update(users).set({
      balanceFcfa: newBalance,
      hasReferred: true,
      referralCount: user.referralCount + 1,
      referralEarnings: +(user.referralEarnings + bonusReferrer).toFixed(2)
    }).where(eq(users.id, userId));

    await db.insert(transactions).values({
      id: `tx_bonus_${Date.now()}`,
      userId,
      type: 'receive',
      amountFcfa: bonusReferrer,
      feesFcfa: 0,
      contactName: `🎁 Cadeau Parrainage (${name})`,
      contactPhone: phone,
      createdAt: now
    });

    await db.insert(notifications).values({
      id: `notif_ref_${Date.now()}`,
      userId,
      title: 'Félicitations ! Parrainage Réussi 🎉',
      body: `Votre filleul ${name} s'est inscrit avec votre code et a effectué son premier transfert. Un bonus de +5.00 FCFA a été ajouté à votre portefeuille !`,
      type: 'transaction',
      isRead: false,
      createdAt: now
    });

    const bundle = await buildBundle(userId);
    return res.json({ success: true, user: bundle });
  } catch (err) {
    next(err);
  }
});
