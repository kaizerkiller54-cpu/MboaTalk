import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import { chats, chatMembers, contacts, users, groupMembers, groups, messages } from '../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { createDirectChat, insertMessage, uuid } from '../services/chat.service';
import { buildBundle } from '../services/bundle.service';
import { storageService } from '../services/storage.service';
import { messageToLegacy } from '../services/serializers';

export const chatRouter = Router();

const sendMessageSchema = z.object({
  chatId: z.string().min(1),
  text: z.string().max(10000).optional(),
  type: z.string().max(20).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(50).optional(),
  fileUrl: z.string().max(4000000).optional()
});

chatRouter.post('/messages', requireAuth, validateBody(sendMessageSchema), async (req, res, next) => {
  try {
    const { chatId, text, type, fileName, fileSize, fileUrl } = req.body;
    const userId = req.user!.id;

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (!chat) throw new AppError('Discussion introuvable.', 404);

    const membership = await db
      .select()
      .from(chatMembers)
      .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
      .limit(1);
    if (membership.length === 0) throw new AppError('Accès refusé à cette discussion.', 403);

    let storedFileUrl: string | undefined = fileUrl;
    if (fileUrl && fileUrl.startsWith('data:')) {
      const uploaded = await storageService.uploadBase64(fileUrl, 'messages', userId);
      storedFileUrl = uploaded.url;
    }

    const msg = await insertMessage(chatId, userId, {
      type,
      text,
      mediaUrl: storedFileUrl,
      fileName,
      fileSize
    });

    // Reset unread for sender
    await db.update(chatMembers).set({ unreadCount: 0 }).where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));

    // For direct chat, increment recipient unread
    if (chat.type === 'direct') {
      const members = await db.select().from(chatMembers).where(eq(chatMembers.chatId, chatId));
      const others = members.filter((m) => m.userId !== userId);
      for (const other of others) {
        await db
          .update(chatMembers)
          .set({ unreadCount: (other.unreadCount ?? 0) + 1 })
          .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, other.userId)));
      }
    }

    const contactsRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
    const contactIdByUserId = new Map<string, string>();
    for (const c of contactsRows) if (c.contactUserId) contactIdByUserId.set(c.contactUserId, c.id);

    return res.json({ success: true, message: messageToLegacy(msg, userId, contactIdByUserId) });
  } catch (err) {
    next(err);
  }
});

const createChatSchema = z.object({
  contactId: z.string().optional(),
  groupId: z.string().optional()
});

chatRouter.post('/chats/create', requireAuth, validateBody(createChatSchema), async (req, res, next) => {
  try {
    const { contactId, groupId } = req.body;
    const userId = req.user!.id;

    if (groupId) {
      const [grp] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      if (!grp) throw new AppError('Groupe introuvable.', 404);
      const membership = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
        .limit(1);
      if (membership.length === 0) throw new AppError('Vous n\'êtes pas membre de ce groupe.', 403);

      const existingChat = await db.select().from(chats).where(and(eq(chats.groupId, groupId), eq(chats.type, 'group'))).limit(1);
      if (existingChat.length > 0) {
        return res.json({ success: true, chat: await legacyChat(existingChat[0].id, userId) });
      }

      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(chats).values({ id: chatId, type: 'group', groupId });
      await db.insert(chatMembers).values({ chatId, userId, unreadCount: 0 });
      return res.json({ success: true, chat: await legacyChat(chatId, userId) });
    }

    if (contactId) {
      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
        .limit(1);
      if (!contact) throw new AppError('Contact introuvable.', 404);

      if (contact.contactUserId) {
        const chatId = await createDirectChat(userId, contact.contactUserId);
        return res.json({ success: true, chat: await legacyChat(chatId, userId) });
      }

      // Contact without a linked user account: create a local chat shell
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(chats).values({ id: chatId, type: 'direct' });
      await db.insert(chatMembers).values({ chatId, userId, unreadCount: 0 });
      await db.insert(chatMembers).values({ chatId, userId: `guest_${chatId}`, unreadCount: 0 });
      return res.json({ success: true, chat: await legacyChat(chatId, userId) });
    }

    throw new AppError('contactId ou groupId requis.', 400);
  } catch (err) {
    next(err);
  }
});

chatRouter.delete('/chats/:chatId', requireAuth, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.id;
    await db
      .delete(chatMembers)
      .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)));
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

async function legacyChat(chatId: string, userId: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  if (!chat) throw new AppError('Discussion introuvable.', 404);

  const [membership] = await db
    .select()
    .from(chatMembers)
    .where(and(eq(chatMembers.chatId, chatId), eq(chatMembers.userId, userId)))
    .limit(1);

  const members = await db.select().from(chatMembers).where(eq(chatMembers.chatId, chatId));
  const other = members.find((m) => m.userId !== userId);

  const msgRows = await db.select().from(messages).where(eq(messages.chatId, chatId));
  const recent = msgRows.length ? msgRows[msgRows.length - 1] : undefined;

  const contactRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
  const contactIdByUserId = new Map<string, string>();
  for (const c of contactRows) if (c.contactUserId) contactIdByUserId.set(c.contactUserId, c.id);

  let contactId: string | undefined;
  if (chat.type === 'direct' && other) {
    contactId = contactIdByUserId.get(other.userId) || other.userId;
  }

  return {
    id: chat.id,
    ...(contactId ? { contactId } : {}),
    ...(chat.groupId ? { groupId: chat.groupId } : {}),
    recentMessage: recent ? (recent.type === 'text' && recent.content ? recent.content : recent.type === 'image' ? '🖼️ Image' : recent.type === 'video' ? '🎥 Vidéo' : recent.type === 'document' ? `📄 Document: ${recent.fileName || ''}` : 'Pièce jointe') : (chat.type === 'group' ? 'Groupe rejoint' : 'Discussion créée'),
    unreadCount: membership?.unreadCount ?? 0,
    lastActive: (recent?.createdAt || chat.updatedAt).toISOString(),
    messages: msgRows.map((m) => ({
      id: m.id,
      senderId: m.senderId === userId ? 'me' : contactIdByUserId.get(m.senderId) || m.senderId,
      text: m.content || undefined,
      type: m.type,
      fileUrl: m.mediaUrl || undefined,
      fileName: m.fileName || undefined,
      fileSize: m.fileSize || undefined,
      duration: m.duration || undefined,
      timestamp: m.createdAt.toISOString()
    }))
  };
}
