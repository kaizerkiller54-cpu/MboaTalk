import React, { useState, useRef, useEffect } from 'react';
import { 
  INITIAL_CONTACTS, 
  INITIAL_STORIES, 
  CHANNEL_SUGGESTIONS, 
  INITIAL_GROUPS, 
  INITIAL_INVITATIONS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_CHATS, 
  INITIAL_TRANSACTIONS 
} from './data';
import { Contact, Story, Channel, Group, GroupInvitation, Notification, Chat, Transaction } from './types';
import { api } from './services/api';
import { tokenStore } from './services/client';
import PhoneLoginAuth from './components/PhoneLoginAuth';
import PinCodeAuth from './components/PinCodeAuth';
import CallModal from './components/CallModal';
import ActualitesTab from './components/ActualitesTab';
import GroupesTab from './components/GroupesTab';
import DiscussionsTab from './components/DiscussionsTab';
import PortefeuilleTab from './components/PortefeuilleTab';
import SettingsModal from './components/SettingsModal';
import PhoneMoneyLogo from './components/PhoneMoneyLogo';
import { 
  MessageSquare, 
  Rss, 
  Users, 
  Wallet, 
  LogOut, 
  ShieldCheck, 
  Bell, 
  Lock,
  PhoneCall,
  Sliders,
  User,
  Sun,
  Moon,
  Search,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from './i18n/LanguageContext';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : true
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { t, lang, setLang } = useLang();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('securconnect_theme') as 'light' | 'dark') || 'dark';
  });
  const isLight = theme === 'light';

  const [isBiometricsVerified, setIsBiometricsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'actualites' | 'groupes' | 'discussions' | 'portefeuille' | 'compte'>('discussions');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isWalletUnlocked, setIsWalletUnlocked] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [channels, setChannels] = useState<Channel[]>(CHANNEL_SUGGESTIONS);
  const [invitations, setInvitations] = useState<GroupInvitation[]>(INITIAL_INVITATIONS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [balance, setBalance] = useState<number>(450.00);

  useEffect(() => {
    const savedPhone = localStorage.getItem('securconnect_user_phone');
    const hasToken = Boolean(tokenStore.getAccess() || tokenStore.getRefresh());
    if (savedPhone && hasToken) {
      setIsBiometricsVerified(true);
    }
  }, []);

  useEffect(() => {
    if (isBiometricsVerified) {
      api.getState().then(res => {
        if (res.success && res.user) {
          const u = res.user;
          setContacts(u.contacts);
          setGroups(u.groups);
          setChats(u.chats);
          setStories(u.stories);
          setChannels(u.channels);
          setInvitations(u.invitations);
          setNotifications(u.notifications);
          setTransactions(u.transactions);
          setBalance(u.balance);
          localStorage.setItem('securconnect_has_referred', String(u.hasReferred));
          localStorage.setItem('securconnect_referral_count', String(u.referralCount));
          localStorage.setItem('securconnect_referral_earnings', String(u.referralEarnings));
        }
      }).catch(err => {
        console.error('Failed to load user state from API:', err);
      });
    }
  }, [isBiometricsVerified]);

  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    callerName: string;
    callerAvatar?: string;
    type: 'audio' | 'video';
    isGroup?: boolean;
  }>({
    isOpen: false,
    callerName: '',
    callerAvatar: '',
    type: 'audio',
    isGroup: false
  });

  const [prefilledContactName, setPrefilledContactName] = useState<string | null>(null);

  const handleTransferSuccess = (contactName: string, amount: number) => {
    const matchedContact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
    if (matchedContact) {
      const matchedChat = chats.find(ch => ch.contactId === matchedContact.id);
      if (matchedChat) {
        const newMsg = {
          id: `tx_auto_msg_${Date.now()}`,
          senderId: 'me',
          type: 'document' as const,
          text: `Transfert de ${amount.toFixed(2)} € effectué avec succès !`,
          fileName: `Reçu_Transfert_${amount.toFixed(0)}€.pdf`,
          fileUrl: '',
          fileSize: '1.2 Kb',
          timestamp: new Date().toISOString()
        };
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === matchedChat.id) {
            return {
              ...chat,
              messages: [...chat.messages, newMsg],
              recentMessage: `Transfert de ${amount.toFixed(2)} € Réussi`,
              lastActive: new Date().toISOString()
            };
          }
          return chat;
        }));
      }
    }
  };

  const handleStartCall = (name: string, avatar: string, type: 'audio' | 'video', isGroup: boolean = false) => {
    setActiveCall({
      isOpen: true,
      callerName: name,
      callerAvatar: avatar,
      type: type,
      isGroup: isGroup
    });
  };

  const handleTabChange = (tab: 'actualites' | 'groupes' | 'discussions' | 'portefeuille' | 'compte') => {
    if (tab === 'portefeuille') {
      const pinRequired = localStorage.getItem('securconnect_wallet_pin_required') !== 'false';
      if (!pinRequired) {
        setIsWalletUnlocked(true);
      }
      setActiveTab('portefeuille');
    } else {
      setIsWalletUnlocked(false);
      setActiveTab(tab);
    }
  };

  const handleLogOut = () => {
    api.logout();
    localStorage.removeItem('securconnect_user_phone');
    localStorage.removeItem('securconnect_user_email');
    setIsBiometricsVerified(false);
    setIsWalletUnlocked(false);
    setActiveTab('discussions');
  };

  const unreadTotal = chats.reduce((acc, c) => acc + c.unreadCount, 0);
  const pendingInvitations = invitations.some(i => i.status === 'pending');
  const unreadNotifications = notifications.some(n => !n.isRead);

  const sidebarTabs = [
    { id: 'actualites' as const, label: t('nav_news'), icon: Rss, badge: '24h', badgeColor: 'text-sky-400 bg-sky-500/10', activeColor: 'text-[#0A84FF] bg-blue-600/10 border-blue-500/20' },
    { id: 'groupes' as const, label: t('nav_groups'), icon: Users, badge: pendingInvitations ? 'dot' : null, badgeColor: 'bg-yellow-500', activeColor: 'text-[#0A84FF] bg-blue-600/10 border-blue-500/20' },
    { id: 'discussions' as const, label: t('nav_chats'), icon: MessageSquare, badge: unreadTotal > 0 ? unreadTotal : null, badgeColor: 'bg-[#25D366] text-[#121212]', activeColor: 'text-[#0A84FF] bg-blue-600/10 border-blue-500/20' },
    { id: 'portefeuille' as const, label: t('nav_wallet'), icon: Wallet, badge: !isWalletUnlocked ? 'lock' : null, badgeColor: '', activeColor: 'text-[#25D366] bg-emerald-600/10 border-emerald-500/20' },
    { id: 'compte' as const, label: t('nav_account'), icon: User, badge: null, badgeColor: '', activeColor: 'text-[#0A84FF] bg-blue-600/10 border-blue-500/20' },
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        {!isBiometricsVerified && (
          <motion.div
            key="phone_auth_screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <PhoneLoginAuth 
              onSuccess={() => setIsBiometricsVerified(true)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isBiometricsVerified && (
        <div className={`min-h-screen h-screen flex flex-col transition-colors duration-300 selection:bg-emerald-500/30 selection:text-emerald-100 font-sans antialiased overflow-hidden ${
          isLight ? 'light-theme mboa-ambient-light text-slate-900' : 'mboa-ambient-dark text-slate-100'
        }`}>
          <div className="flex h-screen w-full overflow-hidden flex-1">
          {/* Sidebar - Desktop */}
          <aside className={`hidden md:flex w-64 lg:w-72 flex-col shrink-0 relative overflow-y-auto no-scrollbar glass-panel ${isLight ? '' : ''}`}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00a884] to-[#25d366]" />
            
            <div className="flex flex-col flex-grow p-3 gap-2">
              <div className={`flex items-center gap-3 pb-4 mb-2 px-1 ${isLight ? 'border-b border-gray-200' : 'border-b border-[#222d35]'}`}>
                <PhoneMoneyLogo size="sm" animate={true} />
                <div className="text-left">
                  <h1 className="text-sm font-black tracking-wide text-white">mboaTalk</h1>
                  <span className="text-[8px] font-semibold text-[#8696a0] font-mono tracking-wider uppercase">{t('nav_tagline')}</span>
                </div>
              </div>

              <nav className="space-y-0.5 flex-grow">
                {sidebarTabs.map(tab => (
                    <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? `${tab.activeColor} font-bold`
                        : `${isLight ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5'}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm leading-none">{tab.label}</span>
                    </div>
                    {tab.badge === '24h' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase text-[#00a884] bg-[#00a884]/10">24h</span>
                    )}
                    {tab.badge === 'dot' && (
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center ${isLight ? 'bg-[#25D366] text-white' : 'bg-[#25D366] text-[#111b21]'}`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.badge === 'lock' && (
                      <Lock className="w-3 h-3 text-yellow-400" />
                    )}
                  </button>
                ))}
              </nav>

              <div className={`mt-auto p-3 rounded-lg flex items-center justify-between mboa-card ${isLight ? '' : ''}`}>
                <div>
                  <span className={`text-[9px] uppercase font-bold font-mono block tracking-wider ${isLight ? 'text-gray-500' : 'text-[#8696a0]'}`}>{t('nav_balance')}</span>
                  <span className="text-sm font-bold text-[#00a884] font-mono">{balance.toFixed(2)} €</span>
                </div>
                <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />
              </div>
            </div>

            <div className={`p-3 space-y-2 shrink-0 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const nextTh = theme === 'light' ? 'dark' : 'light';
                    setTheme(nextTh);
                    localStorage.setItem('securconnect_theme', nextTh);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'}`}
                >
                  {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>{isLight ? t('nav_dark') : t('nav_light')}</span>
                </button>

                <button
                  onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                  className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-mono">{lang === 'fr' ? 'EN' : 'FR'}</span>
                </button>
              </div>

              <button
                onClick={handleLogOut}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-500' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-red-400'}`}
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav_lock')}</span>
              </button>
            </div>
          </aside>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col min-w-0 relative h-full">
            {/* Header */}
            <header className={`sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shrink-0 modern-header`}>
              <div className="flex items-center gap-2.5">
                <PhoneMoneyLogo size="sm" animate={true} />
                <div className="text-left">
                  <h1 className="text-base font-black tracking-wide text-white">mboaTalk</h1>
                  <span className="text-[9px] font-medium text-[#aed9d9] font-mono tracking-wider uppercase">{t('nav_tagline')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative cursor-pointer" onClick={() => handleTabChange('groupes')}>
                  <Bell className="w-5 h-5 text-white/80 hover:text-white transition" />
                  {unreadNotifications && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <button 
                  onClick={handleLogOut}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{t('nav_lock')}</span>
                </button>
              </div>
            </header>

            {/* Content */}
            <main className={`flex-1 overflow-y-auto min-h-0 ambient-glow ${isLight ? 'bg-[#efeae2]' : 'whatsapp-bg'}`}>
              <div className="h-full w-full">
                <AnimatePresence mode="wait">
                  {activeTab === 'actualites' && (
                    <motion.div
                      key="actualites"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ActualitesTab 
                        stories={stories} 
                        setStories={setStories} 
                        channels={channels} 
                        setChannels={setChannels}
                        contacts={contacts}
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'groupes' && (
                    <motion.div
                      key="groupes"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <GroupesTab 
                        groups={groups} 
                        setGroups={setGroups}
                        invitations={invitations} 
                        setInvitations={setInvitations}
                        notifications={notifications}
                        setNotifications={setNotifications}
                        onStartGroupCall={(gName, type) => handleStartCall(gName, '', type, true)}
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'discussions' && (
                    <motion.div
                      key="discussions"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <DiscussionsTab 
                        chats={chats} 
                        setChats={setChats} 
                        contacts={contacts} 
                        groups={groups}
                        stories={stories}
                        setStories={setStories}
                        onStartCall={handleStartCall}
                        onSendMoneyClick={(contactName) => {
                          setPrefilledContactName(contactName);
                          handleTabChange('portefeuille');
                        }}
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'portefeuille' && (
                    <motion.div
                      key="portefeuille"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {!isWalletUnlocked ? (
                        <div className="h-full flex items-center justify-center">
                          <PinCodeAuth 
                            onSuccess={() => setIsWalletUnlocked(true)} 
                            onCancel={() => handleTabChange('discussions')}
                          />
                        </div>
                      ) : (
                        <PortefeuilleTab 
                          contacts={contacts} 
                          setContacts={setContacts}
                          transactions={transactions} 
                          setTransactions={setTransactions} 
                          balance={balance} 
                          setBalance={setBalance}
                          setNotifications={setNotifications}
                          prefilledContactName={prefilledContactName}
                          clearPrefilledContactName={() => setPrefilledContactName(null)}
                          onTransferSuccess={handleTransferSuccess}
                          isMobile={isMobile}
                        />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'compte' && (
                    <motion.div
                      key="compte"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <SettingsModal
                        isOpen={true}
                        onClose={() => {}}
                        setNotifications={setNotifications}
                        theme={theme}
                        setTheme={setTheme}
                        isInline={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>

            {/* Bottom Tabs - Mobile */}
            <footer className={`flex md:hidden py-1 shrink-0 glass-footer`}>
              {[
                { id: 'actualites' as const, label: t('nav_news'), icon: Rss },
                { id: 'groupes' as const, label: t('nav_groups'), icon: Users },
                { id: 'discussions' as const, label: t('nav_chats'), icon: MessageSquare },
                { id: 'portefeuille' as const, label: t('nav_wallet'), icon: Wallet },
                { id: 'compte' as const, label: t('nav_account_short'), icon: User },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-1 transition relative ${
                    activeTab === tab.id ? 'text-white scale-105' : 'text-[#aed9d9] hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="active_tab" className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-white rounded-full" />
                  )}
                  {tab.id === 'discussions' && unreadTotal > 0 && (
                    <span className="absolute top-0.5 right-1/4 w-4 h-4 bg-[#25D366] text-[#075e54] text-[8px] font-bold rounded-full flex items-center justify-center">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                  {tab.id === 'groupes' && pendingInvitations && (
                    <span className="absolute top-1 right-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  )}
                </button>
              ))}
            </footer>

            <CallModal
              isOpen={activeCall.isOpen}
              onClose={() => setActiveCall(p => ({ ...p, isOpen: false }))}
              callerName={activeCall.callerName}
              callerAvatar={activeCall.callerAvatar}
              type={activeCall.type}
              isGroupCall={activeCall.isGroup}
            />
          </div>
          </div>
        </div>
      )}
    </>
  );
}
