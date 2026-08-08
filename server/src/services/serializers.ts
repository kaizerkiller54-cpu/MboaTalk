import {
  messages, stories, notifications, transactions, channels, groups, invitations
} from '../../db/schema';

type MessageRow = typeof messages.$inferSelect;
type StoryRow = typeof stories.$inferSelect;
type NotificationRow = typeof notifications.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;
type ChannelRow = typeof channels.$inferSelect;
type GroupRow = typeof groups.$inferSelect;
type InvitationRow = typeof invitations.$inferSelect;

export const recentTextFor = (m: MessageRow): string => {
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

export const messageToLegacy = (
  m: MessageRow,
  userId: string,
  contactIdByUserId: Map<string, string>
) => ({
  id: m.id,
  senderId: m.senderId === userId ? 'me' : contactIdByUserId.get(m.senderId) || m.senderId,
  text: m.content || undefined,
  type: m.type,
  fileUrl: m.mediaUrl || undefined,
  fileName: m.fileName || undefined,
  fileSize: m.fileSize || undefined,
  duration: m.duration || undefined,
  timestamp: m.createdAt.toISOString()
});

export const storyToLegacy = (s: StoryRow, meName: string, meAvatar: string) => ({
  id: s.id,
  contactId: 'me',
  contactName: meName,
  contactAvatar: meAvatar,
  mediaUrl: s.mediaUrl || '',
  mediaType: s.mediaType,
  ...(s.textBgColor ? { textBgColor: s.textBgColor } : {}),
  ...(s.textContent ? { textContent: s.textContent } : {}),
  ...(s.fileName ? { fileName: s.fileName } : {}),
  ...(s.fileSize ? { fileSize: s.fileSize } : {}),
  timestamp: s.createdAt.toISOString(),
  viewed: s.viewsCount > 0
});

export const notificationToLegacy = (n: NotificationRow) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  timestamp: n.createdAt.toISOString(),
  isRead: n.isRead,
  type: n.type
});

export const transactionToLegacy = (t: TransactionRow) => ({
  id: t.id,
  type: t.type === 'bonus' ? 'receive' : t.type,
  amount: t.amountFcfa,
  ...(t.contactName ? { contactName: t.contactName } : {}),
  ...(t.contactPhone ? { contactPhone: t.contactPhone } : {}),
  fees: t.feesFcfa,
  timestamp: t.createdAt.toISOString()
});

export const channelToLegacy = (ch: ChannelRow, followedIds: Set<string>, userId: string) => ({
  id: ch.id,
  name: ch.name,
  avatar: ch.avatar,
  subscribers: ch.subscribers,
  category: ch.category,
  isFollowing: followedIds.has(ch.id),
  ...(ch.creatorId === userId ? { creatorId: 'me' } : ch.creatorId ? { creatorId: ch.creatorId } : {}),
  ...(ch.description ? { description: ch.description } : {})
});

export const groupToLegacy = (g: GroupRow, userId: string, contactIdByUserId: Map<string, string>) => ({
  id: g.id,
  name: g.name,
  avatar: g.avatar,
  membersCount: g.membersCount,
  recentActivity: g.recentActivity || 'Activité récente',
  ...(g.creatorId === userId ? { creatorId: 'me' } : g.creatorId ? { creatorId: contactIdByUserId.get(g.creatorId) || g.creatorId } : {}),
  ...(g.description ? { description: g.description } : {})
});

export const invitationToLegacy = (i: InvitationRow) => ({
  id: i.id,
  groupName: i.groupName,
  ...(i.description ? { description: i.description } : {}),
  inviterName: i.inviterName,
  ...(i.avatar ? { avatar: i.avatar } : {}),
  status: i.status
});
