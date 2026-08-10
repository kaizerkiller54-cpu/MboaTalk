export interface UserProfile {
  id: string;
  phone: string;
  email: string;
  name: string;
  balance: number;
  hasReferred: boolean;
  referralCount: number;
  referralEarnings: number;
  avatar: string;
  statusText?: string;
  isOnline: boolean;
  createdAt: string;
  contacts: any[];
  groups: any[];
  chats: any[];
  stories: any[];
  channels: any[];
  invitations: any[];
  notifications: any[];
  transactions: any[];
}
