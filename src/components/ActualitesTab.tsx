import React, { useState } from 'react';
import { Camera, Plus, Check, ArrowRight, Rss, Layers, Share2, Award, Calendar, Repeat, Image, Film, FileText, Smile, Upload, FileUp, Lock, ShieldCheck } from 'lucide-react';
import { Story, Channel, Contact } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../i18n/LanguageContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Channel = Channel;

interface ActualitesTabProps {
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  contacts: Contact[];
  isMobile?: boolean;
}

export default function ActualitesTab({ stories, setStories, channels, setChannels, contacts, isMobile = false }: ActualitesTabProps) {
  const { t } = useLang();
  // Post story state
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('from-emerald-600 via-yellow-500 to-red-650');
  
  // New media states
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video' | 'gif' | 'document'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Selected viewed story state
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  // Selected channel parameters & setup states
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || 'c1');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const [newChanAvatar, setNewChanAvatar] = useState('📡');
  const [newChanCategory, setNewChanCategory] = useState('Technologie');
  const [newChanDesc, setNewChanDesc] = useState('');

  // Editing state for selected channel properties
  const activeSelectedChannel = channels.find(c => c.id === selectedChannelId);
  const [editChanName, setEditChanName] = useState('');
  const [editChanAvatar, setEditChanAvatar] = useState('');
  const [editChanCategory, setEditChanCategory] = useState('');
  const [editChanDesc, setEditChanDesc] = useState('');
  const [isSavedChannelNotice, setIsSavedChannelNotice] = useState(false);

  React.useEffect(() => {
    if (activeSelectedChannel) {
      setEditChanName(activeSelectedChannel.name);
      setEditChanAvatar(activeSelectedChannel.avatar);
      setEditChanCategory(activeSelectedChannel.category);
      setEditChanDesc(activeSelectedChannel.description || '');
      setIsSavedChannelNotice(false);
    }
  }, [selectedChannelId, activeSelectedChannel]);

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

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanName.trim()) return;

    const newId = `c_gen_${Date.now()}`;
    const newChan: Channel = {
      id: newId,
      name: newChanName,
      avatar: newChanAvatar,
      subscribers: '1',
      category: newChanCategory,
      isFollowing: true,
      creatorId: 'me',
      description: newChanDesc || 'Canal de diffusion sécurisé'
    };

    setChannels(prev => [...prev, newChan]);
    setSelectedChannelId(newId);
    setShowCreateChannel(false);
    setNewChanName('');
    setNewChanAvatar('📡');
    setNewChanCategory('Technologie');
    setNewChanDesc('');
  };

  const handleUpdateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedChannel || activeSelectedChannel.creatorId !== 'me') return;

    setChannels(prev => prev.map(ch => {
      if (ch.id === selectedChannelId) {
        return {
          ...ch,
          name: editChanName,
          avatar: editChanAvatar,
          category: editChanCategory,
          description: editChanDesc
        };
      }
      return ch;
    }));

    setIsSavedChannelNotice(true);
    setTimeout(() => {
      setIsSavedChannelNotice(false);
    }, 4000);
  };

  const backgrounds = [
    'from-emerald-600 via-yellow-500 to-red-650',
    'from-amber-500 to-red-650',
    'from-emerald-500 to-teal-700',
    'from-red-600 to-rose-800',
    'from-slate-900 to-gray-800'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'gif' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' Kb');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalMediaUrl = '';
    
    if (statusType === 'text') {
      if (!storyText.trim()) return;
    } else {
      if (!mediaUrl) {
        alert('Veuillez séléctionner un fichier ou choisir un modèle ! 📁');
        return;
      }
      finalMediaUrl = mediaUrl;
    }

    // Optimistic UI: build story immediately for instant feedback
    const optimisticStory: Story = {
      id: `story_me_${Date.now()}`,
      contactId: 'me',
      contactName: 'Mon Statut',
      contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      mediaUrl: finalMediaUrl,
      mediaType: statusType,
      textBgColor: statusType === 'text' ? storyBg : undefined,
      textContent: statusType === 'text' ? storyText : mediaCaption,
      fileName: statusType === 'document' ? (fileName || 'Document.pdf') : undefined,
      fileSize: statusType === 'document' ? (fileSize || '1.1 Mb') : undefined,
      timestamp: new Date().toISOString(),
      viewed: false
    };

    setStories(prev => [optimisticStory, ...prev]);

    // Persist to backend
    try {
      const res = await api.addStory({
        textBgColor: statusType === 'text' ? storyBg : undefined,
        textContent: statusType === 'text' ? storyText : (mediaCaption || undefined),
        mediaUrl: finalMediaUrl || undefined,
        mediaType: statusType,
        fileName: statusType === 'document' ? (fileName || 'Document.pdf') : undefined,
        fileSize: statusType === 'document' ? (fileSize || '1.1 Mb') : undefined
      });

      // Replace optimistic story with server-confirmed story (correct ID)
      if (res.success && res.story) {
        setStories(prev => [res.story, ...prev.filter(s => s.id !== optimisticStory.id)]);
      }
    } catch (err) {
      console.error('[ActualitesTab] Erreur lors de la publication du statut:', err);
      // Keep optimistic story even if backend fails for better UX
    }
    
    // Reset posting states
    setStoryText('');
    setMediaUrl('');
    setMediaCaption('');
    setFileName('');
    setFileSize('');
    setSelectedFile(null);
    setStatusType('text');
    setShowAddStoryModal(false);
  };

  const handleRepostStory = async (storyToRepost: Story, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid triggering standard view story modal
    
    const repostedTextContent = storyToRepost.textContent
      ? `🔁 Partagé : ${storyToRepost.textContent}`
      : '🔁 Statut partagé';

    // Optimistic UI update
    const newStory: Story = {
      id: `story_me_rep_${Date.now()}`,
      contactId: 'me',
      contactName: 'Mon Statut',
      contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      mediaUrl: storyToRepost.mediaUrl,
      mediaType: storyToRepost.mediaType,
      textBgColor: storyToRepost.textBgColor || 'from-emerald-600 via-yellow-500 to-red-650',
      textContent: repostedTextContent,
      timestamp: new Date().toISOString(),
      viewed: false
    };

    setStories(prev => [newStory, ...prev]);

    // Persist repost to backend
    try {
      await api.addStory({
        textBgColor: storyToRepost.textBgColor,
        textContent: repostedTextContent,
        mediaUrl: storyToRepost.mediaUrl || undefined,
        mediaType: storyToRepost.mediaType
      });
    } catch (err) {
      console.error('[ActualitesTab] Erreur lors du repartage:', err);
    }

    alert('Statut repartagé avec succès sur votre profil ! 🔁🎉');
  };

  const toggleFollowChannel = async (channelId: string) => {
    // Optimistic toggle for instant UI feedback
    setChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, isFollowing: !ch.isFollowing } : ch
    ));

    // Sync with backend
    try {
      const res = await api.followChannel(channelId);
      if (res.success && res.channels) {
        setChannels(res.channels);
      }
    } catch (err) {
      console.error('[ActualitesTab] Erreur toggle follow canal:', err);
      // Revert optimistic update on error
      setChannels(prev => prev.map(ch =>
        ch.id === channelId ? { ...ch, isFollowing: !ch.isFollowing } : ch
      ));
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 font-sans max-w-7xl mx-auto">
      
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-12 gap-6'} items-start`}>
        {/* Left Column: Quick Post and Stories list */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-6 xl:col-span-5'}`}>
          
          {/* Zone de Publication Rapide mboaTalk/WhatsApp */}
      <div id="quick-post-box" className="bg-slate-900/95 border border-slate-800/80 rounded-2xl p-4 shadow-sm text-left">
        <div className="flex items-center gap-3">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" 
            alt="My avatar" 
            className="w-10 h-10 rounded-full object-cover border border-slate-800 shrink-0"
          />
          <button
            id="btn-trigger-post-modal"
            onClick={() => {
              setStatusType('text');
              setShowAddStoryModal(true);
            }}
            className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800/60 rounded-xl px-4 py-2.5 text-xs text-slate-400 text-left transition-all duration-200 cursor-pointer"
          >
            {t('news_post_placeholder')}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 font-sans flex-wrap gap-2">
          <button
            id="btn-post-text-shortcut"
            onClick={() => {
              setStatusType('text');
              setShowAddStoryModal(true);
            }}
            className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-455 hover:bg-slate-800/60 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            <span>{t('news_write')}</span>
          </button>

          <button
            id="btn-post-image-shortcut"
            onClick={() => {
              setStatusType('image');
              setShowAddStoryModal(true);
              setTimeout(() => {
                const imgInput = document.getElementById('story-file-image') as HTMLInputElement;
                imgInput?.click();
              }, 150);
            }}
            className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-455 hover:bg-slate-800/60 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Image className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            <span>{t('news_photo')}</span>
          </button>

          <button
            id="btn-post-video-shortcut"
            onClick={() => {
              setStatusType('video');
              setShowAddStoryModal(true);
              setTimeout(() => {
                const vidInput = document.getElementById('story-file-video') as HTMLInputElement;
                vidInput?.click();
              }, 150);
            }}
            className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-455 hover:bg-slate-800/60 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Film className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            <span>{t('news_video')}</span>
          </button>

          <button
            id="btn-post-doc-shortcut"
            onClick={() => {
              setStatusType('document');
              setShowAddStoryModal(true);
              setTimeout(() => {
                const docInput = document.getElementById('story-file-document') as HTMLInputElement;
                docInput?.click();
              }, 150);
            }}
            className="group flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-455 hover:bg-slate-800/60 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            <span>{t('news_file')}</span>
          </button>
        </div>
      </div>

      {/* Stories Section / WhatsApp structure */}
      <div className="bg-slate-900/95 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('news_recent')}</h2>
          <button
            onClick={() => setShowAddStoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-550/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('news_create')}
          </button>
        </div>

        {/* Mon Statut stand-alone row on top */}
        <div className="pb-3 border-b border-slate-800/60 mb-4">
          <div 
            className="flex items-center gap-3.5 cursor-pointer hover:bg-slate-800/30 p-2 rounded-xl transition duration-150" 
            onClick={() => setShowAddStoryModal(true)}
          >
            <div className="relative w-14 h-14 rounded-full border border-slate-700/60 p-0.5 flex items-center justify-center bg-slate-950">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" 
                alt="My avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="absolute right-0 bottom-0 bg-[#25D366] hover:bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-md">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <div className="text-left font-sans flex-1">
              <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{t('news_my_status')}</span>
                <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] font-extrabold uppercase px-1.5 py-0.5 rounded">{t('news_share_24h')}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Ajoutez une photo, vidéo, document ou texte éphémère</p>
            </div>
          </div>
        </div>

        {/* Stories list vertically stacked */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 pb-1 flex items-center gap-1.5">
            <span>{t('news_recent')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] animate-pulse inline-block" />
          </h3>
          
          {stories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">{t('news_empty')}</div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {stories.map((story) => {
                const isText = story.mediaType === 'text';
                const dateRelative = new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div 
                    key={story.id} 
                    onClick={() => {
                      setActiveStory(story);
                      // Mark as viewed on backend (fire-and-forget)
                      api.viewStory(story.id).catch(() => {});
                    }}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-xl cursor-pointer group transitionDuration-150"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Left: profile photo with colored ring (gradient green/blue) */}
                      <div className="relative w-14 h-14 p-[2.5px] bg-gradient-to-tr from-[#25D366] to-[#0A84FF] rounded-full flex items-center justify-center shrink-0">
                        <img 
                          src={story.contactAvatar} 
                          alt={story.contactName} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-900 bg-slate-900"
                        />
                        <div className="absolute -right-1 bottom-0 bg-[#00a884] text-[8px] text-white font-black rounded-lg px-1 py-0.5 font-mono uppercase tracking-wider scale-90 border border-slate-900 shadow-sm">
                          24h
                        </div>
                      </div>

                      {/* Middle: author and description */}
                      <div className="text-left font-sans">
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition duration-150">
                          {story.contactName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>Aujourd'hui à {dateRelative}</span>
                          {story.mediaType !== 'text' && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded uppercase">
                              {story.mediaType}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick action buttons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {story.contactId !== 'me' && (
                        <button 
                          onClick={(e) => handleRepostStory(story, e)}
                          title="Repartager instantanément ce statut sur mon compte"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Repeat className="w-3 h-3 text-[#0A84FF]" />
                          <span>{t('news_share')}</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => setActiveStory(story)}
                        className="px-2.5 py-1.5 bg-[#0A84FF] hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        {t('news_view')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        </div>

        {/* Right Column: Channels suggestions and detailed settings */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-6 xl:col-span-7'}`}>

          {/* Suggested Channels Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-bold text-slate-100">{t('news_channels')}</h2>
          </div>
          <button
            onClick={() => setShowCreateChannel(!showCreateChannel)}
            className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-xl transition border border-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('news_create_channel')}
          </button>
        </div>

        {/* CREATE CHANNEL FORM INLINE */}
        <AnimatePresence>
          {showCreateChannel && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateChannel}
              className="p-4 bg-slate-950/65 rounded-xl border border-emerald-500/25 space-y-3.5 overflow-hidden text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {t('news_new_channel')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 font-sans">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Nom du canal</label>
                  <input
                    type="text"
                    required
                    value={newChanName}
                    onChange={(e) => setNewChanName(e.target.value)}
                    placeholder="ex: Bons plans cryptos 📈"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/55 text-left h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Avatar / Icône</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newChanAvatar}
                    onChange={(e) => setNewChanAvatar(e.target.value)}
                    placeholder="📡"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-white focus:outline-none focus:border-emerald-500/55 h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Catégorie</label>
                  <select
                    value={newChanCategory}
                    onChange={(e) => setNewChanCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500/55 h-8 text-left"
                  >
                    <option value="Technologie">Technologie</option>
                    <option value="Loisirs">Loisirs</option>
                    <option value="Finances">Finances</option>
                    <option value="Cuisine">Cuisine</option>
                    <option value="Sécurité">Sécurité</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-sans">{t('news_channel_desc')}</label>
                  <input
                    type="text"
                    value={newChanDesc}
                    onChange={(e) => setNewChanDesc(e.target.value)}
                    placeholder="Canal d'informations..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/55 h-8 text-left"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 text-[10px] uppercase font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white font-extrabold text-[10px] uppercase rounded-lg transition"
                >
                  Créer le canal
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {channels.map((chan) => {
            const isSelected = selectedChannelId === chan.id;
            return (
              <div 
                key={chan.id} 
                onClick={() => setSelectedChannelId(chan.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-250 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-inner' 
                    : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-xl shadow-inner animate-fade-in">
                    {chan.avatar}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-semibold text-slate-200">{chan.name}</h3>
                      {chan.creatorId === 'me' && (
                        <span className="text-[8px] bg-sky-500/10 text-sky-450 border border-sky-500/20 px-1 rounded uppercase font-extrabold tracking-wider">Créé</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{chan.subscribers} abonnés • {chan.category}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollowChannel(chan.id);
                  }}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chan.isFollowing
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700/50'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/20'
                  }`}
                >
                  {chan.isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Suivi</span>
                    </>
                  ) : (
                    <span>S'abonner</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* DETAILS AND PRIVATE PARAMETERS PANEL */}
        {activeSelectedChannel && (
          <div className="p-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl space-y-3.5 text-left animate-fade-in mt-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1">
                ⚙️ Paramètres du canal sélectionné
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-mono font-sans">Administrateur:</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/20 font-sans">
                  {activeSelectedChannel.creatorId === 'me' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-rose-450" />
                  )}
                  {getCreatorName(activeSelectedChannel.creatorId)}
                </span>
              </div>
            </div>

            {activeSelectedChannel.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                <span className="font-extrabold text-[9px] uppercase text-slate-500 block mb-0.5">Description de diffusion :</span>
                {activeSelectedChannel.description}
              </p>
            )}

            {/* If creator is me, allow editing, otherwise lock parameter modifications */}
            {activeSelectedChannel.creatorId === 'me' ? (
              <form onSubmit={handleUpdateChannel} className="bg-slate-950/45 p-3 rounded-xl border border-slate-850 space-y-3 font-sans">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Droits de modification accordés (Administrateur du canal)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-0.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400">{t('news_channel_name')}</label>
                    <input
                      type="text"
                      required
                      value={editChanName}
                      onChange={(e) => setEditChanName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 text-left h-7.5"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Icône / Avatar</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={editChanAvatar}
                      onChange={(e) => setEditChanAvatar(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-center text-white focus:outline-none focus:border-blue-500/50 h-7.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-sans">Catégorie</label>
                    <select
                      value={editChanCategory}
                      onChange={(e) => setEditChanCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-white focus:outline-none focus:border-blue-500/50 h-7.5 text-left"
                    >
                      <option value="Technologie">Technologie</option>
                      <option value="Loisirs">Loisirs</option>
                      <option value="Finances">Finances</option>
                      <option value="Cuisine">Cuisine</option>
                      <option value="Sécurité">Sécurité</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Modifier la description</label>
                    <textarea
                      value={editChanDesc}
                      onChange={(e) => setEditChanDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-white focus:outline-none focus:border-blue-500/50 h-10 text-left resize-none leading-snug"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 animate-fade-in font-sans">
                  <div>
                    {isSavedChannelNotice && (
                      <span className="text-emerald-400 text-[10px] font-bold animate-pulse flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Modifications enregistrées sur mboaTalk ! 🔒
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-505 text-white font-bold text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Enregistrer les paramètres du canal
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-950/50 p-3.5 rounded-xl border border-rose-950/20 space-y-2 text-slate-450 animate-fade-in font-sans">
                <div className="flex items-center gap-2 text-rose-455">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Modulations verrouillées</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Seul l'administrateur de cette chaîne de diffusion (<span className="text-amber-400 font-extrabold">{getCreatorName(activeSelectedChannel.creatorId)}</span>) est habilité à modifier son titre, son logo ou ses restrictions de catégorie.
                </p>
                <div className="pt-1.5 flex justify-end font-mono">
                  <div className="px-2 py-0.5 bg-slate-900 text-slate-500 text-[8px] uppercase font-extrabold rounded border border-slate-800 inline-flex items-center gap-1 select-none">
                    <Lock className="w-2 h-2" />
                    Lecture Seule (Mode Abonnée)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        </div>
      </div>

      {/* Dynamic educational stats for fees inside news */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl flex-shrink-0">
          💡
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">Actu Frais Réduits</h4>
          <p className="text-xs text-slate-350 leading-relaxed">
            mboaTalk utilise une technologie de micro-transactions décentralisées permettant de réduire les frais d'envoi à seulement <span className="text-emerald-450 font-bold">0.1 %</span> tout en gardant une sécurité de qualité militaire.
          </p>
        </div>
      </div>

      {/* Modal - Post Multi-Format Story */}
      {showAddStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-850">
              <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                <Camera className="w-4 h-4 text-emerald-400" />
                Publier un statut 24 heures
              </h3>
              <button 
                onClick={() => {
                  setShowAddStoryModal(false);
                  setMediaUrl('');
                  setFileName('');
                  setFileSize('');
                  setSelectedFile(null);
                }}
                className="text-slate-405 hover:text-slate-200 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 gap-1">
              {(['text', 'image', 'video', 'gif', 'document'] as const).map((t) => {
                const label = t === 'text' ? 'Texte' : t === 'image' ? 'Image' : t === 'video' ? 'Vidéo' : t === 'gif' ? 'GIF' : 'Doc';
                const Icon = t === 'text' ? FileText : t === 'image' ? Image : t === 'video' ? Film : t === 'gif' ? Smile : FileUp;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setStatusType(t);
                      setMediaUrl('');
                      setFileName('');
                      setFileSize('');
                      setSelectedFile(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all capitalize cursor-pointer ${
                      statusType === t 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handlePostStory} className="space-y-4">
              
              {/* TAB CONTENT: TEXT */}
              {statusType === 'text' && (
                <div className="space-y-3">
                  <div className={`w-full aspect-[4/3] rounded-xl p-4 flex flex-col justify-between bg-gradient-to-tr ${storyBg} transition-all duration-300 shadow-md`}>
                    <textarea
                      className="w-full h-full bg-transparent resize-none border-none text-white placeholder-white/50 focus:outline-none focus:ring-0 text-center font-bold text-base flex items-center justify-center"
                      placeholder="Exprimez-vous ici pour 24 heures..."
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      maxLength={100}
                    />
                    <div className="text-right text-[10px] text-white/60">
                      {storyText.length}/100 caract.
                    </div>
                  </div>

                  {/* Colors Choice */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Palette d'arrière-plan :</label>
                    <div className="flex gap-2">
                      {backgrounds.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setStoryBg(bg)}
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${bg} border transition-all ${
                            storyBg === bg ? 'border-white scale-110 ring-2 ring-emerald-500' : 'border-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: IMAGE */}
              {statusType === 'image' && (
                <div className="space-y-3 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Fichier Image :</label>
                  <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
                    <input
                      id="story-file-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'image')}
                    />
                    {mediaUrl ? (
                      <div className="text-center">
                        <img src={mediaUrl} className="max-h-24 mx-auto rounded border border-slate-800" />
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1.5 truncate max-w-[200px]">✓ {fileName || "Fichier chargé"}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] text-slate-300 font-bold">Glisser ou séléctionner une image</span>
                        <span className="text-[9px] text-slate-500 font-mono">PNG, JPG, BMP</span>
                      </>
                    )}
                  </label>

                  {/* Presets models */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Ou choisir un modèle de l'app :</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: '🌐 Web Cosmic', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400' },
                        { name: '⚡ Tech Code', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400' },
                        { name: '🎨 Dégradé', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400' },
                      ].map((item) => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => {
                            setMediaUrl(item.url);
                            setFileName(item.name);
                            setFileSize('75 Kb');
                          }}
                          className={`p-1 border bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] transition-all capitalize flex flex-col items-center gap-1 ${
                            mediaUrl === item.url ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <img src={item.url} className="w-full h-8 object-cover rounded-sm" />
                          <span className="truncate w-full text-center">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: VIDEO */}
              {statusType === 'video' && (
                <div className="space-y-3 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Fichier Vidéo :</label>
                  <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
                    <input
                      id="story-file-video"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'video')}
                    />
                    {mediaUrl && fileName ? (
                      <div className="text-center w-full">
                        <Film className="w-8 h-8 text-emerald-400 mx-auto" />
                        <p className="text-[11px] text-emerald-400 font-bold mt-1 max-w-[200px] truncate mx-auto">✓ {fileName}</p>
                        <span className="text-[9px] text-slate-500 font-mono">{fileSize}</span>
                        <div className="mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[8px] uppercase inline-block rounded">Prêt à jouer</div>
                      </div>
                    ) : (
                      <>
                        <Film className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] text-slate-300 font-bold">Glisser ou séléctionner un fichier MP4</span>
                        <span className="text-[9px] text-slate-500 font-mono">Format .mp4, .webm (Max 24h)</span>
                      </>
                    )}
                  </label>

                  {/* Video Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Ou utiliser une animation de synthèse :</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: '🟢 Design Green Matrix', url: 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-falling-green-letters-vertical-39745-large.mp4' },
                        { name: '💜 Cyberpunk Abstract', url: 'https://assets.mixkit.co/videos/preview/mixkit-cyber-punk-futuristic-city-street-with-neon-lights-vertical-40097-large.mp4' },
                      ].map((item) => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => {
                            setMediaUrl(item.url);
                            setFileName(item.name);
                            setFileSize('1.4 Mb');
                          }}
                          className={`p-2 border bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] text-left transition-all ${
                            mediaUrl === item.url ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <p className="font-bold truncate">{item.name}</p>
                          <span className="text-[8px] opacity-60 font-mono">Vidéo Mixkit loop</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GIF */}
              {statusType === 'gif' && (
                <div className="space-y-3 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Importer un fichier GIF :</label>
                  <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
                    <input
                      id="story-file-gif"
                      type="file"
                      accept="image/gif"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'gif')}
                    />
                    {mediaUrl ? (
                      <div className="text-center">
                        <img src={mediaUrl} className="max-h-24 mx-auto rounded border border-slate-800" />
                        <p className="text-[10px] text-emerald-400 font-semibold mt-1.5 truncate max-w-[200px]">✓ {fileName || "GIF importé"}</p>
                      </div>
                    ) : (
                      <>
                        <Smile className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] text-slate-300 font-bold">Sélectionner un fichier GIF</span>
                        <span className="text-[9px] text-slate-500 font-mono">Format GIF animé</span>
                      </>
                    )}
                  </label>

                  {/* GIF Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Bibliothèque de Gifs populaires :</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { name: '🎉 Celebration', url: 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif' },
                        { name: '👾 Cyberwave', url: 'https://media.giphy.com/media/l0HlxO7ArI7ZfA8IE/giphy.gif' },
                        { name: '💻 Dev Life', url: 'https://media.giphy.com/media/26n6WywJyusf21Ar4/giphy.gif' },
                      ].map((item) => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => {
                            setMediaUrl(item.url);
                            setFileName(item.name);
                            setFileSize('350 Kb');
                          }}
                          className={`p-1 border bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] transition-all flex flex-col items-center gap-1 ${
                            mediaUrl === item.url ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <img src={item.url} className="w-full h-8 object-cover rounded-sm" />
                          <span className="truncate w-full text-center text-[8px]">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: DOCUMENT */}
              {statusType === 'document' && (
                <div className="space-y-3 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Votre Document :</label>
                  <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
                    <input
                      id="story-file-document"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.zip"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'document')}
                    />
                    {mediaUrl || fileName ? (
                      <div className="text-center w-full">
                        <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                        <p className="text-[11px] text-amber-400 font-bold mt-1.5 max-w-[200px] truncate mx-auto">✓ {fileName}</p>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{fileSize || '10 Kb'}</span>
                        <div className="mt-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-[8px] uppercase inline-block rounded">Document Structuré</div>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] text-slate-300 font-bold">Sélectionner un PDF, Word, TXT, ZIP...</span>
                        <span className="text-[9px] text-slate-500 font-mono">Prise en charge de tous les formats</span>
                      </>
                    )}
                  </label>

                  {/* Document Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Ou utiliser un document pré-rempli :</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Plan_Amelioration_Frais.pdf', size: '210 Kb' },
                        { name: 'Cahier_des_charges_biometrique.docx', size: '1.2 Mb' },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setMediaUrl('#preset-doc-' + item.name);
                            setFileName(item.name);
                            setFileSize(item.size);
                          }}
                          className={`p-2 border bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] text-left transition-all ${
                            fileName === item.name ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <p className="font-bold truncate">{item.name}</p>
                          <span className="text-[8px] opacity-65 font-mono">{item.size} • PDF/DOCX</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SHARED CAPTION FIELD FOR ALL MEDIA EXCEPT PLAIN TEXT */}
              {statusType !== 'text' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Légende du statut :</label>
                  <input
                    type="text"
                    placeholder="Ajouter une légende... (Facultatif)"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-left"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStoryModal(false);
                    setMediaUrl('');
                    setFileName('');
                    setFileSize('');
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100/5 hover:bg-slate-100/10 text-xs text-slate-300 font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={statusType === 'text' ? !storyText.trim() : !mediaUrl}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Publier sur mon statut 🚀
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal - Active Fullscreen Story View */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4"
          >
            {/* Header / User item details bar */}
            <div className="flex justify-between items-center text-white pt-2">
              <div className="flex items-center gap-3">
                <img 
                  src={activeStory.contactAvatar} 
                  alt={activeStory.contactName} 
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold">{activeStory.contactName}</h4>
                  <p className="text-[10px] text-slate-400">
                    Posté le {new Date(activeStory.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Main status content */}
            <div className="my-auto flex items-center justify-center w-full max-w-sm mx-auto">
              {activeStory.mediaType === 'text' ? (
                <div className={`w-full aspect-[3/4] rounded-2xl flex items-center justify-center p-6 text-center text-2xl font-bold bg-gradient-to-tr ${activeStory.textBgColor || 'from-indigo-600 to-purple-600'} text-white shadow-xl`}>
                  {activeStory.textContent}
                </div>
              ) : activeStory.mediaType === 'video' ? (
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <video 
                    src={activeStory.mediaUrl} 
                    controls 
                    autoPlay 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {activeStory.textContent && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-10 text-left pointer-events-none">
                      <p className="text-white text-xs font-medium leading-relaxed">🎥 {activeStory.textContent}</p>
                    </div>
                  )}
                </div>
              ) : activeStory.mediaType === 'document' ? (
                <div className="w-full aspect-[3/4] rounded-2xl p-5 bg-slate-900 border border-slate-800 flex flex-col justify-between text-left shadow-xl">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
                      📄
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-slate-100 text-xs break-all line-clamp-2">{activeStory.fileName || 'document_partage.pdf'}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Taille : {activeStory.fileSize || '1.1 Mo'}</p>
                      <span className="inline-block text-[8px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">Document Sécurisé mboaTalk</span>
                    </div>
                    {activeStory.textContent && (
                      <p className="text-[11px] text-slate-300 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 leading-relaxed mt-1">
                        💬 {activeStory.textContent}
                      </p>
                    )}
                  </div>

                  <a 
                    href={activeStory.mediaUrl.startsWith('data:') ? activeStory.mediaUrl : '#'} 
                    download={activeStory.fileName || 'Doc.pdf'}
                    onClick={(e) => {
                      if (!activeStory.mediaUrl.startsWith('data:')) {
                        e.preventDefault();
                        alert(`Simulation du téléchargement sécurisé de : ${activeStory.fileName || 'Document.pdf'}`);
                      }
                    }}
                    className="w-full py-2.5 bg-[#00a884] hover:bg-emerald-500 rounded-xl text-center text-[11px] font-bold text-white transition block cursor-pointer"
                  >
                    Ouvrir & Télécharger le Document 📥
                  </a>
                </div>
              ) : (
                /* Renders images / gifs */
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-900 border border-slate-800">
                  <img 
                    src={activeStory.mediaUrl} 
                    alt="Story item" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {activeStory.textContent ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-10 text-left">
                      <p className="text-white text-xs font-medium leading-relaxed">✨ {activeStory.textContent}</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-5">
                      <p className="text-white text-xs font-medium">✨ Statut {activeStory.mediaType} partagé</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom active status share and info */}
            <div className="flex flex-col items-center gap-3 text-center pb-6">
              
              <div className="flex justify-center gap-4">
                {activeStory.contactId !== 'me' && (
                  <button
                    onClick={(e) => {
                      handleRepostStory(activeStory, e);
                      setActiveStory(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-full text-xs font-bold text-white shadow-md cursor-pointer border border-emerald-500 transition-all hover:scale-105"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>Repartager sur mon profil 🔁</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                S'efface automatiquement après 24 heures
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
