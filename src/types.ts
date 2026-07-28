export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  statusText?: string;
  isOnline: boolean;
}

export interface Story {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'gif' | 'document' | 'text';
  textBgColor?: string;
  textContent?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string; // ISO string
  viewed: boolean;
}

export interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: string;
  category: string;
  isFollowing: boolean;
  creatorId?: string; // id of creator, e.g. 'me' or contact ID
  description?: string;
}

export interface GroupPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
}

export interface GroupInvitation {
  id: string;
  groupName: string;
  description: string;
  inviterName: string;
  avatar: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Group {
  id: string;
  name: string;
  avatar: string;
  membersCount: number;
  recentActivity: string;
  creatorId?: string; // id of creator, e.g. 'me' or contact ID
  description?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  type: 'group' | 'security' | 'transaction';
}

export interface Message {
  id: string;
  senderId: string; // 'me' or contact's id
  text?: string;
  type: 'text' | 'document' | 'audio' | 'voice' | 'image' | 'video' | 'gif' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string; // for voice messages (e.g. "0:12")
  timestamp: string;
}

export interface Chat {
  id: string;
  contactId?: string; // defined for direct chat
  groupId?: string; // defined for group chat
  recentMessage?: string;
  unreadCount: number;
  lastActive: string;
  messages: Message[];
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'top_up';
  amount: number;
  contactName?: string;
  contactPhone?: string;
  fees: number;
  timestamp: string;
}
