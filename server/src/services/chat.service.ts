import { db } from '../../db/client';
import { chats, chatMembers, messages } from '../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { AppError } from '../middleware/error';

export const uuid = () => crypto.randomUUID();

export const findDirectChatId = async (userId: string, otherUserId: string): Promise<string | null> => {
  const mine = await db.select({ chatId: chatMembers.chatId }).from(chatMembers).where(eq(chatMembers.userId, userId));
  const theirs = await db
    .select({ chatId: chatMembers.chatId })
    .from(chatMembers)
    .where(eq(chatMembers.userId, otherUserId));

  const mySet = new Set(mine.map((m) => m.chatId));
  const common = theirs.filter((t) => mySet.has(t.chatId)).map((t) => t.chatId);
  if (common.length === 0) return null;

  const chatRows = await db.select({ id: chats.id }).from(chats).where(and(inArray(chats.id, common), eq(chats.type, 'direct')));
  return chatRows.length ? chatRows[0].id : null;
};

export const createDirectChat = async (userId: string, otherUserId: string): Promise<string> => {
  const existing = await findDirectChatId(userId, otherUserId);
  if (existing) return existing;

  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await db.insert(chats).values({ id: chatId, type: 'direct' });
  await db.insert(chatMembers).values([
    { chatId, userId, unreadCount: 0 },
    { chatId, userId: otherUserId, unreadCount: 0 }
  ]);
  return chatId;
};

export const insertMessage = async (chatId: string, senderId: string, data: {
  type?: string;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
}) => {
  const now = new Date();
  const [msg] = await db
    .insert(messages)
    .values({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId,
      type: (data.type as any) || 'text',
      content: data.text || null,
      mediaUrl: data.mediaUrl || null,
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
      duration: data.duration || null,
      isRead: true,
      createdAt: now
    })
    .returning();
  await db.update(chats).set({ updatedAt: now }).where(eq(chats.id, chatId));
  return msg;
};
