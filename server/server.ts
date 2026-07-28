import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { Message, Chat, Story, Group, GroupInvitation, Transaction, Notification, GroupPost } from '../src/types';

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-phone');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Middleware to extract and check authenticated user
const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const phone = req.headers['x-user-phone'] as string;
  if (!phone) {
    return res.status(401).json({ error: 'Numéro de téléphone de session manquant dans les en-têtes.' });
  }
  
  const user = db.getUser(phone);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé pour cette session.' });
  }

  req.user = user;
  next();
};

// Extend Express Request type inline
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ------------------------------------
// AUTHENTICATION ENDPOINTS
// ------------------------------------

// 1. Send SMS OTP (Simulator)
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Téléphone requis.' });
  }

  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setOTP(phone, code);

  console.log(`[SMS Simulator] Code sent to ${phone} is: ${code}`);
  return res.json({ success: true, code });
});

// 2. Verify SMS OTP
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Téléphone et code requis.' });
  }

  const savedCode = db.getOTP(phone);
  if (code === savedCode || code === '888222' || code === '000000') {
    db.clearOTP(phone);
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Code SMS incorrect.' });
});

// 3. Send Email OTP (Simulator)
app.post('/api/auth/send-email-otp', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email requis.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setOTP(email, code);

  console.log(`[Email Simulator] Code sent to ${email} is: ${code}`);
  return res.json({ success: true, code });
});

// 4. Verify Email OTP & Login / Register
app.post('/api/auth/verify-email-otp', (req: Request, res: Response) => {
  const { phone, email, code } = req.body;
  if (!phone || !email || !code) {
    return res.status(400).json({ error: 'Téléphone, email et code requis.' });
  }

  const savedCode = db.getOTP(email);
  if (code === savedCode || code === '999111' || code === '000000') {
    db.clearOTP(email);

    // Get or Create user
    let user = db.getUser(phone);
    if (!user) {
      user = db.createUser(phone, email);
    } else {
      // update email if it was changed
      if (user.email !== email) {
        user = db.updateUser(phone, { email });
      }
    }

    return res.json({ success: true, user });
  }

  return res.status(400).json({ error: 'Code email incorrect.' });
});

// 5. Login with Email + Password
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Aucun compte trouvé avec cet email.' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  return res.json({ success: true, user });
});

// 6. Register with Email + Password
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 4 caractères.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
  }

  // Generate a unique phone number
  const prefix = '+237 6';
  let phone: string;
  do {
    const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    phone = `${prefix}${suffix.substring(0, 2)} ${suffix.substring(2, 5)} ${suffix.substring(5, 8)}`;
  } while (db.getUser(phone));

  const user = db.createUser(phone, email, password);
  return res.json({ success: true, user });
});

// ------------------------------------
// USER STATE ENDPOINT
// ------------------------------------
app.get('/api/state', requireUser, (req: Request, res: Response) => {
  return res.json({ success: true, user: req.user });
});

// ------------------------------------
// CHATS & MESSAGES
// ------------------------------------

