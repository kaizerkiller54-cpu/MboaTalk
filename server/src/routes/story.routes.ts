import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/error';
import { db } from '../../db/client';
import {
  stories, storyViews, channels, channelFollows, users
} from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { storyToLegacy, channelToLegacy } from '../services/serializers';
import { storageService } from '../services/storage.service';
import crypto from 'crypto';

export const storyRouter = Router();
export const channelRouter = Router();

const addStorySchema = z.object({
  textBgColor: z.string().max(50).optional(),
  textContent: z.string().max(2000).optional(),
  mediaUrl: z.string().max(4000000).optional(),
  mediaType: z.string().max(20).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(50).optional()
});

storyRouter.post('/stories', requireAuth, validateBody(addStorySchema), async (req, res, next) => {
  try {
    const { textBgColor, textContent, mediaUrl, mediaType, fileName, fileSize } = req.body;
    const userId = req.user!.id;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    let storedMediaUrl: string | null = null;
    if (mediaUrl && mediaUrl.startsWith('data:')) {
      const uploaded = await storageService.uploadBase64(mediaUrl, 'stories', userId);
      storedMediaUrl = uploaded.url;
    } else if (mediaUrl) {
      storedMediaUrl = mediaUrl;
    }

    const storyId = `s_${Date.now()}`;
    await db.insert(stories).values({
      id: storyId,
      userId,
      mediaType: (mediaType as any) || 'text',
      textContent: textContent || null,
      textBgColor: textBgColor || null,
      mediaUrl: storedMediaUrl,
      fileName: fileName || null,
      fileSize: fileSize || null,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
    });

    const [row] = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
    return res.json({
      success: true,
      story: storyToLegacy(row, user?.name || 'Moi', user?.avatarUrl || '')
    });
  } catch (err) {
    next(err);
  }
});

storyRouter.post('/stories/:id/view', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [story] = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
    if (!story) throw new AppError('Story introuvable.', 404);

    const existingView = await db
      .select()
      .from(storyViews)
      .where(and(eq(storyViews.storyId, id), eq(storyViews.userId, userId)))
      .limit(1);

    if (existingView.length === 0) {
      await db.insert(storyViews).values({
        storyId: id,
        userId,
        viewedAt: new Date()
      });
      await db.update(stories).set({ viewsCount: story.viewsCount + 1 }).where(eq(stories.id, id));
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

channelRouter.post('/channels/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [channel] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    if (!channel) throw new AppError('Canal introuvable.', 404);

    const existing = await db
      .select()
      .from(channelFollows)
      .where(and(eq(channelFollows.channelId, id), eq(channelFollows.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(channelFollows).values({ channelId: id, userId, followedAt: new Date() });
    } else {
      await db
        .delete(channelFollows)
        .where(and(eq(channelFollows.channelId, id), eq(channelFollows.userId, userId)));
    }

    const follows = await db.select().from(channelFollows).where(eq(channelFollows.userId, userId));
    const followedIds = new Set(follows.map((f) => f.channelId));
    const all = await db.select().from(channels);
    return res.json({
      success: true,
      channels: all.map((ch) => channelToLegacy(ch, followedIds, userId))
    });
  } catch (err) {
    next(err);
  }
});
