import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import {
  groups, groupMembers, groupPosts, invitations, chats, chatMembers, contacts, users, messages
} from '../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { createDirectChat } from '../services/chat.service';
import { groupToLegacy, invitationToLegacy } from '../services/serializers';

export const groupRouter = Router();

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatar: z.string().max(500).optional()
});

groupRouter.post('/groups/create', requireAuth, validateBody(createGroupSchema), async (req, res, next) => {
  try {
    const { name, description, avatar } = req.body;
    const userId = req.user!.id;

    const groupId = `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(groups).values({
      id: groupId,
      name,
      avatar: avatar || '👥',
      description: description || null,
      creatorId: userId,
      membersCount: 1,
      recentActivity: 'Vous avez créé le groupe'
    });
    await db.insert(groupMembers).values({ groupId, userId, role: 'owner' });

    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(chats).values({ id: chatId, type: 'group', groupId });
    await db.insert(chatMembers).values({ chatId, userId, unreadCount: 0 });
    await db.insert(messages).values(messagesForGroup(chatId, userId, `Groupe créé : ${name}`));

    const contactsRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
    const contactIdByUserId = new Map<string, string>();
    for (const c of contactsRows) if (c.contactUserId) contactIdByUserId.set(c.contactUserId, c.id);

    const [grp] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);

    return res.json({
      success: true,
      group: groupToLegacy(grp, userId, contactIdByUserId),
      chat: {
        id: chat.id,
        groupId: chat.groupId!,
        recentMessage: 'Vous avez créé ce groupe',
        unreadCount: 0,
        lastActive: chat.createdAt.toISOString(),
        messages: []
      }
    });
  } catch (err) {
    next(err);
  }
});

function messagesForGroup(chatId: string, senderId: string, text: string) {
  return {
    id: `mg_init_${Date.now()}`,
    chatId,
    senderId,
    type: 'system' as const,
    content: text,
    isRead: true
  };
}

const respondSchema = z.object({
  status: z.enum(['accepted', 'declined'])
});

groupRouter.post('/groups/invitations/:id/respond', requireAuth, validateBody(respondSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const [inv] = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.userId, userId)))
      .limit(1);
    if (!inv) throw new AppError('Invitation introuvable.', 404);

    await db.update(invitations).set({ status }).where(eq(invitations.id, id));

    if (status === 'accepted') {
      const groupId = inv.groupId || `g_inv_${Date.now()}`;
      if (inv.groupId) {
        const existing = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
        if (existing.length > 0) {
          const membership = await db
            .select()
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
            .limit(1);
          if (membership.length === 0) {
            await db.insert(groupMembers).values({ groupId, userId, role: 'member' });
            await db
              .update(groups)
              .set({ membersCount: existing[0].membersCount + 1, recentActivity: 'Vous avez rejoint la communauté' })
              .where(eq(groups.id, groupId));
          }
        }
      } else {
        await db.insert(groups).values({
          id: groupId,
          name: inv.groupName,
          avatar: inv.avatar || '👥',
          description: inv.description || null,
          membersCount: 8,
          recentActivity: 'Vous avez rejoint la communauté'
        });
        await db.insert(groupMembers).values({ groupId, userId, role: 'member' });
      }

      const [existingChat] = await db.select().from(chats).where(and(eq(chats.groupId, groupId), eq(chats.type, 'group'))).limit(1);
      if (!existingChat) {
        const chatId = `chat_g_${Date.now()}`;
        await db.insert(chats).values({ id: chatId, type: 'group', groupId });
        await db.insert(chatMembers).values({ chatId, userId, unreadCount: 0 });
        await db.insert(messages).values(messagesForGroup(chatId, userId, `Vous avez rejoint "${inv.groupName}"`));
      } else {
        await db.insert(chatMembers).values({ chatId: existingChat.id, userId, unreadCount: 0 }).onConflictDoNothing();
      }
    }

    const invRows = await db.select().from(invitations).where(eq(invitations.userId, userId));
    return res.json({ success: true, invitations: invRows.map(invitationToLegacy) });
  } catch (err) {
    next(err);
  }
});

groupRouter.get('/groups/:groupId/posts', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const posts = await db.select().from(groupPosts).where(eq(groupPosts.groupId, groupId));
    return res.json({
      success: true,
      posts: posts.map((p) => ({
        id: p.id,
        authorName: p.authorName,
        authorAvatar: p.authorAvatar || '',
        content: p.content,
        timestamp: p.createdAt.toISOString(),
        likes: p.likes,
        commentsCount: p.commentsCount
      }))
    });
  } catch (err) {
    next(err);
  }
});

const postSchema = z.object({ content: z.string().min(1).max(2000) });

groupRouter.post('/groups/:groupId/post', requireAuth, validateBody(postSchema), async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const { content } = req.body;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const postId = `gp_${Date.now()}`;
    await db.insert(groupPosts).values({
      id: postId,
      groupId,
      authorId: userId,
      authorName: 'Moi',
      authorAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      content
    });

    return res.json({
      success: true,
      post: {
        id: postId,
        authorName: 'Moi',
        authorAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        content,
        timestamp: 'À l\'instant',
        likes: 0,
        commentsCount: 0
      }
    });
  } catch (err) {
    next(err);
  }
});

groupRouter.post('/groups/:groupId/post/:postId/like', requireAuth, async (req, res, next) => {
  try {
    const { groupId, postId } = req.params;
    const [post] = await db.select().from(groupPosts).where(and(eq(groupPosts.groupId, groupId), eq(groupPosts.id, postId))).limit(1);
    if (!post) throw new AppError('Post introuvable.', 404);
    const likes = post.likes + 1;
    await db.update(groupPosts).set({ likes }).where(eq(groupPosts.id, postId));
    return res.json({ success: true, likes });
  } catch (err) {
    next(err);
  }
});

groupRouter.post('/groups/:groupId/post/:postId/comment', requireAuth, async (req, res, next) => {
  try {
    const { groupId, postId } = req.params;
    const [post] = await db.select().from(groupPosts).where(and(eq(groupPosts.groupId, groupId), eq(groupPosts.id, postId))).limit(1);
    if (!post) throw new AppError('Post introuvable.', 404);
    const commentsCount = post.commentsCount + 1;
    await db.update(groupPosts).set({ commentsCount }).where(eq(groupPosts.id, postId));
    return res.json({ success: true, commentsCount });
  } catch (err) {
    next(err);
  }
});