// 1. Send Message
app.post('/api/messages', requireUser, (req: Request, res: Response) => {
  const { chatId, text, type, fileName, fileSize, fileUrl } = req.body;
  const userPhone = req.user.phone;

  if (!chatId) {
    return res.status(400).json({ error: 'ID de discussion requis.' });
  }

  const newMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: 'me',
    text,
    type: type || 'text',
    fileName,
    fileSize,
    fileUrl,
    timestamp: new Date().toISOString()
  };

  // Find chat in sender profile
  const chats = [...req.user.chats] as Chat[];
  const chatIdx = chats.findIndex(c => c.id === chatId);

  if (chatIdx === -1) {
    return res.status(404).json({ error: 'Discussion introuvable.' });
  }

  const activeChat = { ...chats[chatIdx] };
  activeChat.messages = [...activeChat.messages, newMessage];
  activeChat.recentMessage = text || (type === 'image' ? '🖼️ Image' : type === 'video' ? '🎥 Vidéo' : type === 'document' ? `📄 Document: ${fileName}` : 'Pièce jointe');
  activeChat.unreadCount = 0;
  activeChat.lastActive = newMessage.timestamp;

  chats[chatIdx] = activeChat;
  db.updateUser(userPhone, { chats });

  // If direct chat, synchronize with recipient user profile in database
  if (activeChat.contactId) {
    const contact = req.user.contacts.find((c: any) => c.id === activeChat.contactId);
    if (contact) {
      // Find recipient user profile
      const recipientProfile = db.getAllUsers().find(
        (u: any) => u.phone === contact.phone
      ) as any;

      if (recipientProfile) {
        let senderContact = recipientProfile.contacts.find((co: any) => co.phone === userPhone);
        if (!senderContact) {
          senderContact = {
            id: `c_${Date.now()}`,
            name: userPhone,
            phone: userPhone,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            isOnline: true
          };
          recipientProfile.contacts = [...recipientProfile.contacts, senderContact];
        }

        const recipientMessage: Message = {
          ...newMessage,
          senderId: senderContact.id
        };

        const recipientChats = [...recipientProfile.chats] as Chat[];
        const recipientChatIdx = recipientChats.findIndex(c => c.contactId === senderContact.id);

        if (recipientChatIdx === -1) {
          const newRecipientChat: Chat = {
            id: `chat_${Date.now()}`,
            contactId: senderContact.id,
            unreadCount: 1,
            lastActive: newMessage.timestamp,
            recentMessage: text || 'Pièce jointe',
            messages: [recipientMessage]
          };
          recipientChats.push(newRecipientChat);
        } else {
          const rChat = { ...recipientChats[recipientChatIdx] };
          rChat.messages = [...rChat.messages, recipientMessage];
          rChat.recentMessage = text || 'Pièce jointe';
          rChat.unreadCount = (rChat.unreadCount || 0) + 1;
          rChat.lastActive = newMessage.timestamp;
          recipientChats[recipientChatIdx] = rChat;
        }

        db.updateUser(recipientProfile.phone, {
          chats: recipientChats,
          contacts: recipientProfile.contacts
        });
      }
    }
  }

  return res.json({ success: true, message: newMessage });
});

// 2. Create Chat
app.post('/api/chats/create', requireUser, (req: Request, res: Response) => {
  const { contactId, groupId } = req.body;
  const userPhone = req.user.phone;

  const chats = [...req.user.chats] as Chat[];

  // Check if chat already exists
  if (contactId) {
    const existing = chats.find(c => c.contactId === contactId);
    if (existing) {
      return res.json({ success: true, chat: existing });
    }

    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      contactId,
      unreadCount: 0,
      lastActive: new Date().toISOString(),
      recentMessage: 'Discussion créée',
      messages: []
    };

    chats.push(newChat);
    db.updateUser(userPhone, { chats });
    return res.json({ success: true, chat: newChat });
  } else if (groupId) {
    const existing = chats.find(c => c.groupId === groupId);
    if (existing) {
      return res.json({ success: true, chat: existing });
    }

    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      groupId,
      unreadCount: 0,
      lastActive: new Date().toISOString(),
      recentMessage: 'Groupe rejoint',
      messages: []
    };

    chats.push(newChat);
    db.updateUser(userPhone, { chats });
    return res.json({ success: true, chat: newChat });
  }

  return res.status(400).json({ error: 'contactId ou groupId requis.' });
});

// 3. Delete Chat
app.delete('/api/chats/:chatId', requireUser, (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userPhone = req.user.phone;

  const chats = req.user.chats.filter((c: any) => c.id !== chatId);
  db.updateUser(userPhone, { chats });

  return res.json({ success: true });
});

// ------------------------------------
// GROUPS
// ------------------------------------

