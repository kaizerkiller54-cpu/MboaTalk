import { Contact, Story, Channel, Group, GroupInvitation, Notification, Chat, Transaction } from './types';

export const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Alice Dubois', phone: '+33 6 12 34 56 78', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', statusText: 'En réunion 💼', isOnline: true },
  { id: '2', name: 'Jean-Luc Simon', phone: '+33 6 23 45 67 89', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', statusText: 'Disponible pour un appel 📞', isOnline: false },
  { id: '3', name: 'Sophie Martin', phone: '+33 6 34 56 78 90', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', statusText: 'Seulement appels urgents 🚨', isOnline: true },
  { id: '4', name: 'Marc Dupont', phone: '+33 6 45 67 89 01', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', statusText: 'Au sport 🏋️‍♂️', isOnline: true },
  { id: '5', name: 'Clara Bernard', phone: '+33 6 56 78 90 12', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', statusText: 'Voyage à Rome 🍕🇮🇹', isOnline: false }
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 's1',
    contactId: '1',
    contactName: 'Alice Dubois',
    contactAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    mediaUrl: '',
    mediaType: 'text',
    textBgColor: 'from-purple-600 to-indigo-600',
    textContent: 'Super weekend en Bretagne ! 🌊⛵️',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    viewed: false
  },
  {
    id: 's2',
    contactId: '3',
    contactName: 'Sophie Martin',
    contactAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400',
    mediaType: 'image',
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    viewed: false
  },
  {
    id: 's3',
    contactId: '4',
    contactName: 'Marc Dupont',
    contactAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    mediaUrl: '',
    mediaType: 'text',
    textBgColor: 'from-orange-500 to-red-600',
    textContent: 'Objectif semi-marathon ! 🏃‍♂️🔥',
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    viewed: false
  }
];

export const CHANNEL_SUGGESTIONS: Channel[] = [
  { id: 'c1', name: 'Actualités Tech', avatar: '💻', subscribers: '45.2K', category: 'Technologie', isFollowing: false, creatorId: 'me', description: "Dernières actualités de l'écosystème web, mobile et IA chiffrées." },
  { id: 'c2', name: 'Bons Plans Voyage', avatar: '✈️', subscribers: '128.5K', category: 'Loisirs', isFollowing: true, creatorId: '2', description: "Partages d'astuces pour voyager sans se ruiner, billets discounts." },
  { id: 'c3', name: 'Finance Pratique', avatar: '📈', subscribers: '82.1K', category: 'Finances', isFollowing: false, creatorId: 'me', description: "Conseils pour mieux gérer son portefeuille d'épargne d'investissement." },
  { id: 'c4', name: 'Recettes Rapides', avatar: '🍳', subscribers: '210.4K', category: 'Cuisine', isFollowing: false, creatorId: '3', description: "Petits plats en moins de 15 minutes, sains et économiques !" }
];

export const INITIAL_GROUPS: Group[] = [
  { id: 'g1', name: 'Famille Dubois', avatar: '🏡', membersCount: 6, recentActivity: 'Alice a partagé une photo', creatorId: '1', description: "Groupe privé de la famille Dubois pour planifier nos sorties et repas de fêtes de famille." },
  { id: 'g2', name: 'Projet Startup 🚀', avatar: '💼', membersCount: 12, recentActivity: 'Marc a envoyé un document', creatorId: 'me', description: "Espace de coordination de notre startup. Veuillez chiffrer vos budgets ici." },
  { id: 'g3', name: 'Club de Lecture', avatar: '📚', membersCount: 15, recentActivity: 'Sophie a proposé un livre', creatorId: '3', description: "Partage de suggestions de lecture mensuelles et débats littéraires autour du café." }
];

export const GROUP_POSTS_INITIAL = [
  {
    id: 'gp1',
    groupId: 'g1',
    authorName: 'Alice Dubois',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'Pensez-vous qu on devrait se retrouver pour fêter l anniversaire de grand-père dimanche prochain ? 🎉🎂',
    timestamp: 'Il y a 30 min',
    likes: 4,
    commentsCount: 2
  },
  {
    id: 'gp2',
    groupId: 'g2',
    authorName: 'Marc Dupont',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    content: 'J ai déposé la charte budgétaire révisée dans nos discussions. Les frais de transfert de l appli sont excellents, ça nous fait économiser pour les virements internationaux ! 💼📊',
    timestamp: 'Il y a 1 heure',
    likes: 5,
    commentsCount: 3
  }
];

export const INITIAL_INVITATIONS: GroupInvitation[] = [
  {
    id: 'inv1',
    groupName: 'Amis Vélo Randonnée 🚴‍♂️',
    description: 'Une communauté de passionnés de vélo pour organiser nos prochaines sorties de weekend.',
    inviterName: 'Sophie Martin',
    avatar: '🚴‍♂️',
    status: 'pending'
  },
  {
    id: 'inv2',
    groupName: 'Design Critique Europe 🎨',
    description: 'Pour échanger des retours constructifs sur le UI/UX de nos applications.',
    inviterName: 'Jean-Luc Simon',
    avatar: '🎨',
    status: 'pending'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Invitation de communauté', body: 'Sophie Martin vous a invité à rejoindre "Amis Vélo Randonnée".', timestamp: 'Il y a 10 minutes', isRead: false, type: 'group' },
  { id: 'n2', title: 'Virement reçu ! ✅', body: 'Vous avez reçu 35.00 € de la part de Clara Bernard.', timestamp: 'Il y a 2 heures', isRead: false, type: 'transaction' },
  { id: 'n3', title: 'Nouvelle publication', body: 'Alice Dubois a posté dans le groupe "Famille Dubois".', timestamp: 'Il y a 30 minutes', isRead: true, type: 'group' },
  { id: 'n4', title: 'Alerte sécurité', body: 'Votre authentification FaceID/Biométrique a été configurée avec succès.', timestamp: 'Hier', isRead: true, type: 'security' }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_1',
    contactId: '1',
    unreadCount: 2,
    lastActive: new Date(Date.now() - 5 * 60000).toISOString(),
    messages: [
      { id: 'm1_1', senderId: '1', text: 'Salut ! Peux-tu m envoyer les détails pour le transfert ?', type: 'text', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'm1_2', senderId: 'me', text: 'Oui, bien sûr, je m en occupe tout de suite.', type: 'text', timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString() },
      { id: 'm1_3', senderId: '1', text: 'Super, j attends ton envoi ! 👍', type: 'text', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 'm1_4', senderId: '1', text: 'Je viens de voir que les frais ne sont que de 0.1 %, c est vraiment génial.', type: 'text', timestamp: new Date(Date.now() - 5 * 60000).toISOString() }
    ]
  },
  {
    id: 'chat_2',
    contactId: '2',
    unreadCount: 0,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { id: 'm2_1', senderId: 'me', text: 'Est-ce qu on fait un appel vocal ce soir ?', type: 'text', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 'm2_2', senderId: '2', text: 'D accord, disons 20h ! On testera la nouvelle fonction d audio HD.', type: 'text', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
    ]
  },
  {
    id: 'chat_3',
    contactId: '3',
    unreadCount: 0,
    lastActive: new Date(Date.now() - 10 * 3600000).toISOString(),
    messages: [
      { id: 'm3_1', senderId: '3', text: 'Reçu le virement, merci infiniment !', type: 'text', timestamp: new Date(Date.now() - 11 * 3600000).toISOString() }
    ]
  },
  {
    id: 'chat_g1',
    groupId: 'g1',
    unreadCount: 1,
    lastActive: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      { id: 'mg1_1', senderId: '2', text: 'Bonjour tout le monde !', type: 'text', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 'mg1_2', senderId: '1', text: 'Hey ! N oubliez pas de voter pour dimanche ! 🥳', type: 'text', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'receive', amount: 35.00, contactName: 'Clara Bernard', contactPhone: '+33 6 56 78 90 12', fees: 0, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 't2', type: 'send', amount: 15.0, contactName: 'Sophie Martin', contactPhone: '+33 6 34 56 78 90', fees: 0.02, timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 't3', type: 'top_up', amount: 200.0, fees: 0, timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: 't4', type: 'send', amount: 120.0, contactName: 'Alice Dubois', contactPhone: '+33 6 12 34 56 78', fees: 0.12, timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() }
];
