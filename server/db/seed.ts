import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { db } from './client';
import {
  users,
  contacts,
  chats,
  chatMembers,
  messages,
  groups,
  groupMembers,
  groupPosts,
  invitations,
  stories,
  channels,
  channelFollows,
  notifications,
  transactions
} from './schema';
import { eq } from 'drizzle-orm';
import {
  INITIAL_CONTACTS,
  INITIAL_STORIES,
  CHANNEL_SUGGESTIONS,
  INITIAL_GROUPS,
  INITIAL_INVITATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHATS,
  INITIAL_TRANSACTIONS,
  GROUP_POSTS_INITIAL
} from '../../src/data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '..', 'data', 'db.json');

interface LegacyUser {
  phone: string;
  email: string;
  name?: string;
  password: string;
  pin: string;
  balance: number;
  hasReferred: boolean;
  referralCount: number;
  referralEarnings: number;
  contacts: any[];
  groups: any[];
  chats: any[];
  stories: any[];
  channels: any[];
  invitations: any[];
  notifications: any[];
  transactions: any[];
}

const phoneToId = new Map<string, string>();
const uuid = () => crypto.randomUUID();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const retry = async <T>(fn: () => Promise<T>, attempts = 3, label = 'op'): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const willRetry = i < attempts - 1;
      if (willRetry) {
        console.log(`[db:seed]   retry ${label} (${i + 1}/${attempts}) -> ${err?.code || err?.message}`);
        await sleep(2000 * (i + 1));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
};

const getOrCreateUser = async (legacy: LegacyUser) => {
  const existing = await retry(
    () => db.select({ id: users.id }).from(users).where(eq(users.phone, legacy.phone)).limit(1),
    3,
    'find user'
  );
  if (existing.length > 0) {
    phoneToId.set(legacy.phone, existing[0].id);
    return existing[0].id;
  }

  const id = uuid();
  phoneToId.set(legacy.phone, id);
  const passwordHash = await bcrypt.hash(legacy.password || 'mboaTalkSecure!26', 12);
  const pinHash = await bcrypt.hash(legacy.pin || '1234', 12);

  await retry(() => db.insert(users).values({
    id,
    phone: legacy.phone,
    email: legacy.email,
    name: legacy.name || legacy.phone,
    passwordHash,
    pinHash,
    balanceFcfa: legacy.balance ?? 0,
    hasReferred: legacy.hasReferred ?? false,
    referralCount: legacy.referralCount ?? 0,
    referralEarnings: legacy.referralEarnings ?? 0
  }).onConflictDoNothing(), 3, 'insert user');
  return id;
};