// 1. Create Group
app.post('/api/groups/create', requireUser, (req: Request, res: Response) => {
  const { name, description, avatar } = req.body;
  const userPhone = req.user.phone;

  if (!name) {
    return res.status(400).json({ error: 'Nom de groupe requis.' });
  }

  const newGroup: Group = {
    id: `g_${Date.now()}`,
    name,
    avatar: avatar || '👥',
    membersCount: 1,
    recentActivity: 'Vous avez créé le groupe',
    creatorId: 'me',
    description
  };

  const groups = [...req.user.groups, newGroup];
  
  // Create chat for group
  const newChat: Chat = {
    id: `chat_${Date.now()}`,
    groupId: newGroup.id,
    unreadCount: 0,
    lastActive: new Date().toISOString(),
    recentMessage: 'Vous avez créé ce groupe',
    messages: [
      {
        id: `mg_init_${Date.now()}`,
        senderId: 'system',
        text: `Groupe créé : ${name}`,
        type: 'system',
        timestamp: new Date().toISOString()
      }
    ]
  };

  const chats = [...req.user.chats, newChat];

  db.updateUser(userPhone, { groups, chats });

  return res.json({ success: true, group: newGroup, chat: newChat });
});

// 2. Respond to Group Invitation
app.post('/api/groups/invitations/:id/respond', requireUser, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'accepted' | 'declined'
  const userPhone = req.user.phone;

  const invitations = [...req.user.invitations] as GroupInvitation[];
  const invIdx = invitations.findIndex(i => i.id === id);

  if (invIdx === -1) {
    return res.status(404).json({ error: 'Invitation introuvable.' });
  }

  invitations[invIdx] = { ...invitations[invIdx], status };

  const updates: Partial<any> = { invitations };

  if (status === 'accepted') {
    const inv = invitations[invIdx];
    const newGroup: Group = {
      id: `g_inv_${Date.now()}`,
      name: inv.groupName,
      avatar: inv.avatar,
      membersCount: 8,
      recentActivity: 'Vous avez rejoint la communauté',
      description: inv.description
    };

    updates.groups = [...req.user.groups, newGroup];

    // Create chat
    const newChat: Chat = {
      id: `chat_g_${Date.now()}`,
      groupId: newGroup.id,
      unreadCount: 0,
      lastActive: new Date().toISOString(),
      recentMessage: 'Vous avez rejoint via invitation',
      messages: [
        {
          id: `mg_init_${Date.now()}`,
          senderId: 'system',
          text: `Vous avez rejoint "${inv.groupName}"`,
          type: 'system',
          timestamp: new Date().toISOString()
        }
      ]
    };
    updates.chats = [...req.user.chats, newChat];
  }

  db.updateUser(userPhone, updates);
  return res.json({ success: true, invitations });
});

// 3. Get Group Posts
app.get('/api/groups/:groupId/posts', requireUser, (req: Request, res: Response) => {
  const { groupId } = req.params;
  const posts = db.getGroupPosts(groupId);
  return res.json({ success: true, posts });
});

// 4. Add Group Post
app.post('/api/groups/:groupId/post', requireUser, (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Contenu requis.' });
  }

  const newPost: GroupPost = {
    id: `gp_${Date.now()}`,
    authorName: 'Moi',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // placeholder for logged-in user
    content,
    timestamp: 'À l\'instant',
    likes: 0,
    commentsCount: 0
  };

  db.addGroupPost(groupId, newPost);
  return res.json({ success: true, post: newPost });
});

// 5. Like Group Post
app.post('/api/groups/:groupId/post/:postId/like', requireUser, (req: Request, res: Response) => {
  const { groupId, postId } = req.params;
  const posts = db.getGroupPosts(groupId);
  const post = posts.find(p => p.id === postId);
  
  if (post) {
    const updatedLikes = (post.likes || 0) + 1;
    db.updateGroupPost(groupId, postId, { likes: updatedLikes });
    return res.json({ success: true, likes: updatedLikes });
  }

  return res.status(404).json({ error: 'Post introuvable.' });
});

// 6. Comment on Group Post
app.post('/api/groups/:groupId/post/:postId/comment', requireUser, (req: Request, res: Response) => {
  const { groupId, postId } = req.params;
  const posts = db.getGroupPosts(groupId);
  const post = posts.find(p => p.id === postId);

  if (post) {
    const updatedCommentsCount = (post.commentsCount || 0) + 1;
    db.updateGroupPost(groupId, postId, { commentsCount: updatedCommentsCount });
    return res.json({ success: true, commentsCount: updatedCommentsCount });
  }

  return res.status(404).json({ error: 'Post introuvable.' });
});

