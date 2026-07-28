import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Speech, MessageSquare, ArrowLeft, MoreVertical, Paperclip, File, Video, Phone, CheckCheck, Play, Pause, Repeat, Trash2, Mic, Image, Film, Smile, CircleDollarSign, ShieldCheck } from 'lucide-react';
import { Chat, Contact, Group, Message, Story } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../i18n/LanguageContext';

interface DiscussionsTabProps {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  contacts: Contact[];
  groups: Group[];
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  onStartCall: (name: string, avatar: string, type: 'audio' | 'video', isGroup?: boolean) => void;
  onSendMoneyClick?: (contactName: string) => void;
  isMobile?: boolean;
}

export default function DiscussionsTab({ chats, setChats, contacts, groups, stories, setStories, onStartCall, onSendMoneyClick, isMobile = false }: DiscussionsTabProps) {
  const { t } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Custom message input
  const [inputValue, setInputValue] = useState('');
  
  // Hidden inputs references for trigger
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'gif' | 'document' | null>(null);
  
  // Attachment menu states
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordTimerRef = useRef<number | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleTriggerFileInput = (type: 'image' | 'video' | 'gif' | 'document') => {
    setAttachmentType(type);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleChatFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !attachmentType) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const fileDataUrl = event.target.result as string;
        sendCustomAttachment(attachmentType, fileDataUrl, file.name, (file.size / 1024).toFixed(1) + ' Kb');
      }
    };
    reader.readAsDataURL(file);
    
    // clear input
    e.target.value = '';
  };

  const sendCustomAttachment = async (type: 'image' | 'video' | 'gif' | 'document', url: string, name: string, size: string) => {
    if (!activeChatId) return;
    setShowAttachMenu(false);

    try {
      const res = await api.sendMessage({
        chatId: activeChatId,
        type,
        fileUrl: url,
        fileName: name,
        fileSize: size
      });
      if (res.success && res.message) {
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            let typeName = 'Piece jointe';
            if (type === 'image') typeName = '🖼️ Image';
            else if (type === 'video') typeName = '🎥 Vidéo';
            else if (type === 'gif') typeName = '👾 GIF';
            else if (type === 'document') typeName = `📄 Document: ${name}`;

            return {
              ...chat,
              messages: [...chat.messages, res.message],
              recentMessage: typeName,
              lastActive: res.message.timestamp
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      console.error('Failed to send attachment:', err);
    }
  };

  // Filter chats by search term or contact name
  const filteredChats = chats.filter(chat => {
    if (chat.groupId) {
      const g = groups.find(gp => gp.id === chat.groupId);
      return g?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             chat.messages.some(m => m.text?.toLowerCase().includes(searchTerm.toLowerCase()));
    } else {
      const c = contacts.find(co => co.id === chat.contactId);
      return c?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             chat.messages.some(m => m.text?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  });

  // Handle Recording Timer simulation
  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    const text = inputValue;
    setInputValue('');

    try {
      const res = await api.sendMessage({ chatId: activeChatId, text, type: 'text' });
      if (res.success && res.message) {
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, res.message],
              recentMessage: text,
              unreadCount: 0,
              lastActive: res.message.timestamp
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Simulated Voice Message Sender
  const handleSendVoiceMessage = async () => {
    if (!activeChatId) return;
    setIsRecording(false);
    
    const durationMin = Math.floor(recordingSeconds / 60);
    const durationSec = recordingSeconds % 60;
    const durationText = `${durationMin}:${durationSec.toString().padStart(2, '0')}`;

    try {
      const res = await api.sendMessage({
        chatId: activeChatId,
        type: 'voice',
        text: `Message vocal (${durationText})`
      });
      if (res.success && res.message) {
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, res.message],
              recentMessage: `🎤 Message vocal (${durationText})`,
              lastActive: res.message.timestamp
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      console.error('Failed to send voice message:', err);
    }
  };

  // Simulated Document Sender
  const handleSendDocument = async (docName: string, size: string) => {
    if (!activeChatId) return;
    setShowAttachMenu(false);

    try {
      const res = await api.sendMessage({
        chatId: activeChatId,
        type: 'document',
        fileName: docName,
        fileSize: size
      });
      if (res.success && res.message) {
        setChats(prev => prev.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, res.message],
              recentMessage: `📄 Document: ${docName}`,
              lastActive: res.message.timestamp
            };
          }
          return chat;
        }));
      }
    } catch (err) {
      console.error('Failed to send document:', err);
    }
  };

  // Quick Repost of Story directly inside discussion or on global status list
  const handleRepostFromStoryDropdown = async (story: Story) => {
    setShowAttachMenu(false);
    
    try {
      const res = await api.addStory({
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        textBgColor: story.textBgColor,
        textContent: story.textContent ? `Partagé de ${story.contactName}: ${story.textContent}` : `Statut de ${story.contactName}`
      });
      if (res.success && res.story) {
        setStories(prev => [res.story, ...prev]);
        alert(`Vous avez repartagé le statut de ${story.contactName} sur votre fil de statuts ! 🔁`);
      }
    } catch (err) {
      console.error('Failed to share story status:', err);
    }
  };

  const getChatInfo = (chat: Chat) => {
    if (chat.groupId) {
      const g = groups.find(gp => gp.id === chat.groupId);
      return {
        name: g?.name || 'Groupe sans nom',
        avatar: g?.avatar || '👥',
        isGroup: true,
        phone: 'Membres multiples'
      };
    } else {
      const c = contacts.find(co => co.id === chat.contactId);
      return {
        name: c?.name || 'Contact',
        avatar: c?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        isGroup: false,
        phone: c?.phone || ''
      };
    }
  };

  return (
    <div className={`flex-1 flex flex-col font-sans text-white relative min-h-0 ${isMobile ? 'h-full overflow-hidden' : 'h-[640px] md:h-full'}`}>
      {/* Grid container with dual panels on desktop, single panel toggling on mobile */}
      <div className={`grid h-full min-h-0 w-full flex-1 ${isMobile ? 'grid-cols-1 gap-0' : 'grid-cols-1 md:grid-cols-12 md:gap-4 lg:gap-5'}`}>
        
        {/* LEFT COLUMN: CHATS LIST */}
        <div 
          className={`${activeChatId ? (isMobile ? 'hidden' : 'hidden md:flex') : 'flex'} flex-col ${isMobile ? 'w-full h-full pb-4' : 'md:col-span-12 lg:col-span-4 space-y-4 pb-20 md:pb-0 h-full min-h-0'}`}
        >
          {/* Search Input Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#8696a0]" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('chat_search')}
              className="w-full bg-[#1f2c34] border-none rounded-lg pl-10 pr-4 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884] transition-all font-sans text-left h-9"
            />
          </div>

          {/* Discussions Feed layout */}
          <div className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar max-h-[50vh] md:max-h-none">
            {filteredChats.length === 0 ? (
              <div className="text-center py-10 text-[#8696a0] text-xs">
                {t('chat_empty_list')}
              </div>
            ) : (
              filteredChats.map((chat) => {
                const info = getChatInfo(chat);
                const isSelected = chat.id === activeChatId;
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                    }}
                    className={`px-3 py-2.5 flex items-center justify-between transition-all cursor-pointer border-b border-[#222d35] ${
                      isSelected 
                        ? 'bg-[#202c33]' 
                        : 'hover:bg-[#202c33]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {info.isGroup ? (
                        <div className="w-12 h-12 bg-[#2a3942] rounded-full flex items-center justify-center text-xl shrink-0">
                          {info.avatar}
                        </div>
                      ) : (
                        <img 
                          src={info.avatar as string} 
                          alt={info.name} 
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-[#e9edef] truncate">{info.name}</h3>
                          <span className="text-[10px] text-[#8696a0] font-mono ml-2 shrink-0">
                            {new Date(chat.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <p className="text-xs text-[#8696a0] truncate mt-0.5">
                           {chat.recentMessage || t('chat_start')}
                        </p>
                      </div>
                    </div>

                    {/* Unread badge & trigger indicators */}
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-[#25D366] text-[10px] font-extrabold text-[#111b21] flex items-center justify-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT SCREEN OR WALLPAPER DESKTOP INTRO */}
        <div 
          className={`${activeChatId ? 'flex' : (isMobile ? 'hidden' : 'hidden md:flex')} flex-1 ${isMobile ? 'w-full h-full border-0' : 'md:col-span-7 lg:col-span-8'} flex-col h-full min-h-0 overflow-hidden relative`}
        >
          {activeChat ? (
            /* CHAT ACTIVE CONTENT PANEL */
            <div className="flex flex-col h-full min-h-0 overflow-hidden flex-1">
              {/* Top active bar */}
              {(() => {
                const info = getChatInfo(activeChat);
                return (
                  <div className="bg-[#1f2c34] px-3 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => setActiveChatId(null)}
                        className={`p-1 text-[#8696a0] hover:text-[#e9edef] transition shrink-0 cursor-pointer ${isMobile ? 'block' : 'md:hidden'}`}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      {info.isGroup ? (
                        <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center text-lg">
                          {info.avatar}
                        </div>
                      ) : (
                        <img 
                          src={info.avatar as string} 
                          alt={info.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left min-w-0">
                        <h3 className="text-sm font-medium text-[#e9edef] truncate">{info.name}</h3>
                        <p className="text-[11px] text-[#8696a0] truncate">{info.phone}</p>
                      </div>
                    </div>

                    {/* Calling and Action Triggers */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartCall(info.name, info.isGroup ? '' : (info.avatar as string), 'audio', info.isGroup)}
                        className="text-[#8696a0] hover:text-[#e9edef] transition"
                        title={t('chat_call_audio')}
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onStartCall(info.name, info.isGroup ? '' : (info.avatar as string), 'video', info.isGroup)}
                        className="text-[#8696a0] hover:text-[#e9edef] transition"
                        title={t('chat_call_video')}
                      >
                        <Video className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })()}

               {/* Message Area */}
              <div className="flex-1 overflow-y-auto whatsapp-bg">
                <div className="p-3.5 space-y-3.5 no-scrollbar flex flex-col justify-end min-h-0">
                  <div className="text-center my-1 shrink-0">
                    <span className="inline-block px-3 py-1 bg-[#182229] border border-[#222d35]/80 rounded-md text-[9px] text-[#8696a0] font-mono">
                      Messages chiffrés de bout en bout
                    </span>
                  </div>

                  <div className="overflow-y-auto flex-1 space-y-2.5 no-scrollbar pr-0.5 pb-2">
                    {activeChat.messages.map((msg) => {
                      const isMe = msg.senderId === 'me';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div className={`max-w-[80%] rounded-2xl p-2.5 px-3.5 space-y-1.5 shadow-sm ${
                            isMe 
                              ? 'msg-sent rounded-tr-none text-right' 
                              : 'msg-received rounded-tl-none text-left'
                          }`}>
                          {/* Document template display */}
                          {msg.type === 'document' ? (
                            <div className="flex items-center gap-2.5 bg-black/25 rounded-xl p-2.5 text-left border border-white/5">
                              <File className="w-8 h-8 text-amber-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate text-white">{msg.fileName}</p>
                                <span className="text-[9px] text-white/60 font-mono block">{msg.fileSize || '120 Kb'} • Doc</span>
                                <a 
                                  href={msg.fileUrl?.startsWith('data:') ? msg.fileUrl : '#'} 
                                  download={msg.fileName || 'Doc.pdf'}
                                  onClick={(e) => {
                                    if (!msg.fileUrl?.startsWith('data:')) {
                                      e.preventDefault();
                                      alert(`Téléchargement sécurisé simulé de : ${msg.fileName}`);
                                    }
                                  }}
                                  className="text-[9px] text-teal-400 hover:text-teal-300 hover:underline font-bold inline-block mt-0.5"
                                >
                                  Ouvrir / Télécharger 📥
                                </a>
                              </div>
                            </div>
                          ) : msg.type === 'image' || msg.type === 'gif' ? (
                            <div className="rounded-xl overflow-hidden border border-white/5 bg-black/15 p-1 text-left">
                              <img 
                                src={msg.fileUrl} 
                                alt={msg.fileName || "Image"} 
                                className="max-h-56 max-w-full rounded-lg object-contain mx-auto"
                                referrerPolicy="no-referrer"
                              />
                              {msg.text && <p className="text-xs font-medium p-1.5 text-white/95 mt-1 leading-relaxed bg-black/10 rounded">{msg.text}</p>}
                            </div>
                          ) : msg.type === 'video' ? (
                            <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-950 p-1 text-left">
                              <video 
                                src={msg.fileUrl} 
                                controls 
                                playsInline 
                                className="max-h-56 max-w-full rounded-lg mx-auto"
                              />
                              {msg.text && <p className="text-xs font-medium p-1.5 text-white/95 mt-1 leading-relaxed bg-black/10 rounded">{msg.text}</p>}
                            </div>
                          ) : msg.type === 'voice' ? (
                            /* Simulated dynamic sound recording file item */
                            <div className="flex items-center gap-2.5 bg-black/25 rounded-xl p-2 text-left">
                              <button className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0 hover:bg-teal-400 transition">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </button>
                              <div>
                                <div className="flex gap-0.5 items-center">
                                  {/* Fake audio bars */}
                                  {[2, 4, 3, 5, 2, 6, 7, 3, 2, 5, 3].map((val, i) => (
                                    <span key={i} className="w-0.5 bg-teal-450 rounded-full" style={{ height: `${val * 2}px` }} />
                                  ))}
                                </div>
                                <span className="text-[8px] text-white/60 font-mono">Message vocal : {msg.duration}</span>
                              </div>
                            </div>
                          ) : (
                            /* Simple text message */
                            <p className="text-xs leading-relaxed text-left whitespace-pre-wrap">{msg.text}</p>
                          )}

                          <div className={`flex items-center justify-end gap-1 text-[10px] font-mono ${isMe ? 'text-[#aed9d9]' : 'text-[#8696a0]'}`}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && <CheckCheck className="w-4 h-4 text-[#aed9d9]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* Hidden native input for multi-type uploads */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleChatFileUploaded}
                accept={
                  attachmentType === 'image' 
                    ? 'image/*' 
                    : attachmentType === 'video' 
                      ? 'video/*' 
                      : attachmentType === 'gif' 
                        ? 'image/gif' 
                        : '*'
                }
              />

              {/* Custom Interactive Tool Attachment Strip */}
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-900 border-t border-slate-800 p-3 space-y-3 shrink-0 text-left"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/85 font-sans">
                      <span className="font-bold flex items-center gap-1">📎 {t('chat_attachments')}</span>
                      <button onClick={() => setShowAttachMenu(false)} className="text-[10px] text-emerald-400 font-extrabold cursor-pointer p-1">✕</button>
                    </div>

                    {/* DOUBLE ACTION: 1) SELECT REAL FILE FROM SYSTEM */}
                    <div className="space-y-1.5 font-sans text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400">1. Sélectionner un fichier ou envoyer de l'argent :</p>
                      <div className="grid grid-cols-5 gap-1.5">
                         <button
                          type="button"
                          onClick={() => handleTriggerFileInput('image')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-slate-300 transition cursor-pointer"
                        >
                          <div className="p-1.5 bg-emerald-500/10 text-[#00a884] rounded">
                            <Image className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold">Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerFileInput('video')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-slate-300 transition cursor-pointer"
                        >
                          <div className="p-1.5 bg-emerald-500/10 text-[#00a884] rounded">
                            <Film className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold">Vidéo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerFileInput('gif')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-slate-300 transition cursor-pointer"
                        >
                          <div className="p-1.5 bg-emerald-500/10 text-[#00a884] rounded">
                            <Smile className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold">GIF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerFileInput('document')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-slate-300 transition cursor-pointer"
                        >
                          <div className="p-1.5 bg-emerald-500/10 text-[#00a884] rounded">
                            <File className="w-4 h-4" />
                          </div>
                          <span className="text-[9px] font-bold">Document</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!activeChat) return;
                            const contact = contacts.find(c => c.id === activeChat.contactId);
                            if (!contact) {
                              alert("Le transfert direct d'argent est réservé aux discussions privées.");
                              return;
                            }
                            if (onSendMoneyClick) {
                              onSendMoneyClick(contact.name);
                            }
                          }}
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-slate-300 transition cursor-pointer"
                        >
                          <div className="p-1.5 bg-emerald-500/20 text-[#00a884] rounded animate-pulse">
                            <CircleDollarSign className="w-4 h-4 font-extrabold" />
                          </div>
                          <span className="text-[9px] font-extrabold text-[#00a884]">Argent 💵</span>
                        </button>
                      </div>
                    </div>

                    {/* DOUBLE ACTION: 2) RAPID SIMULATION PRESETS */}
                    <div className="space-y-1.5 pt-1 font-sans text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400">2. Ou envoyer nos modèles de synthèse instantanément :</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => sendCustomAttachment('image', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', 'Space_Graph.jpg', '125 Kb')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-left transition border border-slate-800 flex items-center gap-2 cursor-pointer text-slate-300 animate-fade-in"
                        >
                          <Image className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold leading-none truncate">Paysage Cosmique.jpg</p>
                            <span className="text-[8px] opacity-60">Modèle image chiffrée</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => sendCustomAttachment('video', 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-falling-green-letters-vertical-39745-large.mp4', 'Matrix_Green_Code.mp4', '1.4 Mb')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-left transition border border-slate-800 flex items-center gap-2 cursor-pointer text-slate-300 animate-fade-in"
                        >
                          <Film className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold leading-none truncate">Code Matrix Loop.mp4</p>
                            <span className="text-[8px] opacity-60">Modèle vidéo HD</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => sendCustomAttachment('gif', 'https://media.giphy.com/media/l0HlxO7ArI7ZfA8IE/giphy.gif', 'Retro_Wave_Grid.gif', '320 Kb')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-left transition border border-slate-800 flex items-center gap-2 cursor-pointer text-slate-300 animate-fade-in"
                        >
                          <Smile className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold leading-none truncate font-mono">Cyberpunk Neon.gif</p>
                            <span className="text-[8px] opacity-60">Modèle GIF animé</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendDocument('Rapport_Audit_mboaTalk_2026.pdf', '384 Kb')}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-left transition border border-slate-805 flex items-center gap-2 cursor-pointer text-slate-300 animate-fade-in"
                        >
                          <File className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold leading-none truncate font-mono">Rapport_Audit.pdf</p>
                            <span className="text-[8px] opacity-60">Document contractuel</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Share Active status trigger in Chat */}
                    <div className="space-y-1.5 pt-1 font-sans text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">🔁 Repartager un statut de contact :</p>
                      <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar animate-fade-in" id="status-share-container">
                        {stories.map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleRepostFromStoryDropdown(st)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 font-medium cursor-pointer"
                          >
                            <Repeat className="w-3 h-3 text-green-400 animate-spin" />
                            <span>Statut de {st.contactName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input message controls */}
              <div className="bg-[#1f2c34] px-3 py-2.5 border-t border-[#111b21] shrink-0 font-sans">
                {isRecording ? (
                  /* LIVE RECORDING VOICE OVERLAY PANEL */
                  <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-1.5 border border-red-500/30">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      <span className="text-red-400 font-bold font-mono">Enregistrement : {recordingSeconds}s</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsRecording(false)}
                        className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {t('chat_cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendVoiceMessage}
                        className="px-2.5 py-1 bg-red-650 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer"
                      >
                        {t('chat_send')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD TEXT INPUT */
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachMenu(!showAttachMenu);
                        setIsRecording(false);
                      }}
                      className={`p-2 rounded-full transition cursor-pointer ${
                        showAttachMenu ? 'bg-[#00a884]/20 text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                      title="Ajouter pièces jointes / voir statuts"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={t('chat_placeholder')}
                      className="flex-1 whatsapp-input border-none rounded-lg px-4 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884] text-left h-10"
                    />

                    {inputValue.trim() ? (
                      <button
                        type="submit"
                        className="p-2.5 bg-[#00a884] hover:bg-[#06cf9c] rounded-full text-white font-bold transition cursor-pointer shadow shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      /* Microphone trigger button */
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecording(true);
                          setShowAttachMenu(false);
                        }}
                        className="p-2.5 bg-[#00a884] hover:bg-[#06cf9c] rounded-full text-white transition cursor-pointer shrink-0"
                        title={t('chat_record')}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* PLACEHOLDER WHEN NO CHAT IS OPEN ON DESKTOP */
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4 relative h-full whatsapp-bg">
              <div className="w-20 h-20 rounded-full bg-[#1f2c34] flex items-center justify-center text-[#00a884] shadow-xl border border-[#222d35]/80">
                <Speech className="w-10 h-10" />
              </div>
              
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-bold text-[#e9edef] tracking-widest font-sans">mboaTalk</h3>
                <p className="text-xs text-[#8696a0] leading-relaxed font-sans px-4">
                  {t('chat_empty')}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00a884]/15 border border-[#00a884]/25 rounded-xl text-[10px] text-[#00a884] font-bold font-mono tracking-wide">
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <span>{t('chat_encrypted')}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