const seed = async () => {
  console.log('[db:seed] Loading legacy data...');
  const legacyUsers: LegacyUser[] = [];
  if (fs.existsSync(DB_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    for (const phone of Object.keys(raw.users || {})) {
      legacyUsers.push({ ...raw.users[phone], phone });
    }
  }
  console.log(`[db:seed] Legacy users found: ${legacyUsers.length}`);

  const demoPhone = '+237 671 332 741';
  const demoEmail = 'demo@mboatalk.com';
  if (legacyUsers.length === 0) {
    legacyUsers.push({
      phone: demoPhone,
      email: demoEmail,
      password: 'mboaTalkSecure!26',
      pin: '1234',
      balance: 450,
      hasReferred: false,
      referralCount: 1,
      referralEarnings: 5,
      contacts: INITIAL_CONTACTS.map((c) => ({ ...c })),
      groups: INITIAL_GROUPS.map((g) => ({ ...g })),
      chats: INITIAL_CHATS.map((c) => ({ ...c, messages: c.messages.map((m) => ({ ...m })) })),
      stories: INITIAL_STORIES.map((s) => ({ ...s })),
      channels: CHANNEL_SUGGESTIONS.map((c) => ({ ...c })),
      invitations: INITIAL_INVITATIONS.map((i) => ({ ...i })),
      notifications: INITIAL_NOTIFICATIONS.map((n) => ({ ...n })),
      transactions: INITIAL_TRANSACTIONS.map((t) => ({ ...t }))
    });
    console.log('[db:seed] No legacy user; using initial demo data.');
  }

  for (const legacy of legacyUsers) {
    const id = await getOrCreateUser(legacy);
    console.log(`[db:seed] User ${legacy.phone} (${legacy.email}) -> ${id}`);

    const contactRows = (legacy.contacts || []).map((c) => ({
      id: c.id || uuid(),
      userId: id,
      contactUserId: phoneToId.get(c.phone) || null,
      name: c.name,
      phone: c.phone,
      avatar: c.avatar,
      statusText: c.statusText,
      isOnline: c.isOnline ?? false
    }));
    if (contactRows.length) await retry(() => db.insert(contacts).values(contactRows).onConflictDoNothing(), 3, 'insert contacts');

    const groupRows = (legacy.groups || []).map((g) => ({
      id: g.id || uuid(),
      name: g.name,
      avatar: g.avatar || '👥',
      description: g.description,
      creatorId: g.creatorId === 'me' ? id : phoneToId.get(g.creatorId) || null,
      membersCount: g.membersCount ?? 1,
      recentActivity: g.recentActivity
    }));
    if (groupRows.length) {
      await retry(() => db.insert(groups).values(groupRows).onConflictDoNothing(), 3, 'insert groups');
      await retry(() => db.insert(groupMembers).values(
        groupRows.map((g) => ({ groupId: g.id, userId: id, role: 'member' }))
      ).onConflictDoNothing(), 3, 'insert group_members');
    }

    const chatRows = [];
    const memberRows = [];
    const messageRows = [];
    for (const chat of legacy.chats || []) {
      const chatId = chat.id || uuid();
      const isGroup = Boolean(chat.groupId);
      chatRows.push({ id: chatId, type: isGroup ? 'group' : 'direct', groupId: chat.groupId || null });
      memberRows.push({
        chatId,
        userId: id,
        unreadCount: chat.unreadCount ?? 0,
        lastActive: chat.lastActive ? new Date(chat.lastActive) : null
      });
      for (const m of chat.messages || []) {
        const senderId = m.senderId === 'me' ? id : phoneToId.get(chat.contactId || m.senderId) || id;
        messageRows.push({
          id: m.id || uuid(),
          chatId,
          senderId,
          type: m.type || 'text',
          content: m.text || null,
          mediaUrl: m.fileUrl && !m.fileUrl.startsWith('data:') ? m.fileUrl : null,
          fileName: m.fileName || null,
          fileSize: m.fileSize || null,
          duration: m.duration || null,
          isRead: true,
          createdAt: m.timestamp ? new Date(m.timestamp) : new Date()
        });
      }
    }
    if (chatRows.length) await retry(() => db.insert(chats).values(chatRows).onConflictDoNothing(), 3, 'insert chats');
    if (memberRows.length) await retry(() => db.insert(chatMembers).values(memberRows).onConflictDoNothing(), 3, 'insert chat_members');
    if (messageRows.length) await retry(() => db.insert(messages).values(messageRows).onConflictDoNothing(), 3, 'insert messages');

    const storyRows = (legacy.stories || []).map((s) => ({
      id: s.id || uuid(),
      userId: id,
      mediaType: s.mediaType || 'text',
      textContent: s.textContent || null,
      textBgColor: s.textBgColor || null,
      mediaUrl: s.mediaUrl && !s.mediaUrl.startsWith('data:') ? s.mediaUrl : null,
      fileName: s.fileName || null,
      fileSize: s.fileSize || null,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      viewsCount: s.viewed ? 1 : 0
    }));
    if (storyRows.length) await retry(() => db.insert(stories).values(storyRows).onConflictDoNothing(), 3, 'insert stories');

    const channelRows = [];
    const followRows = [];
    for (const ch of legacy.channels || []) {
      const channelId = ch.id || uuid();
      channelRows.push({
        id: channelId,
        name: ch.name,
        avatar: ch.avatar,
        subscribers: ch.subscribers || '0',
        category: ch.category || '',
        creatorId: ch.creatorId === 'me' ? id : ch.creatorId || null,
        description: ch.description,
        isVerified: ch.isVerified ?? false
      });
      if (ch.isFollowing) {
        followRows.push({ userId: id, channelId });
      }
    }
    if (channelRows.length) await retry(() => db.insert(channels).values(channelRows).onConflictDoNothing(), 3, 'insert channels');
    if (followRows.length) await retry(() => db.insert(channelFollows).values(followRows).onConflictDoNothing(), 3, 'insert channel_follows');

    const invRows = (legacy.invitations || []).map((inv) => ({
      id: inv.id || uuid(),
      groupName: inv.groupName,
      description: inv.description,
      inviterName: inv.inviterName,
      avatar: inv.avatar,
      status: inv.status || 'pending',
      userId: id
    }));
    if (invRows.length) await retry(() => db.insert(invitations).values(invRows).onConflictDoNothing(), 3, 'insert invitations');

    const notifRows = (legacy.notifications || []).map((n) => ({
      id: n.id || uuid(),
      userId: id,
      title: n.title,
      body: n.body,
      type: n.type || 'group',
      isRead: n.isRead ?? false
    }));
    if (notifRows.length) await retry(() => db.insert(notifications).values(notifRows).onConflictDoNothing(), 3, 'insert notifications');

    const txRows = (legacy.transactions || []).map((t) => ({
      id: t.id || uuid(),
      userId: id,
      type: t.type || 'top_up',
      amountFcfa: t.amount ?? 0,
      feesFcfa: t.fees ?? 0,
      contactName: t.contactName || null,
      contactPhone: t.contactPhone || null,
      referenceCode: t.referenceCode || null,
      createdAt: t.timestamp ? new Date(t.timestamp) : new Date()
    }));
    if (txRows.length) await retry(() => db.insert(transactions).values(txRows).onConflictDoNothing(), 3, 'insert transactions');

    console.log(`[db:seed]   Seeded user ${legacy.phone}`);
  }

  const postRows = GROUP_POSTS_INITIAL.map((gp) => ({
    id: gp.id || uuid(),
    groupId: gp.groupId,
    authorName: gp.authorName,
    authorAvatar: gp.authorAvatar,
    content: gp.content,
    likes: gp.likes ?? 0,
    commentsCount: gp.commentsCount ?? 0
  }));
  if (postRows.length) await retry(() => db.insert(groupPosts).values(postRows).onConflictDoNothing(), 3, 'insert group_posts');

  console.log('[db:seed] Done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[db:seed] Failed:', err);
  process.exit(1);
});