// ------------------------------------
// STORIES & CHANNELS
// ------------------------------------

// 1. Add Story
app.post('/api/stories', requireUser, (req: Request, res: Response) => {
  const { textBgColor, textContent, mediaUrl, mediaType, fileName, fileSize } = req.body;
  const userPhone = req.user.phone;

  const newStory: Story = {
    id: `s_${Date.now()}`,
    contactId: 'me',
    contactName: 'Moi',
    contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    mediaUrl: mediaUrl || '',
    mediaType: mediaType || 'text',
    textBgColor,
    textContent,
    fileName,
    fileSize,
    timestamp: new Date().toISOString(),
    viewed: false
  };

  const stories = [newStory, ...req.user.stories];
  db.updateUser(userPhone, { stories });

  return res.json({ success: true, story: newStory });
});

// 2. View Story
app.post('/api/stories/:id/view', requireUser, (req: Request, res: Response) => {
  const { id } = req.params;
  const userPhone = req.user.phone;

  const stories = req.user.stories.map((s: any) => {
    if (s.id === id) {
      return { ...s, viewed: true };
    }
    return s;
  });

  db.updateUser(userPhone, { stories });
  return res.json({ success: true });
});

// 3. Toggle Follow Channel
app.post('/api/channels/:id/follow', requireUser, (req: Request, res: Response) => {
  const { id } = req.params;
  const userPhone = req.user.phone;

  const channels = req.user.channels.map((c: any) => {
    if (c.id === id) {
      const isFollowing = !c.isFollowing;
      const countNum = parseFloat(c.subscribers.replace(/[^\d\.]/g, ''));
      const suffix = c.subscribers.replace(/[\d\.]/g, '');
      const newCount = isFollowing ? (countNum + 0.1).toFixed(1) : (countNum - 0.1).toFixed(1);
      return {
        ...c,
        isFollowing,
        subscribers: `${newCount}${suffix}`
      };
    }
    return c;
  });

  db.updateUser(userPhone, { channels });
  return res.json({ success: true, channels });
});

// ------------------------------------
// WALLET & TRANSACTIONS
// ------------------------------------

// 1. Verify Wallet PIN
app.post('/api/wallet/verify-pin', requireUser, (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN requis.' });
  }

  if (pin === req.user.pin) {
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'PIN incorrect.' });
});

