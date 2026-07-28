import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Contact, Story, Channel, Group, GroupInvitation, Notification, Chat, Transaction, Message, GroupPost } from '../src/types';
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
} from '../src/data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INITIAL_GROUP_POSTS: Record<string, GroupPost[]> = {};
for (const post of GROUP_POSTS_INITIAL) {
  const gId = (post as any).groupId;
  if (!INITIAL_GROUP_POSTS[gId]) INITIAL_GROUP_POSTS[gId] = [];
  const { groupId, ...rest } = post;
  INITIAL_GROUP_POSTS[gId].push(rest as GroupPost);
}

export interface UserProfile {
  phone: string;
  email: string;
  password: string;
  pin: string;
  balance: number;
  hasReferred: boolean;
  referralCount: number;
  referralEarnings: number;
  contacts: Contact[];
  groups: Group[];
  chats: Chat[];
  stories: Story[];
  channels: Channel[];
  invitations: GroupInvitation[];
  notifications: Notification[];
  transactions: Transaction[];
}

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  tempCodes: Record<string, string>;
  groupPosts: Record<string, GroupPost[]>;
}

const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: {},
    tempCodes: {},
    groupPosts: { ...INITIAL_GROUP_POSTS }
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.groupPosts) {
          this.data.groupPosts = { ...INITIAL_GROUP_POSTS };
          this.save();
        }
      } catch (err) {
        console.error('Failed to parse db.json, resetting database.', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json', err);
    }
  }

  public getOTP(key: string): string | undefined {
    return this.data.tempCodes[key];
  }

  public setOTP(key: string, code: string): void {
    this.data.tempCodes[key] = code;
    this.save();
  }

  public clearOTP(key: string): void {
    delete this.data.tempCodes[key];
    this.save();
  }

  public getUser(phone: string): UserProfile | undefined {
    return this.data.users[phone];
  }

  public getAllUsers(): UserProfile[] {
    return Object.values(this.data.users);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return Object.values(this.data.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByPhoneOrId(phoneOrId: string): UserProfile | undefined {
    if (this.data.users[phoneOrId]) return this.data.users[phoneOrId];
    return Object.values(this.data.users).find(u => u.phone === phoneOrId);
  }

  public createUser(phone: string, email: string, password?: string): UserProfile {
    const defaultProfile: UserProfile = {
      phone,
      email,
      password: password || 'mboaTalkSecure!26',
      pin: '1234',
      balance: 450.00,
      hasReferred: false,
      referralCount: 1,
      referralEarnings: 5.00,
      contacts: INITIAL_CONTACTS.map(c => ({ ...c })),
      groups: INITIAL_GROUPS.map(g => ({ ...g })),
      chats: INITIAL_CHATS.map(c => ({ ...c, messages: c.messages.map(m => ({ ...m })) })),
      stories: INITIAL_STORIES.map(s => ({ ...s })),
      channels: CHANNEL_SUGGESTIONS.map(c => ({ ...c })),
      invitations: INITIAL_INVITATIONS.map(i => ({ ...i })),
      notifications: INITIAL_NOTIFICATIONS.map(n => ({ ...n })),
      transactions: INITIAL_TRANSACTIONS.map(t => ({ ...t }))
    };
    this.data.users[phone] = defaultProfile;
    this.save();
    return defaultProfile;
  }

  public updateUser(phone: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.getUser(phone);
    if (!user) {
      throw new Error(`User with phone ${phone} not found`);
    }

    const updated = {
      ...user,
      ...updates
    };
    this.data.users[phone] = updated;
    this.save();
    return updated;
  }

  public getGroupPosts(groupId: string): GroupPost[] {
    return this.data.groupPosts[groupId] || [];
  }

  public addGroupPost(groupId: string, post: GroupPost): void {
    if (!this.data.groupPosts[groupId]) {
      this.data.groupPosts[groupId] = [];
    }
    this.data.groupPosts[groupId].push(post);
    this.save();
  }

  public updateGroupPost(groupId: string, postId: string, updates: Partial<GroupPost>): void {
    const posts = this.getGroupPosts(groupId);
    const postIdx = posts.findIndex(p => p.id === postId);
    if (postIdx !== -1) {
      posts[postIdx] = { ...posts[postIdx], ...updates };
      this.data.groupPosts[groupId] = posts;
      this.save();
    }
  }
}

export const db = new Database();
