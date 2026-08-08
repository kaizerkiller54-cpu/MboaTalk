import { db } from '../../db/client';
import {
  users, contacts, groups, groupMembers, chats, chatMembers, messages,
  stories, channels, channelFollows, invitations, notifications, transactions
} from '../../db/schema';
import { inArray, eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

export const uuid = () => crypto.randomUUID();

interface ContactRef {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  avatar: string | null;
  statusText: string | null;
  isOnline: boolean;
}

export const toPublicUser = (user: typeof users.$inferSelect) => ({
  id: user.id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  balanceFcfa: user.balanceFcfa,
  hasReferred: user.hasReferred,
  referralCount: user.referralCount,
  referralEarnings: user.referralEarnings,
  avatarUrl: user.avatarUrl,
  statusText: user.statusText,
  isOnline: user.isOnline,
  createdAt: user.createdAt
});

const recentTextFor = (m: typeof messages.$inferSelect): string => {
  if (m.type === 'text' && m.content) return m.content;
  switch (m.type) {
    case 'image': return '🖼️ Image';
    case 'video': return '🎥 Vidéo';
    case 'gif': return '🎞️ GIF';
    case 'document': return `📄 Document: ${m.fileName || ''}`;
    case 'voice': return '🎤 Message vocal';
    case 'audio': return '🎵 Audio';
    case 'system': return m.content || '';
    default: return 'Pièce jointe';
  }
};

export const buildBundle = async (userId: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found');

  // Contacts of this user
  const contactRows = await db.select().from(contacts).where(eq(contacts.userId, userId));
  const contactsMap = new Map<string, ContactRef>();
  for (const c of contactRows) {
    contactsMap.set(c.id, {
      id: c.id,
      userId: c.contactUserId,
      name: c.name,
      phone: c.phone,
      avatar: c.avatar,
      statusText: c.statusText,
      isOnline: c.isOnline
    });
  }

  // userId -> contactId (for resolving message senders from this user's perspective)
  const contactIdByUserId = new Map<string, string>();
  for (const c of contactsMap.values()) {
    if (c.userId) contactIdByUserId.set(c.userId, c.id);
  }

  // Chats where this user is a member
  const memberships = await db
    .select()
    .from(chatMembers)
    .where(eq(chatMembers.userId, userId));

  const chatIds = memberships.map((m) => m.chatId);
  const chatRows = chatIds.length
    ? await db.select().from(chats).where(inArray(chats.id, chatIds))
    : [];

  const allMembers = chatIds.length
    ? await db.select().from(chatMembers).where(inArray(chatMembers.chatId, chatIds))
    : [];

  const allMessages = chatIds.length
    ? await db
        .select()
        .from(messages)
        .where(inArray(messages.chatId, chatIds))
        .orderBy(desc(messages.createdAt))
    : [];

  const messagesByChat = new Map<string, typeof allMessages>();
  for (const m of allMessages) {
    if (!messagesByChat.has(m.chatId)) messagesByChat.set(m.chatId, []);
    messagesByChat.get(m.chatId)!.push(m);
  }

  const groupIdsOfChats = chatRows
    .filter((c) => c.groupId)
    .map((c) => c.groupId!);

  const membersByChat = new Map<string, typeof allMembers>();
  for (const m of allMembers) {
    if (!membersByChat.has(m.chatId)) membersByChat.set(m.chatId, []);
    membersByChat.get(m.chatId)!.push(m);
  }

  const directChatOthers = new Map<string, string | null>(); // chatId -> other userId
  for (const chat of chatRows) {
    if (chat.type === 'direct') {
      const members = membersByChat.get(chat.id) || [];
      const other = members.find((m) => m.userId !== userId);
      directChatOthers.set(chat.id, other ? other.userId : null);
    }
  }

  // Build chats in legacy shape
  const bundleChats = chatRows.map((chat) => {
    const memberRow = memberships.find((m) => m.chatId === chat.id);
    const msgs = (messagesByChat.get(chat.id) || []).slice().reverse();
    const contactId = chat.type === 'direct'
      ? (() => {
          const otherUserId = directChatOthers.get(chat.id);
          return otherUserId ? contactIdByUserId.get(otherUserId) || otherUserId : undefined;
        })()
      : undefined;
    const recent = msgs.length ? msgs[msgs.length - 1] : undefined;

    return {
      id: chat.id,
      ...(contactId ? { contactId } : {}),
      ...(chat.groupId ? { groupId: chat.groupId } : {}),
      recentMessage: recent ? recentTextFor(recent) : (chat.type === 'group' ? 'Groupe rejoint' : 'Discussion créée'),
      unreadCount: memberRow?.unreadCount ?? 0,
      lastActive: (recent?.createdAt || chat.updatedAt).toISOString(),
      messages: msgs.map((m) => ({
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
  });

  // Groups where this user is a member
  const myGroupMemberships = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  const myGroupIds = myGroupMemberships.map((g) => g.groupId);
  const groupRows = myGroupIds.length
    ? await db.select().from(groups).where(inArray(groups.id, myGroupIds))
    : [];

  const bundleGroups = groupRows.map((g) => ({
    id: g.id,
    name: g.name,
    avatar: g.avatar,
    membersCount: g.membersCount,
    recentActivity: g.recentActivity || 'Activité récente',
    ...(g.creatorId === userId ? { creatorId: 'me' } : g.creatorId ? { creatorId: contactIdByUserId.get(g.creatorId) || g.creatorId } : {}),
    ...(g.description ? { description: g.description } : {})
  }));

  // Stories of this user
  const storyRows = await db.select().from(stories).where(eq(stories.userId, userId));
  const bundleStories = storyRows.map((s) => ({
    id: s.id,
    contactId: 'me',
    contactName: 'Moi',
    contactAvatar: user.avatarUrl || '',
    mediaUrl: s.mediaUrl || '',
    mediaType: s.mediaType,
    ...(s.textBgColor ? { textBgColor: s.textBgColor } : {}),
    ...(s.textContent ? { textContent: s.textContent } : {}),
    ...(s.fileName ? { fileName: s.fileName } : {}),
    ...(s.fileSize ? { fileSize: s.fileSize } : {}),
    timestamp: s.createdAt.toISOString(),
    viewed: s.viewsCount > 0
  }));

  // Channels: all channels with isFollowing flag for this user
  const followRows = await db
    .select()
    .from(channelFollows)
    .where(eq(channelFollows.userId, userId));
  const followedIds = new Set(followRows.map((f) => f.channelId));
  const channelRows = await db.select().from(channels);
  const bundleChannels = channelRows.map((ch) => ({
    id: ch.id,
    name: ch.name,
    avatar: ch.avatar,
    subscribers: ch.subscribers,
    category: ch.category,
    isFollowing: followedIds.has(ch.id),
    ...(ch.creatorId === userId ? { creatorId: 'me' } : ch.creatorId ? { creatorId: ch.creatorId } : {}),
    ...(ch.description ? { description: ch.description } : {})
  }));

  // Invitations for this user
  const invRows = await db.select().from(invitations).where(eq(invitations.userId, userId));
  const bundleInvitations = invRows.map((i) => ({
    id: i.id,
    groupName: i.groupName,
    ...(i.description ? { description: i.description } : {}),
    inviterName: i.inviterName,
    ...(i.avatar ? { avatar: i.avatar } : {}),
    status: i.status
  }));

  // Notifications for this user
  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
  const bundleNotifications = notifRows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    timestamp: n.createdAt.toISOString(),
    isRead: n.isRead,
    type: n.type
  }));

  // Transactions for this user
  const txRows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
  const bundleTransactions = txRows.map((t) => ({
    id: t.id,
    type: t.type === 'bonus' ? 'receive' : t.type,
    amount: t.amountFcfa,
    ...(t.contactName ? { contactName: t.contactName } : {}),
    ...(t.contactPhone ? { contactPhone: t.contactPhone } : {}),
    fees: t.feesFcfa,
    timestamp: t.createdAt.toISOString()
  }));

  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    password: '',
    pin: '',
    balance: user.balanceFcfa,
    hasReferred: user.hasReferred,
    referralCount: user.referralCount,
    referralEarnings: user.referralEarnings,
    contacts: [...contactsMap.values()],
    groups: bundleGroups,
    chats: bundleChats,
    stories: bundleStories,
    channels: bundleChannels,
    invitations: bundleInvitations,
    notifications: bundleNotifications,
    transactions: bundleTransactions
  };
};

export type UserBundle = Awaited<ReturnType<typeof buildBundle>>;