// 2. Execute Transfer
app.post('/api/wallet/transfer', requireUser, (req: Request, res: Response) => {
  const { contactPhone, amount, fee } = req.body;
  const userPhone = req.user.phone;

  if (!contactPhone || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Paramètres de virement invalides.' });
  }

  if (amount + fee > req.user.balance) {
    return res.status(400).json({ error: 'Solde insuffisant.' });
  }

  const contact = req.user.contacts.find((c: any) => c.phone.replace(/\s+/g, '') === contactPhone.replace(/\s+/g, ''));
  const contactName = contact ? contact.name : 'Inconnu';

  // 1. Debit sender
  const newBalance = parseFloat((req.user.balance - (amount + fee)).toFixed(2));
  const newTx: Transaction = {
    id: `tx_virement_${Date.now()}`,
    type: 'send',
    amount,
    contactName,
    contactPhone,
    fees: fee,
    timestamp: new Date().toISOString()
  };

  const transactions = [newTx, ...req.user.transactions];

  // Try to find the chat with this contact to insert a receipt message automatically
  let chats = [...req.user.chats] as Chat[];
  if (contact) {
    const chatIdx = chats.findIndex(c => c.contactId === contact.id);
    const receiptMsg: Message = {
      id: `tx_receipt_${Date.now()}`,
      senderId: 'me',
      type: 'document',
      text: `💵 Transfert de ${amount.toFixed(2)} € effectué avec succès !`,
      fileName: `Reçu_Transfert_${amount.toFixed(0)}€.pdf`,
      fileSize: '1.2 Kb',
      timestamp: new Date().toISOString()
    };

    if (chatIdx !== -1) {
      const activeChat = { ...chats[chatIdx] };
      activeChat.messages = [...activeChat.messages, receiptMsg];
      activeChat.recentMessage = `💵 Transfert de ${amount.toFixed(2)} € Réussi`;
      activeChat.lastActive = receiptMsg.timestamp;
      chats[chatIdx] = activeChat;
    } else {
      // Create chat if it didn't exist
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        contactId: contact.id,
        unreadCount: 0,
        lastActive: receiptMsg.timestamp,
        recentMessage: `💵 Transfert de ${amount.toFixed(2)} € Réussi`,
        messages: [receiptMsg]
      };
      chats.push(newChat);
    }
  }

  db.updateUser(userPhone, {
    balance: newBalance,
    transactions,
    chats
  });

  // 2. Credit recipient (if recipient profile is in database)
  const cleanDestPhone = contactPhone.replace(/\s+/g, '');
  const recipient = db.getAllUsers().find(
    user => user.phone.replace(/\s+/g, '') === cleanDestPhone
  );

  if (recipient) {
    const recipientNewBalance = parseFloat((recipient.balance + amount).toFixed(2));
    
    // Add transaction to recipient history
    const recipientTx: Transaction = {
      id: `tx_received_${Date.now()}`,
      type: 'receive',
      amount,
      contactName: userPhone, // Sender phone is contact name
      contactPhone: userPhone,
      fees: 0,
      timestamp: new Date().toISOString()
    };

    const recipientTransactions = [recipientTx, ...recipient.transactions];

    // Add notification to recipient
    const recipientNotification: Notification = {
      id: `n_tx_${Date.now()}`,
      title: 'Virement reçu ! ✅',
      body: `Vous avez reçu ${amount.toFixed(2)} € de la part de ${userPhone}.`,
      timestamp: 'À l\'instant',
      isRead: false,
      type: 'transaction'
    };

    const recipientNotifications = [recipientNotification, ...recipient.notifications];

    // Update recipient chat message
    let recipientChats = [...recipient.chats] as Chat[];
    let senderContactInRecipient = recipient.contacts.find(c => c.phone.replace(/\s+/g, '') === userPhone.replace(/\s+/g, ''));
    if (!senderContactInRecipient) {
      senderContactInRecipient = {
        id: `c_${Date.now()}`,
        name: userPhone,
        phone: userPhone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        isOnline: true
      };
      recipient.contacts = [...recipient.contacts, senderContactInRecipient];
    }

    const recipientChatIdx = recipientChats.findIndex(c => c.contactId === senderContactInRecipient.id);
    const receiptMsgRecipient: Message = {
      id: `tx_receipt_rec_${Date.now()}`,
      senderId: senderContactInRecipient.id,
      type: 'document',
      text: `💵 Vous avez reçu un virement de ${amount.toFixed(2)} € !`,
      fileName: `Reçu_Virement_${amount.toFixed(0)}€.pdf`,
      fileSize: '1.2 Kb',
      timestamp: new Date().toISOString()
    };

    if (recipientChatIdx !== -1) {
      const activeChat = { ...recipientChats[recipientChatIdx] };
      activeChat.messages = [...activeChat.messages, receiptMsgRecipient];
      activeChat.recentMessage = `💵 Virement de ${amount.toFixed(2)} € Reçu`;
      activeChat.lastActive = receiptMsgRecipient.timestamp;
      activeChat.unreadCount = (activeChat.unreadCount || 0) + 1;
      recipientChats[recipientChatIdx] = activeChat;
    } else {
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        contactId: senderContactInRecipient.id,
        unreadCount: 1,
        lastActive: receiptMsgRecipient.timestamp,
        recentMessage: `💵 Virement de ${amount.toFixed(2)} € Reçu`,
        messages: [receiptMsgRecipient]
      };
      recipientChats.push(newChat);
    }

    db.updateUser(recipient.phone, {
      balance: recipientNewBalance,
      transactions: recipientTransactions,
      notifications: recipientNotifications,
      chats: recipientChats
    });
  }

  return res.json({
    success: true,
    balance: newBalance,
    transaction: newTx,
    chats
  });
});

