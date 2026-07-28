import type { UserProfile } from '../../server/db';
import { Message, Chat, Story, Channel, Group, GroupInvitation, Transaction, Notification, GroupPost } from '../types';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const phone = localStorage.getItem('securconnect_user_phone');
  if (phone) {
    headers['x-user-phone'] = phone;
  }
  return headers;
};

export const api = {
  // Auth
  async sendOTP(phone: string) {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'envoi du code SMS.');
    }
    return res.json();
  },

  async verifyOTP(phone: string, code: string) {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Code SMS incorrect.');
    }
    return res.json();
  },

  async sendEmailOTP(email: string) {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'envoi du code email.');
    }
    return res.json();
  },

  async verifyEmailOTP(phone: string, email: string, code: string) {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Code email incorrect.');
    }
    return res.json(); // returns { success, user }
  },

  async register(email: string, password: string, name?: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la création du compte.');
    }
    return res.json() as Promise<{ success: boolean; user: UserProfile }>;
  },

  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Email ou mot de passe incorrect.');
    }
    return res.json() as Promise<{ success: boolean; user: UserProfile }>;
  },

  // State
  async getState() {
    const res = await fetch('/api/state', {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la récupération de la session.');
    }
    return res.json() as Promise<{ success: boolean; user: UserProfile }>;
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
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'envoi du message.');
    }
    return res.json() as Promise<{ success: boolean; message: Message }>;
  },

  async createChat(data: { contactId?: string; groupId?: string }) {
    const res = await fetch('/api/chats/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la création de la discussion.');
    }
    return res.json() as Promise<{ success: boolean; chat: Chat }>;
  },

  async deleteChat(chatId: string) {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la suppression de la discussion.');
    }
    return res.json();
  },

  // Groups
  async createGroup(data: { name: string; description?: string; avatar?: string }) {
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la création du groupe.');
    }
    return res.json() as Promise<{ success: boolean; group: Group; chat: Chat }>;
  },

  async respondToInvitation(id: string, status: 'accepted' | 'declined') {
    const res = await fetch(`/api/groups/invitations/${id}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de réponse à l\'invitation.');
    }
    return res.json() as Promise<{ success: boolean; invitations: GroupInvitation[] }>;
  },

  async getGroupPosts(groupId: string) {
    const res = await fetch(`/api/groups/${groupId}/posts`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de récupération des publications.');
    }
    return res.json() as Promise<{ success: boolean; posts: GroupPost[] }>;
  },

  async addGroupPost(groupId: string, content: string) {
    const res = await fetch(`/api/groups/${groupId}/post`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur d\'ajout de publication.');
    }
    return res.json() as Promise<{ success: boolean; post: GroupPost }>;
  },

  async likeGroupPost(groupId: string, postId: string) {
    const res = await fetch(`/api/groups/${groupId}/post/${postId}/like`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors du "like".');
    }
    return res.json() as Promise<{ success: boolean; likes: number }>;
  },

  async commentGroupPost(groupId: string, postId: string) {
    const res = await fetch(`/api/groups/${groupId}/post/${postId}/comment`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur d\'ajout du commentaire.');
    }
    return res.json() as Promise<{ success: boolean; commentsCount: number }>;
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
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l\'ajout de la story.');
    }
    return res.json() as Promise<{ success: boolean; story: Story }>;
  },

  async viewStory(id: string) {
    const res = await fetch(`/api/stories/${id}/view`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de lecture de la story.');
    }
    return res.json();
  },

  async followChannel(id: string) {
    const res = await fetch(`/api/channels/${id}/follow`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur d\'abonnement au canal.');
    }
    return res.json() as Promise<{ success: boolean; channels: Channel[] }>;
  },

  // Wallet
  async verifyWalletPin(pin: string) {
    const res = await fetch('/api/wallet/verify-pin', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'PIN incorrect.');
    }
    return res.json();
  },

  async executeTransfer(data: { contactPhone: string; amount: number; fee: number }) {
    const res = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de transfert.');
    }
    return res.json() as Promise<{ success: boolean; balance: number; transaction: Transaction; chats: Chat[] }>;
  },

  async topUpBalance(amount: number) {
    const res = await fetch('/api/wallet/top-up', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de recharge.');
    }
    return res.json() as Promise<{ success: boolean; balance: number; transaction: Transaction }>;
  },

  async runReferralSimulation(data: { name: string; phone: string }) {
    const res = await fetch('/api/wallet/referral', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la simulation de parrainage.');
    }
    return res.json() as Promise<{ success: boolean; user: UserProfile }>;
  },

  // Settings & Notifications
  async markNotificationsRead() {
    const res = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de lecture des notifications.');
    }
    return res.json() as Promise<{ success: boolean; notifications: Notification[] }>;
  },

  async clearNotification(id: string) {
    const res = await fetch('/api/notifications/clear', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de suppression de la notification.');
    }
    return res.json() as Promise<{ success: boolean; notifications: Notification[] }>;
  },

  async updateProfile(data: { pin?: string; email?: string }) {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de mise à jour du profil.');
    }
    return res.json() as Promise<{ success: boolean; user: UserProfile }>;
  }
};
