import { pgTable, text, integer, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'document', 'audio', 'voice', 'image', 'video', 'gif', 'system']);
export const storyMediaTypeEnum = pgEnum('story_media_type', ['image', 'video', 'gif', 'document', 'text']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined']);
export const transactionTypeEnum = pgEnum('transaction_type', ['send', 'receive', 'top_up', 'bonus']);
export const notificationTypeEnum = pgEnum('notification_type', ['group', 'security', 'transaction']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  pinHash: text('pin_hash').notNull(),
  balanceFcfa: numeric('balance_fcfa', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  hasReferred: boolean('has_referred').notNull().default(false),
  referralCount: integer('referral_count').notNull().default(0),
  referralEarnings: numeric('referral_earnings', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  avatarUrl: text('avatar_url'),
  statusText: text('status_text'),
  isOnline: boolean('is_online').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contactUserId: text('contact_user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  avatar: text('avatar'),
  statusText: text('status_text'),
  isOnline: boolean('is_online').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  type: chatTypeEnum('type').notNull(),
  groupId: text('group_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const chatMembers = pgTable('chat_members', {
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  unreadCount: integer('unread_count').notNull().default(0),
  lastActive: timestamp('last_active', { withTimezone: true })
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content'),
  mediaUrl: text('media_url'),
  fileName: text('file_name'),
  fileSize: text('file_size'),
  duration: text('duration'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  description: text('description'),
  creatorId: text('creator_id').references(() => users.id, { onDelete: 'set null' }),
  membersCount: integer('members_count').notNull().default(1),
  recentActivity: text('recent_activity')
});

export const groupMembers = pgTable('group_members', {
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow()
});

export const groupPosts = pgTable('group_posts', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar'),
  content: text('content').notNull(),
  likes: integer('likes').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  groupName: text('group_name').notNull(),
  description: text('description'),
  inviterName: text('inviter_name').notNull(),
  avatar: text('avatar'),
  status: invitationStatusEnum('status').notNull().default('pending'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

export const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaType: storyMediaTypeEnum('media_type').notNull().default('text'),
  textContent: text('text_content'),
  textBgColor: text('text_bg_color'),
  mediaUrl: text('media_url'),
  fileName: text('file_name'),
  fileSize: text('file_size'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const storyViews = pgTable('story_views', {
  storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow()
});

export const channels = pgTable('channels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  subscribers: text('subscribers').notNull().default('0'),
  category: text('category').notNull().default(''),
  creatorId: text('creator_id').references(() => users.id, { onDelete: 'set null' }),
  description: text('description'),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const channelFollows = pgTable('channel_follows', {
  channelId: text('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followedAt: timestamp('followed_at', { withTimezone: true }).notNull().defaultNow()
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: notificationTypeEnum('type').notNull().default('group'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amountFcfa: numeric('amount_fcfa', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  feesFcfa: numeric('fees_fcfa', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  referenceCode: text('reference_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const media = pgTable('media', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  data: text('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  contacts: many(contacts),
  chatMemberships: many(chatMembers),
  sentMessages: many(messages),
  groups: many(groupMembers),
  invitations: many(invitations),
  posts: many(groupPosts),
  stories: many(stories),
  storyViews: many(storyViews),
  followedChannels: many(channelFollows),
  notifications: many(notifications),
  transactions: many(transactions),
  media: many(media)
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] })
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, { fields: [contacts.userId], references: [users.id] }),
  contactUser: one(users, { fields: [contacts.contactUserId], references: [users.id] })
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  group: one(groups, { fields: [chats.groupId], references: [groups.id] }),
  members: many(chatMembers),
  messages: many(messages)
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.creatorId], references: [users.id] }),
  members: many(groupMembers),
  posts: many(groupPosts)
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
  views: many(storyViews)
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  creator: one(users, { fields: [channels.creatorId], references: [users.id] }),
  followers: many(channelFollows)
}));

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, { fields: [media.userId], references: [users.id] })
}));