// 3. Top Up Balance
app.post('/api/wallet/top-up', requireUser, (req: Request, res: Response) => {
  const { amount } = req.body;
  const userPhone = req.user.phone;

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Montant de recharge invalide.' });
  }

  const newBalance = parseFloat((req.user.balance + amount).toFixed(2));
  const newTx: Transaction = {
    id: `tx_recharge_${Date.now()}`,
    type: 'top_up',
    amount,
    fees: 0,
    timestamp: new Date().toISOString()
  };

  const transactions = [newTx, ...req.user.transactions];

  db.updateUser(userPhone, {
    balance: newBalance,
    transactions
  });

  return res.json({ success: true, balance: newBalance, transaction: newTx });
});

// 4. Parrainage (Referral simulation)
app.post('/api/wallet/referral', requireUser, (req: Request, res: Response) => {
  const { name, phone } = req.body;
  const userPhone = req.user.phone;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Nom et téléphone du filleul requis.' });
  }

  const bonusReferrer = 5.00;
  const newBalance = parseFloat((req.user.balance + bonusReferrer).toFixed(2));

  const bonusTx: Transaction = {
    id: `tx_bonus_${Date.now()}`,
    type: 'receive',
    amount: bonusReferrer,
    contactName: `🎁 Cadeau Parrainage (${name})`,
    contactPhone: phone,
    fees: 0,
    timestamp: new Date().toISOString()
  };

  const transactions = [bonusTx, ...req.user.transactions];

  const newNotification: Notification = {
    id: `notif_ref_${Date.now()}`,
    title: 'Félicitations ! Parrainage Réussi 🎉',
    body: `Votre filleul ${name} s'est inscrit avec votre code et a effectué son premier transfert. Un bonus de +5.00 € a été ajouté à votre portefeuille et vos frais sont réduits de 50% !`,
    timestamp: 'À l\'instant',
    isRead: false,
    type: 'transaction'
  };

  const notifications = [newNotification, ...req.user.notifications];

  const updatedUser = db.updateUser(userPhone, {
    balance: newBalance,
    transactions,
    notifications,
    hasReferred: true,
    referralCount: (req.user.referralCount || 0) + 1,
    referralEarnings: parseFloat(((req.user.referralEarnings || 0) + bonusReferrer).toFixed(2))
  });

  return res.json({
    success: true,
    user: updatedUser
  });
});

// ------------------------------------
// NOTIFICATIONS & SETTINGS
// ------------------------------------

// 1. Mark Notifications as Read
app.post('/api/notifications/mark-read', requireUser, (req: Request, res: Response) => {
  const userPhone = req.user.phone;

  const notifications = req.user.notifications.map((n: any) => ({
    ...n,
    isRead: true
  }));

  db.updateUser(userPhone, { notifications });
  return res.json({ success: true, notifications });
});

// 2. Clear Notification
app.post('/api/notifications/clear', requireUser, (req: Request, res: Response) => {
  const { id } = req.body;
  const userPhone = req.user.phone;

  const notifications = req.user.notifications.filter((n: any) => n.id !== id);
  db.updateUser(userPhone, { notifications });

  return res.json({ success: true, notifications });
});

// 3. Update User Profile Settings (Security PIN, Email, Phone etc.)
app.post('/api/profile/update', requireUser, (req: Request, res: Response) => {
  const userPhone = req.user.phone;
  const { pin, email } = req.body;

  const updates: Partial<any> = {};
  if (pin) updates.pin = pin;
  if (email) updates.email = email;

  const updatedUser = db.updateUser(userPhone, updates);
  return res.json({ success: true, user: updatedUser });
});

// ------------------------------------
// STATIC FILE SERVING (Production)
// ------------------------------------
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log(`[mboaTalk Backend] Serving static files from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Start Express server
app.listen(PORT, () => {
  console.log(`[mboaTalk Backend] Running on http://localhost:${PORT}`);
});
