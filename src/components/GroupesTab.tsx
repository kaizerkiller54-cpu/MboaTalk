import React, { useState, useEffect } from 'react';
import { Users, MailOpen, Compass, Bell, BellOff, Volume2, Plus, MessageSquare, Heart, Video, Phone, Lock, ShieldCheck, Edit3, Settings, Check } from 'lucide-react';
import { Group, GroupInvitation, Notification, GroupPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../i18n/LanguageContext';

interface GroupesTabProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  invitations: GroupInvitation[];
  setInvitations: React.Dispatch<React.SetStateAction<GroupInvitation[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onStartGroupCall: (groupName: string, type: 'audio' | 'video') => void;
  isMobile?: boolean;
}

export default function GroupesTab({ groups, setGroups, invitations, setInvitations, notifications, setNotifications, onStartGroupCall, isMobile = false }: GroupesTabProps) {
  const { t } = useLang();
  const [activeGroupFeedTab, setActiveGroupFeedTab] = useState<'posts' | 'invitations' | 'notifications'>('posts');
  
  // Local state for dynamic posts
  const [posts, setPosts] = useState<GroupPost[]>([
    {
      id: 'gp1',
      authorName: 'Alice Dubois',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      content: 'Hello l\'équipe ! Avez-vous vu que Pay&Chat permet de faire des transferts quasi gratuits ? 💼 Seulement 0,1% de frais, ça va changer nos cagnottes de groupe ! 🎉',
      timestamp: 'Il y a 20 min',
      likes: 4,
      commentsCount: 2
    },
    {
      id: 'gp2',
      authorName: 'Marc Dupont',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      content: 'Je viens de mettre à jour le document de budget de l\'association. À consulter d\'ici ce soir ! Pour info, j\'ai réglé la facture de l\'imprimeur via l\'onglet portefeuille biométrique.',
      timestamp: 'Il y a 2 heures',
      likes: 9,
      commentsCount: 5
    }
  ]);

  const [newPostText, setNewPostText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.id || 'g1');

  // Create Group Form states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupAvatar, setNewGroupAvatar] = useState('👥');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Selected Group details & Edit state
  const activeSelectedGroup = groups.find(g => g.id === selectedGroup);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Sync edits when active selected group changes
  useEffect(() => {
    if (activeSelectedGroup) {
      setEditName(activeSelectedGroup.name);
      setEditAvatar(activeSelectedGroup.avatar);
      setEditDesc(activeSelectedGroup.description || '');
      setIsSavedNotice(false);
    }
  }, [selectedGroup, activeSelectedGroup]);

  // Load posts from backend when selected group changes
  useEffect(() => {
    if (!selectedGroup) return;
    api.getGroupPosts(selectedGroup)
      .then(res => {
        if (res.success && res.posts && res.posts.length > 0) {
          setPosts(res.posts);
        }
      })
      .catch(err => {
        console.error('[GroupesTab] Erreur chargement posts du groupe:', err);
      });
  }, [selectedGroup]);

  const getCreatorName = (creatorId?: string) => {
    if (!creatorId) return "Inconnu";
    if (creatorId === 'me') return "Moi (Alex Mercer)";
    if (creatorId === '1') return "Alice Dubois";
    if (creatorId === '2') return "Jean-Luc Simon";
    if (creatorId === '3') return "Sophie Martin";
    if (creatorId === '4') return "Marc Dupont";
    if (creatorId === '5') return "Clara Bernard";
    return "Administrateur externe";
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // Optimistic UI update
    const tempId = `g_gen_${Date.now()}`;
    const newGroup: Group = {
      id: tempId,
      name: newGroupName,
      avatar: newGroupAvatar,
      membersCount: 1,
      recentActivity: "Vous avez créé le groupe",
      creatorId: 'me',
      description: newGroupDescription || 'Pas de description définie'
    };

    setGroups(prev => [...prev, newGroup]);
    setSelectedGroup(tempId);
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupAvatar('👥');
    setNewGroupDescription('');

    // Trigger notification
    const newNotif: Notification = {
      id: `notif_autogen_${Date.now()}`,
      title: 'Groupe créé avec succès ! 👥',
      body: `Le groupe "${newGroupName}" a été initialisé. Vous en êtes l'administrateur exclusif.`,
      timestamp: 'A l\'instant',
      isRead: false,
      type: 'group'
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Persist to backend
    try {
      const res = await api.createGroup({
        name: newGroupName,
        description: newGroupDescription || undefined,
        avatar: newGroupAvatar
      });

      if (res.success && res.group) {
        // Replace optimistic group with confirmed server group
        setGroups(prev => [res.group, ...prev.filter(g => g.id !== tempId)]);
        setSelectedGroup(res.group.id);
      }
    } catch (err) {
      console.error('[GroupesTab] Erreur création groupe:', err);
      // Optimistic entry stays in place
    }
  };

  const handleUpdateGroupParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedGroup || activeSelectedGroup.creatorId !== 'me') return;

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroup) {
        return {
          ...g,
          name: editName,
          avatar: editAvatar,
          description: editDesc,
          recentActivity: "Param\u00e8tres modifi\u00e9s"
        };
      }
      return g;
    }));

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };


  // Handle invitations
  const handleInvitationAction = async (id: string, action: 'accepted' | 'declined') => {
    // Optimistic update
    setInvitations(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status: action } : inv
    ));

    // Add notification if accepted (optimistic)
    if (action === 'accepted') {
      const parentInv = invitations.find(i => i.id === id);
      if (parentInv) {
        const newNotif: Notification = {
          id: `notif_autogen_${Date.now()}`,
          title: 'Bienvenue dans le groupe ! 🎉',
          body: `Vous avez rejoint la communauté "${parentInv.groupName}" avec succès.`,
          timestamp: 'A l\'instant',
          isRead: false,
          type: 'group'
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }

    // Sync with backend
    try {
      const res = await api.respondToInvitation(id, action);
      if (res.success && res.invitations) {
        setInvitations(res.invitations);
      }
    } catch (err) {
      console.error('[GroupesTab] Erreur réponse invitation:', err);
      // Revert on error
      setInvitations(prev => prev.map(inv =>
        inv.id === id ? { ...inv, status: 'pending' as const } : inv
      ));
    }
  };

  // Toggle read status of a notification
  const toggleNotificationRead = async (notifId: string) => {
    // Optimistic toggle
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, isRead: !n.isRead } : n
    ));

    // Mark as read on backend if transitioning to read
    try {
      await api.markNotificationsRead();
    } catch (err) {
      console.error('[GroupesTab] Erreur marquage notif lue:', err);
    }
  };

  // Mark all as read
  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.markNotificationsRead();
    } catch (err) {
      console.error('[GroupesTab] Erreur marquer tout lu:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    // Optimistic post
    const optimisticPost: GroupPost = {
      id: `post_gen_${Date.now()}`,
      authorName: 'Moi',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      content: newPostText,
      timestamp: 'A l\'instant',
      likes: 0,
      commentsCount: 0
    };

    setPosts(prev => [optimisticPost, ...prev]);
    setNewPostText('');

    // Persist to backend
    try {
      const res = await api.addGroupPost(selectedGroup, newPostText);
      if (res.success && res.post) {
        setPosts(prev => [res.post, ...prev.filter(p => p.id !== optimisticPost.id)]);
      }
    } catch (err) {
      console.error('[GroupesTab] Erreur ajout post:', err);
    }
  };

  const toggleLikePost = async (postId: string) => {
    // Optimistic like
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));

    try {
      const res = await api.likeGroupPost(selectedGroup, postId);
      if (res.success && res.likes !== undefined) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, likes: res.likes } : p
        ));
      }
    } catch (err) {
      console.error('[GroupesTab] Erreur like post:', err);
      // Revert optimistic like on error
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p
      ));
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 font-sans max-w-7xl mx-auto">
      
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-12 gap-6'} items-start`}>
        {/* Left Column: Groups list and parameters settings */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-6 xl:col-span-5'}`}>
          
          {/* Active groups and audio/video call launchers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">{t('groups_title')}</h2>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="flex items-center gap-1 text-[10px] font-extrabold bg-rose-600/15 hover:bg-rose-600 text-rose-455 hover:text-white px-2.5 py-1.5 rounded-xl transition border border-rose-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('groups_create')}
          </button>
        </div>

        {/* CREATE GROUP FORM INLINE */}
        <AnimatePresence>
          {showCreateGroup && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateGroup}
              className="mb-4 p-4 bg-slate-950/65 rounded-xl border border-rose-500/25 space-y-3.5 overflow-hidden text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {t('groups_new')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{t('groups_name')}</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="ex: Co-auteurs ☕️"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 text-left h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{t('groups_avatar')}</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newGroupAvatar}
                    onChange={(e) => setNewGroupAvatar(e.target.value)}
                    placeholder="👥"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-white focus:outline-none focus:border-rose-500/50 h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400">{t('groups_desc')}</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder={t('groups_desc_placeholder')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 h-14 text-left resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] uppercase font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase rounded-lg transition"
                >
                  {t('groups_create_btn')}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 gap-3">
          {groups.map((group) => (
            <div 
              key={group.id} 
              onClick={() => setSelectedGroup(group.id)}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedGroup === group.id 
                  ? 'bg-rose-600/10 border-rose-500/40 shadow-inner' 
                  : 'bg-slate-950/40 border-slate-800 hover:bg-slate-950/80 hover:border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                  {group.avatar}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-200">{group.name}</h3>
                    {group.creatorId === 'me' && (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded uppercase font-extrabold tracking-wider">{t('groups_my_group')}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{group.membersCount} {t('groups_members')} • {group.recentActivity}</p>
                </div>
              </div>

              {/* Action buttons to launch Group Calls instantly */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onStartGroupCall(group.name, 'audio')}
                  title="Lancer un appel audio de groupe"
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onStartGroupCall(group.name, 'video')}
                  title="Lancer un appel vidéo de groupe"
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* GROUP PARAMETERS PANEL (DEDICATED VISUAL WORKSPACE) */}
        {activeSelectedGroup && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
                ⚙️ {t('groups_settings')}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-mono">{t('groups_admin')}</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
                  {activeSelectedGroup.creatorId === 'me' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                  )}
                  {getCreatorName(activeSelectedGroup.creatorId)}
                </span>
              </div>
            </div>

            {activeSelectedGroup.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="font-extrabold text-[9px] uppercase text-slate-500 block mb-0.5">Description et directives :</span>
                {activeSelectedGroup.description}
              </p>
            )}

            {/* If current user is administrator ('me'), show parameters customization */}
            {activeSelectedGroup.creatorId === 'me' ? (
              <form onSubmit={handleUpdateGroupParams} className="bg-slate-950/45 p-3 rounded-xl border border-slate-850 space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Autorisations de modification accordées (Administrateur)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-0.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Nom du groupe</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-rose-500/50 text-left h-7.5"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Emoji / Icône</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none focus:border-rose-500/50 h-7.5"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Modifier la description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-rose-500/50 h-12 text-left resize-none leading-normal"
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div>
                    {isSavedNotice && (
                      <span className="text-emerald-400 text-[10px] font-bold animate-pulse flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Paramètres du groupe enregistrés ! 🔐
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-505 text-white font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    {t('groups_save')}
                  </button>
                </div>
              </form>
            ) : (
              /* If NOT the administrator, deny editing visually and explain exactly why */
              <div className="bg-slate-950/50 p-3.5 rounded-xl border border-rose-950/20 space-y-2 text-slate-450">
                <div className="flex items-center gap-2 text-rose-450">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Modifications désactivées</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Seul l'administrateur de ce groupe (<span className="text-emerald-400 font-extrabold">{getCreatorName(activeSelectedGroup.creatorId)}</span>) peut modifier les paramètres du groupe (nom, avatar ou directives).
                </p>
                <div className="pt-1 flex justify-end">
                  <div className="px-2 py-0.5 bg-slate-900 text-slate-500 text-[8px] uppercase font-extrabold rounded border border-slate-800 inline-flex items-center gap-1 select-none font-mono">
                    <Lock className="w-2 h-2" />
                    {t('groups_readonly')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        </div>

        {/* Right Column: Group Feed (Posts, Invitations, Notifications) */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-6 xl:col-span-7'} bg-slate-900/40 border border-slate-800 p-4 rounded-2xl`}>

          {/* Sub Tabs controller */}
      <div className="flex border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveGroupFeedTab('posts')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
            activeGroupFeedTab === 'posts' 
              ? 'border-rose-500 text-rose-450 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('groups_posts')} ({posts.length})
        </button>
        <button
          onClick={() => setActiveGroupFeedTab('invitations')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all relative ${
            activeGroupFeedTab === 'invitations' 
              ? 'border-rose-500 text-rose-450 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('groups_invitations')} ({invitations.filter(i => i.status === 'pending').length})
          {invitations.some(i => i.status === 'pending') && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveGroupFeedTab('notifications')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all relative ${
            activeGroupFeedTab === 'notifications' 
              ? 'border-rose-500 text-rose-450 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('groups_notifications')} ({notifications.filter(n => !n.isRead).length})
          {notifications.some(n => !n.isRead) && (
            <span className="absolute top-2 right-4 w-4 h-4 bg-rose-500 text-[9px] text-white font-bold rounded-full flex items-center justify-center animate-pulse">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </button>
      </div>

      {/* Conditional Subtab contents */}
      <AnimatePresence mode="wait">
        {activeGroupFeedTab === 'posts' && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Create publication form */}
            <form onSubmit={handleCreatePost} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex gap-3 items-end">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" 
                alt="Me avatar" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={`Publier quelque chose dans ${groups.find(g => g.id === selectedGroup)?.name || 'le groupe'}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none h-18 text-left"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newPostText.trim()}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('groups_publish')}
                  </button>
                </div>
              </div>
            </form>

            {/* List of published conversations */}
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={post.authorAvatar} 
                        alt={post.authorName} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-800"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{post.authorName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{post.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed text-left">{post.content}</p>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <button 
                      onClick={() => toggleLikePost(post.id)}
                      className="flex items-center gap-1 hover:text-rose-400 transition"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                      <span>{post.likes} {t('groups_like')}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>{post.commentsCount} {t('groups_comments')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeGroupFeedTab === 'invitations' && (
          <motion.div
            key="invitations"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {invitations.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Aucune invitation reçue</p>
            ) : (
              invitations.map((inv) => (
                <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xl border border-slate-700">
                      {inv.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{inv.groupName}</h4>
                      <p className="text-[10px] text-slate-400">Invité par: <span className="text-emerald-400">{inv.inviterName}</span></p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{inv.description}</p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    {inv.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleInvitationAction(inv.id, 'declined')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-red-400 border border-slate-700/50 cursor-pointer"
                        >
                          {t('groups_decline')}
                        </button>
                        <button
                          onClick={() => handleInvitationAction(inv.id, 'accepted')}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                        >
                          {t('groups_accept')}
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        inv.status === 'accepted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                      }`}>
                        {inv.status === 'accepted' ? 'Invitation acceptée ✅' : 'Invitation déclinée ✕'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeGroupFeedTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Cliquer sur une notification pour la marquer lue / non lue :</span>
              {notifications.some(n => !n.isRead) && (
                <button 
                  onClick={markAllNotificationsRead}
                  className="text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  {t('groups_all_read')}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => toggleNotificationRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                    notif.isRead 
                      ? 'bg-slate-950/20 border-slate-900 opacity-60 hover:opacity-100' 
                      : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Status indicator pill */}
                  {!notif.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 shadow shadow-rose-500" />
                  )}

                  <div className="flex items-start gap-3 pr-4">
                    <span className="text-lg mt-0.5">
                      {notif.type === 'group' ? '👥' : notif.type === 'transaction' ? '💰' : '🚨'}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200">
                        {notif.title}
                        {!notif.isRead && (
                          <span className="ml-2 inline-block px-1.5 py-0.2 bg-rose-500/10 border border-rose-500/20 text-[8px] font-mono font-bold text-rose-400 rounded-sm">
                            NEW
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-300 leading-snug">{notif.body}</p>
                      <span className="text-[10px] text-slate-500 font-mono inline-block pt-1">{notif.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
