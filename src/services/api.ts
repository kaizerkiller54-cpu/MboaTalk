import type { UserProfile } from '../../server/db';
import { Message, Chat, Story, Channel, Group, GroupInvitation, Transaction, Notification, GroupPost } from '../types';
import { apiFetch, tokenStore } from './client';

const storeSession = (res: { user: UserProfile; accessToken?: string; refreshToken?: string }) => {
  if (res.user) {
    localStorage.setItem('securconnect_user_phone', res.user.phone);
    localStorage.setItem('securconnect_user_email', res.user.email);
  }
  if (res.accessToken && res.refreshToken) {
    tokenStore.set(res.accessToken, res.refreshToken);
  }
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await apiFetch<{ success: boolean; user: UserProfile; accessToken: string; refreshToken: string }>(
      '/api/v1/auth/login',
      { method: 'POST', body: { email, password } }
    );
    storeSession(res);
    return res;
  },

  async register(email: string, password: string, name?: string): Promise<{ success: boolean; user: UserProfile }> {
    const res = await apiFetch<{ success: boolean; user: UserProfile; accessToken: string; refreshToken: string }>(
      '/api/v1/auth/register',
      { method: 'POST', body: { email, password, name } }
    );
    storeSession(res);
    return res;
  },

  async logout() {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      apiFetch('/api/v1/auth/logout', { method: 'POST', body: { refreshToken: refresh } }).catch(() => {});
    }
    tokenStore.clear();
  },

  // State
  async getState() {
    return apiFetch<{ success: boolean; user: UserProfile }>('/api/v1/state');
  },

  // Messages
  async sendMessage(data: {
    chatId: string;
    text?: string;
    type?: string;
    fileName?: string;
    fileSize?: string;
    fileUrl?: string;
  }) {
    return apiFetch<{ success: boolean; message: Message }>('/api/v1/messages', {
      method: 'POST',
      body: data
    });
  },

  async createChat(data: { contactId?: string; groupId?: string }) {
    return apiFetch<{ success: boolean; chat: Chat }>('/api/v1/chats/create', {
      method: 'POST',
      body: data
    });
  },

  async deleteChat(chatId: string) {
    return apiFetch(`/api/v1/chats/${chatId}`, { method: 'DELETE' });
  },

  // Groups
  async createGroup(data: { name: string; description?: string; avatar?: string }) {
    return apiFetch<{ success: boolean; group: Group; chat: Chat }>('/api/v1/groups/create', {
      method: 'POST',
      body: data
    });
  },

  async respondToInvitation(id: string, status: 'accepted' | 'declined') {
    return apiFetch<{ success: boolean; invitations: GroupInvitation[] }>(`/api/v1/groups/invitations/${id}/respond`, {
      method: 'POST',
      body: { status }
    });
  },

  async getGroupPosts(groupId: string) {
    return apiFetch<{ success: boolean; posts: GroupPost[] }>(`/api/v1/groups/${groupId}/posts`);
  },

  async addGroupPost(groupId: string, content: string) {
    return apiFetch<{ success: boolean; post: GroupPost }>(`/api/v1/groups/${groupId}/post`, {
      method: 'POST',
      body: { content }
    });
  },

  async likeGroupPost(groupId: string, postId: string) {
    return apiFetch<{ success: boolean; likes: number }>(`/api/v1/groups/${groupId}/post/${postId}/like`, {
      method: 'POST'
    });
  },

  async commentGroupPost(groupId: string, postId: string) {
    return apiFetch<{ success: boolean; commentsCount: number }>(`/api/v1/groups/${groupId}/post/${postId}/comment`, {
      method: 'POST'
    });
  },

  // Stories & Channels
  async addStory(data: {
    textBgColor?: string;
    textContent?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: string;
  }) {
    return apiFetch<{ success: boolean; story: Story }>('/api/v1/stories', {
      method: 'POST',
      body: data
    });
  },

  async viewStory(id: string) {
    return apiFetch(`/api/v1/stories/${id}/view`, { method: 'POST' });
  },

  async followChannel(id: string) {
    return apiFetch<{ success: boolean; channels: Channel[] }>(`/api/v1/channels/${id}/follow`, { method: 'POST' });
  },

  // Wallet
  async verifyWalletPin(pin: string) {
    return apiFetch('/api/v1/wallet/verify-pin', { method: 'POST', body: { pin } });
  },

  async executeTransfer(data: { contactPhone: string; amount: number; fee: number }) {
    return apiFetch<{ success: boolean; balance: number; transaction: Transaction; chats: Chat[] }>(
      '/api/v1/wallet/transfer',
      { method: 'POST', body: data }
    );
  },

  async topUpBalance(amount: number) {
    return apiFetch<{ success: boolean; balance: number; transaction: Transaction }>('/api/v1/wallet/top-up', {
      method: 'POST',
      body: { amount }
    });
  },

  async runReferralSimulation(data: { name: string; phone: string }) {
    return apiFetch<{ success: boolean; user: UserProfile }>('/api/v1/wallet/referral', {
      method: 'POST',
      body: data
    });
  },

  // Settings & Notifications
  async markNotificationsRead() {
    return apiFetch<{ success: boolean; notifications: Notification[] }>('/api/v1/notifications/mark-read', {
      method: 'POST'
    });
  },

  async clearNotification(id: string) {
    return apiFetch<{ success: boolean; notifications: Notification[] }>('/api/v1/notifications/clear', {
      method: 'POST',
      body: { id }
    });
  },

  async updateProfile(data: { pin?: string; email?: string }) {
    return apiFetch<{ success: boolean; user: UserProfile }>('/api/v1/profile/update', {
      method: 'POST',
      body: data
    });
  }
};
