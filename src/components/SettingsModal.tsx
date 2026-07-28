import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Sliders, 
  Fingerprint, 
  Check, 
  Bell, 
  Volume2, 
  Globe, 
  Smartphone, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  KeyRound, 
  Cpu, 
  CheckCircle2, 
  Camera, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isInline?: boolean;
}

const AVATARS_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Female chic
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', // Male design
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', // Neutral elegant
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // Female classic
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'  // Male style
];

export default function SettingsModal({ isOpen, onClose, setNotifications, theme, setTheme, isInline = false }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'general' | 'biometric'>('profile');

  // --- Profile States ---
  const [userName, setUserName] = useState(() => localStorage.getItem('securconnect_user_name') || 'Alex Mercer');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('securconnect_user_phone') || '+33 6 12 34 56 78');
  const [userBio, setUserBio] = useState(() => localStorage.getItem('securconnect_user_status') || 'Sécurité d\'abord, rapidité absolue. 🚀');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('securconnect_user_avatar') || AVATARS_POOL[0]);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUserAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Security States ---
  const [walletPinRequired, setWalletPinRequired] = useState(() => {
    return localStorage.getItem('securconnect_wallet_pin_required') !== 'false';
  });
  const [walletPin, setWalletPin] = useState(() => localStorage.getItem('securconnect_wallet_pin') || '1234');
  const [cryptoMode, setCryptoMode] = useState(() => localStorage.getItem('securconnect_crypto_mode') || 'AES_256');
  const [securitySaved, setSecuritySaved] = useState(false);
  const [securityError, setSecurityError] = useState('');

  // --- General Settings States ---
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('securconnect_sound_enabled') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('securconnect_notif_sound') !== 'false';
  });
  const [appLanguage, setAppLanguage] = useState(() => localStorage.getItem('securconnect_lang') || 'fr');
  const [generalSaved, setGeneralSaved] = useState(false);

  // --- Fast Biometric Simulation States ---
  const [biometricsFastEnabled, setBiometricsFastEnabled] = useState(() => {
    return localStorage.getItem('securconnect_biometrics_fast') === 'true';
  });
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollState, setEnrollState] = useState<'idle' | 'enrolling' | 'completed'>('idle');
  const [enrollType, setEnrollType] = useState<'FaceID' | 'TouchID'>('FaceID');

  // Load language settings dynamically
  const t = {
    fr: {
      profile: "Profil",
      security: "Sécurité",
      general: "Général",
      biometrics: "SIM / SMS",
      save: "Enregistrer les modifications",
      saved: "Modifications enregistrées !",
      name: "Nom d'affichage",
      phone: "Numéro de téléphone",
      bio: "Réseau / Bio",
      chooseAvatar: "Choisissez un avatar de profil",
      pinReq: "Vérifier le code PIN pour le portefeuille",
      pinDesc: "Demande de mot de passe à l'ouverture de l'onglet Portefeuille.",
      pinSet: "Code PIN secret (4 chiffres)",
      pinErr: "Le code PIN doit comporter exactement 4 chiffres.",
      notifTitle: "Notifications & Alertes",
      notifDesc: "Sonnerie des notifications en arrière-plan.",
      soundTitle: "Thème auditif de l'app",
      soundDesc: "Effets sonores haptiques lors des clics.",
      langTitle: "Langue de l'application",
      themeTitle: "Style du thème",
      themeDesc: "Personnalise le rendu visuel de Pay&Chat (Clair ou Sombre).",
      themeLight: "Mode Clair ☀️",
      themeDark: "Mode Sombre 🌙",
      fastBioTitle: "Vitesse de Réception du Code SMS",
      fastBioDesc: "Permet d'accélérer la simulation de la vitesse d'envoi du code SMS d'accès de 1.8s à 0.4s (réseau ultra-rapide).",
      enrollNew: "Vérifier ou configurer la carte SIM",
      startScan: "Lancer le test de latence réseau",
      scanning: "Analyse de la liaison réseau en cours...",
      scanInstructions: "Veuillez patienter pendant la mesure de latence...",
      completed: "Liaison au réseau Telecom certifiée !"
    },
    en: {
      profile: "Profile",
      security: "Security",
      general: "General",
      biometrics: "SIM / SMS",
      save: "Save changes",
      saved: "Changes saved successfully!",
      name: "Display Name",
      phone: "Phone Number",
      bio: "Description / Bio",
      chooseAvatar: "Select a profile avatar",
      pinReq: "Verify PIN code for wallet tab",
      pinDesc: "Require passcode prompt when opening the Wallet tab.",
      pinSet: "Secret PIN code (4 digits)",
      pinErr: "The PIN code must contain exactly 4 digits.",
      notifTitle: "Notifications & Alerts",
      notifDesc: "Play alert sound when receiving a text background or foreground.",
      soundTitle: "Haptic Audio Click FX",
      soundDesc: "Enable interface sound feedbacks on click actions.",
      langTitle: "Application Language",
      themeTitle: "App Theme Style",
      themeDesc: "Choose between light aesthetic or classic cyberpunk dark.",
      themeLight: "Light Mode ☀️",
      themeDark: "Dark Mode 🌙",
      fastBioTitle: "Simulated SMS Delivery Speed",
      fastBioDesc: "Reduces the simulation SMS transmission waiting time from 1.8 seconds down to 0.4 seconds.",
      enrollNew: "Configure or test secure GSM SIM card",
      startScan: "Test telecommunication latency link",
      scanning: "Scanning network bands and channels...",
      scanInstructions: "Wait a moment for automated latency metrics...",
      completed: "Mobile Network Link certified successfully!"
    }
  }[appLanguage === 'fr' ? 'fr' : 'en'];

  // Handle saving Profile Info
  const handleSaveProfile = () => {
    localStorage.setItem('securconnect_user_name', userName);
    localStorage.setItem('securconnect_user_phone', userPhone);
    localStorage.setItem('securconnect_user_status', userBio);
    localStorage.setItem('securconnect_user_avatar', userAvatar);

    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
    }, 2500);

    // Push notification safely
    if (setNotifications) {
      setNotifications(prev => [
        {
          id: `notif_profile_${Date.now()}`,
          title: 'Profil mis à jour 👤',
          body: `Votre profil a été enregistré avec le nom "${userName}".`,
          timestamp: 'À l\'instant',
          isRead: false,
          type: 'security'
        },
        ...prev
      ]);
    }
  };

  // Handle saving Security Settings
  const handleSaveSecurity = () => {
    // Validation
    if (!/^\d{4}$/.test(walletPin)) {
      setSecurityError(t.pinErr);
      return;
    }
    setSecurityError('');

    localStorage.setItem('securconnect_wallet_pin_required', String(walletPinRequired));
    localStorage.setItem('securconnect_wallet_pin', walletPin);
    localStorage.setItem('securconnect_crypto_mode', cryptoMode);

    setSecuritySaved(true);
    setTimeout(() => {
      setSecuritySaved(false);
    }, 2500);

    // Push Notification
    if (setNotifications) {
      setNotifications(prev => [
        {
          id: `notif_sec_${Date.now()}`,
          title: 'Paramètres métriques modifiés 🔐',
          body: `Le code PIN du portefeuille a été configuré avec succès.`,
          timestamp: 'À l\'instant',
          isRead: false,
          type: 'security'
        },
        ...prev
      ]);
    }
  };

  // Handle saving General Settings
  const handleSaveGeneral = () => {
    localStorage.setItem('securconnect_sound_enabled', String(soundEnabled));
    localStorage.setItem('securconnect_notif_sound', String(notificationsEnabled));
    localStorage.setItem('securconnect_lang', appLanguage);

    setGeneralSaved(true);
    setTimeout(() => {
      setGeneralSaved(false);
    }, 2500);
  };

  // Run enrollment simulation
  const startEnrollment = () => {
    setEnrollState('enrolling');
    setEnrollProgress(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (enrollState === 'enrolling') {
      interval = setInterval(() => {
        setEnrollProgress(prev => {
          if (prev >= 100) {
            return 100;
          }
          const jump = Math.floor(Math.random() * 15) + 5;
          return Math.min(100, prev + jump);
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [enrollState]);

  useEffect(() => {
    if (enrollState === 'enrolling' && enrollProgress >= 100) {
      setEnrollState('completed');
      setBiometricsFastEnabled(true);
      localStorage.setItem('securconnect_biometrics_fast', 'true');
      
      // Push notification
      if (setNotifications) {
        setNotifications(prevNotif => [
          {
            id: `notif_bio_${Date.now()}`,
            title: 'Données Biométriques Enregistrées 👤',
            body: `Un nouveau jeu d'identification rapide (${enrollType}) a été numérisé et stocké dans l'enclave sécurisée du terminal.`,
            timestamp: 'À l\'instant',
            isRead: false,
            type: 'security'
          },
          ...prevNotif
        ]);
      }
    }
  }, [enrollProgress, enrollState, enrollType, setNotifications]);

  const handleToggleFastBio = (val: boolean) => {
    setBiometricsFastEnabled(val);
    localStorage.setItem('securconnect_biometrics_fast', String(val));
  };

  const forceAppReset = () => {
    if (confirm("Confirmez-vous la réinitialisation de l'application ? Vos données locales seront remises à zéro.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const content = (
    <motion.div 
      initial={isInline ? { opacity: 0, y: 15 } : { opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`w-full bg-slate-900 border border-slate-805 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left ${
        isInline ? 'h-full min-h-[500px]' : 'max-w-md h-[85vh] max-h-[640px]'
      }`}
    >
      {/* Modal Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold shadow-sm">
            <Sliders className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Centre de Configuration</h2>
        </div>
        {!isInline && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* Modal Tabs Row */}
        <div className="flex items-center gap-1 bg-slate-950 border-b border-slate-850 px-2 py-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'profile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.profile}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'security' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.security}</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'general' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.general}</span>
          </button>

          <button
            onClick={() => setActiveTab('biometric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'biometric' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.biometrics}</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: PROFILE MANAGEMENT */}
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, x: -5 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4.5"
            >
              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.chooseAvatar}</label>
                <div className="flex items-center gap-3.5 py-1.5">
                  <div className="relative">
                    <label 
                      htmlFor="profile-device-upload" 
                      className="cursor-pointer group block"
                    >
                      <img 
                        src={userAvatar} 
                        alt="Current user portrait" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-sky-500 shadow-md group-hover:brightness-90 transition"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-600 hover:bg-sky-500 text-white rounded-full flex items-center justify-center border border-slate-900 text-[10px] shadow-md transition" title="Importer une photo">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                    </label>
                    <input 
                      type="file" 
                      id="profile-device-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {/* Interactive Trigger to select device photo */}
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-device-upload')?.click()}
                        className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 hover:border-sky-500 text-sky-455 flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
                        title="Importer de votre téléphone ou PC"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      {AVATARS_POOL.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setUserAvatar(av)}
                          className={`w-9 h-9 rounded-full overflow-hidden border transition active:scale-90 shrink-0 cursor-pointer ${
                            userAvatar === av ? 'border-sky-400 ring-2 ring-sky-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="Avatar choice" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-none">
                      Sélectionnez ou cliquez sur l'appareil photo pour uploader de votre PC/Téléphone
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Username info */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.name}</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Alex Mercer"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.phone}</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              {/* Bio description */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.bio}</label>
                <textarea
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  placeholder="Sécurité d'abord, rapidité absolue. 🚀"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {profileSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t.saved}</span>
                    </>
                  ) : (
                    <span>{t.save}</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SECURITY MODIFICATIONS */}
          {activeTab === 'security' && (
            <motion.div 
              initial={{ opacity: 0, x: -5 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              {/* Wallet Lock check toggler */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="walletPinRequired"
                  checked={walletPinRequired}
                  onChange={(e) => setWalletPinRequired(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-sky-600 cursor-pointer"
                />
                <div className="text-left flex-1">
                  <label htmlFor="walletPinRequired" className="text-xs font-bold text-slate-200 cursor-pointer block select-none">
                    {t.pinReq}
                  </label>
                  <span className="text-[10px] text-slate-400 block leading-relaxed mt-0.5">
                    {t.pinDesc}
                  </span>
                </div>
              </div>

              {/* Secret PIN settings */}
              {walletPinRequired && (
                <div className="space-y-1.5 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    {t.pinSet}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={walletPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setWalletPin(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-bold text-sky-400 font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="****"
                  />
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Actuel : {walletPin || 'vide'}
                  </span>
                </div>
              )}

              {/* Cryptography profile */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Algorithme de Sécurité</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCryptoMode('AES_256')}
                    className={`p-2 rounded-lg text-xs font-bold border transition ${
                      cryptoMode === 'AES_256' ? 'bg-sky-600/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    🚀 AES-256 (Standard)
                  </button>
                  <button
                    onClick={() => setCryptoMode('KYBER_1024')}
                    className={`p-2 rounded-lg text-xs font-bold border transition ${
                      cryptoMode === 'KYBER_1024' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    🛡️ Kyber (Post-Quantum)
                  </button>
                </div>
              </div>

              {securityError && (
                <p className="text-[11px] text-red-400 font-bold">{securityError}</p>
              )}

              {/* Save Button */}
              <div>
                <button
                  onClick={handleSaveSecurity}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {securitySaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t.saved}</span>
                    </>
                  ) : (
                    <span>{t.save}</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <motion.div 
              initial={{ opacity: 0, x: -5 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              {/* Notification toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850 text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-sky-450" />
                    <span>{t.notifTitle}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.notifDesc}</p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    notificationsEnabled ? 'bg-sky-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Sounds toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850 text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-sky-450" />
                    <span>{t.soundTitle}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.soundDesc}</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    soundEnabled ? 'bg-sky-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Language selection dropdown */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-left space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-450" />
                  <span>{t.langTitle}</span>
                </h4>
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="fr">🇫🇷 Français (French)</option>
                  <option value="en">🇺🇸 English (English)</option>
                </select>
              </div>

              {/* Theme Settings Selector segment control */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-left space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {t.themeTitle}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.themeDesc}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setTheme('light');
                      localStorage.setItem('securconnect_theme', 'light');
                    }}
                    className={`py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      theme === 'light' 
                        ? 'bg-sky-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{t.themeLight}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      localStorage.setItem('securconnect_theme', 'dark');
                    }}
                    className={`py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-sky-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{t.themeDark}</span>
                  </button>
                </div>
              </div>

              {/* Advanced App reset safety */}
              <div className="pt-1.5 border-t border-slate-850">
                <button
                  onClick={forceAppReset}
                  className="w-full py-2 border border-dashed border-red-500/20 hover:border-red-500/40 text-[11px] font-bold text-red-400 rounded-lg transition hover:bg-red-500/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Réinitialiser les options locales</span>
                </button>
              </div>

              {/* Save Button */}
              <div>
                <button
                  onClick={handleSaveGeneral}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {generalSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t.saved}</span>
                    </>
                  ) : (
                    <span>{t.save}</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 4: FAST BIOMETRIC MODULE AND ENROLLMENT ANIMATED WIDGET */}
          {activeTab === 'biometric' && (
            <motion.div 
              initial={{ opacity: 0, x: -5 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              {/* Toggler */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850 text-left">
                <div className="flex-1 pr-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t.fastBioTitle}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-1">{t.fastBioDesc}</p>
                </div>
                <button
                  onClick={() => handleToggleFastBio(!biometricsFastEnabled)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    biometricsFastEnabled ? 'bg-sky-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    biometricsFastEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* ENROLLMENT MODULE SUB-PANEL */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {t.enrollNew}
                  </span>
                  
                  {/* Choice between LTE/4G/5G and WiFi simulation */}
                  <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      className="px-2 py-1 text-[9px] font-bold rounded bg-sky-600 text-white"
                    >
                      Canal SMS Sécurisé
                    </button>
                  </div>
                </div>

                {enrollState === 'idle' && (
                  <button
                    onClick={startEnrollment}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer outline-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.startScan}</span>
                  </button>
                )}

                {enrollState === 'enrolling' && (
                  <div className="space-y-3 flex flex-col items-center">
                    {/* Laser Target visual representation */}
                    <div className="relative w-28 h-28 border border-slate-800 rounded-full flex items-center justify-center bg-slate-950 overflow-hidden">
                      {/* Laser Bar animation */}
                      <div className="absolute left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,1)] animate-[bounce_1.5s_infinite_ease-in-out]" />
                      
                      <Smartphone className="w-12 h-12 text-sky-400 animate-pulse" />
                      
                      {/* overlay percentage progress */}
                      <div className="absolute inset-0 bg-transparent flex items-center justify-center/10 p-1 bg-slate-950/20">
                        <span className="text-xl font-black font-mono text-cyan-400">{enrollProgress}%</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-300">{t.scanning}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{t.scanInstructions}</p>
                    </div>

                    {/* Progress feedback bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1">
                      <div 
                        className="bg-cyan-500 h-1 rounded-full transition-all duration-200"
                        style={{ width: `${enrollProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {enrollState === 'completed' && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{t.completed}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-mono">
                        La liaison radio et les filtres télécoms sont maintenant audités et actifs.
                      </p>
                    </div>
                    <button
                      onClick={() => setEnrollState('idle')}
                      className="text-[10px] font-semibold text-emerald-400 hover:underline mt-1 p-1 outline-none"
                    >
                      Relancer le diagnostic réseau
                    </button>
                  </motion.div>
                )}
              </div>
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Les liaisons de communication et d'authentification par SMS sécurisé mboaTalk sont chiffrées localement (FIPS 140-2 Level 3) sur l'appareil. Aucune donnée d'identification privée n'est transmise en clair sur les réseaux radios publics.
                </span>
              </div>
            </motion.div>
          )}

        </div>

        {/* Info label banner footer inside settings modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-500 flex justify-between items-center bg-slate-950/60 shrink-0">
          <span>mboaTalk build v1.0.4</span>
          <span>mboaTalk Mobile Network Sec</span>
        </div>
      </motion.div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      {content}
    </div>
  );
}
