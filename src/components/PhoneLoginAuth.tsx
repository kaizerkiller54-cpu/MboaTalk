import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, Mail, Lock, Eye, EyeOff, Sparkles, User, MessageSquare, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhoneMoneyLogo from './PhoneMoneyLogo';
import { api } from '../services/api';
import { useLang } from '../i18n/LanguageContext';
import { Lang } from '../i18n/translations';

interface PhoneLoginAuthProps {
  onSuccess: () => void;
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$!%&*?+-=';

  const all = upper + lower + digits + symbols;

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

  let pwd = '';
  // Guarantee at least one from each group
  pwd += pick(upper) + pick(upper);
  pwd += pick(lower) + pick(lower);
  pwd += pick(digits) + pick(digits);
  pwd += pick(symbols) + pick(symbols);

  for (let i = pwd.length; i < 20; i++) pwd += pick(all);

  // Shuffle (Fisher-Yates)
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd;
}

const featureIcons = [MessageSquare, Zap, Globe] as const;

export default function PhoneLoginAuth({ onSuccess }: PhoneLoginAuthProps) {
  const { lang, setLang, t } = useLang();
  const savedEmail = localStorage.getItem('securconnect_user_email') || '';

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [emailAddress, setEmailAddress] = useState(savedEmail);
  const [errorMessage, setErrorMessage] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setErrorMessage(t('auth_error_email'));
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage(t('auth_error_password_min'));
      return;
    }
    setErrorMessage('');
    setIsLoggingIn(true);
    try {
      const res = await api.login(emailAddress, password);
      if (res.success && res.user) {
        localStorage.setItem('securconnect_user_phone', res.user.phone);
        localStorage.setItem('securconnect_user_email', res.user.email);
        const overlay = document.getElementById('success-unlock-overlay');
        if (overlay) {
          overlay.classList.remove('opacity-0', 'pointer-events-none');
          overlay.classList.add('opacity-100');
        }
        setTimeout(() => onSuccess(), 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('auth_error_login'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setErrorMessage(t('auth_error_email'));
      return;
    }
    if (!registerPassword || registerPassword.length < 4) {
      setErrorMessage(t('auth_error_password_short'));
      return;
    }
    if (registerPassword !== confirmPassword) {
      setErrorMessage(t('auth_error_password_match'));
      return;
    }
    setErrorMessage('');
    setIsRegistering(true);
    try {
      const res = await api.register(emailAddress, registerPassword, registerName);
      if (res.success && res.user) {
        localStorage.setItem('securconnect_user_phone', res.user.phone);
        localStorage.setItem('securconnect_user_email', res.user.email);
        const overlay = document.getElementById('success-unlock-overlay');
        if (overlay) {
          overlay.classList.remove('opacity-0', 'pointer-events-none');
          overlay.classList.add('opacity-100');
        }
        setTimeout(() => onSuccess(), 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('auth_error_register'));
    } finally {
      setIsRegistering(false);
    }
  };

  const features = [
    { icon: featureIcons[0], label: t('auth_feature_encrypted') },
    { icon: featureIcons[1], label: t('auth_feature_transfers') },
    { icon: featureIcons[2], label: t('auth_feature_noborder') },
  ];

  return (
    <div className="absolute inset-0 z-40 overflow-hidden text-white font-sans flex"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #0b141a 100%)' }}>
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.10)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.06)_0%,transparent_50%)] pointer-events-none" />

      {/* Language toggle — top right */}
      <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
        className="absolute top-5 right-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md text-xs font-bold text-slate-300 hover:bg-white/[0.1] transition-all cursor-pointer">
        <Globe className="w-3.5 h-3.5" />
        <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
      </button>

      {/* SUCCESS OVERLAY */}
      <div id="success-unlock-overlay"
        className="absolute inset-0 bg-[#121212] z-50 flex flex-col items-center justify-center opacity-0 pointer-events-none transition-all duration-700 ease-in-out">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 mb-6">
          <ShieldCheck className="w-16 h-16" />
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black tracking-widest text-emerald-400 uppercase">{t('auth_success')}</motion.h3>
        <p className="text-sm text-slate-500 mt-2 font-mono">{t('auth_access')}</p>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex w-full h-full">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          className="w-[42%] h-full flex flex-col items-center justify-center relative p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-teal-900/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            <PhoneMoneyLogo size="xl" animate={true} className="mb-6" />
            <h1 className="text-4xl font-black tracking-[0.15em] uppercase mb-3 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              mboaTalk
            </h1>
            <p className="text-slate-400 text-sm font-semibold mb-10 leading-relaxed">
              {t('auth_brand_desc')}
            </p>
            <div className="space-y-4 w-full">
              {features.map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-300">{f.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-12 flex items-center gap-3 text-[10px] text-slate-600 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('auth_badge_security')}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 h-full flex items-center justify-center p-8 lg:p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-bl from-emerald-900/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 w-full max-w-md">
            <AuthForm
              tab={tab} setTab={setTab} errorMessage={errorMessage} t={t}
              emailAddress={emailAddress} setEmailAddress={setEmailAddress}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              isLoggingIn={isLoggingIn} handleLogin={handleLogin}
              registerName={registerName} setRegisterName={setRegisterName}
              registerPassword={registerPassword} setRegisterPassword={setRegisterPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showRegisterPassword={showRegisterPassword} setShowRegisterPassword={setShowRegisterPassword}
              isRegistering={isRegistering} handleRegister={handleRegister}
            />
          </div>
        </motion.div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden w-full h-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md mx-auto flex flex-col px-5 py-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-6">
            <PhoneMoneyLogo size="lg" animate={true} className="mb-3" />
            <h1 className="text-2xl font-black tracking-[0.12em] uppercase bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              mboaTalk
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">{t('auth_brand_mobile')}</p>
          </motion.div>

          <AuthForm
            tab={tab} setTab={setTab} errorMessage={errorMessage} t={t}
            emailAddress={emailAddress} setEmailAddress={setEmailAddress}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            isLoggingIn={isLoggingIn} handleLogin={handleLogin}
            registerName={registerName} setRegisterName={setRegisterName}
            registerPassword={registerPassword} setRegisterPassword={setRegisterPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            showRegisterPassword={showRegisterPassword} setShowRegisterPassword={setShowRegisterPassword}
            isRegistering={isRegistering} handleRegister={handleRegister}
          />

          <div className="flex items-center justify-center gap-2 mt-8 text-[9px] text-slate-600 font-mono pb-4">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>{t('auth_badge_encrypted')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Auth Form ───────────────── */
function AuthForm({
  tab, setTab, errorMessage, t, emailAddress, setEmailAddress, password, setPassword,
  showPassword, setShowPassword, isLoggingIn, handleLogin,
  registerName, setRegisterName, registerPassword, setRegisterPassword,
  confirmPassword, setConfirmPassword, showRegisterPassword, setShowRegisterPassword,
  isRegistering, handleRegister,
}: {
  tab: 'login' | 'register'; setTab: (t: 'login' | 'register') => void; errorMessage: string;
  t: (key: any) => string;
  emailAddress: string; setEmailAddress: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  isLoggingIn: boolean; handleLogin: () => void;
  registerName: string; setRegisterName: (v: string) => void;
  registerPassword: string; setRegisterPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showRegisterPassword: boolean; setShowRegisterPassword: (v: boolean) => void;
  isRegistering: boolean; handleRegister: () => void;
}) {
  const inputBase = 'w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200';
  const inputIcon = 'absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-600 group-focus-within:text-emerald-400 transition-colors duration-200';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full rounded-2xl p-6 sm:p-8"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Tabs */}
      <div className="flex mb-8 rounded-xl p-1 bg-slate-950/50 border border-slate-800/40">
        {(['login', 'register'] as const).map(t_ => (
          <button key={t_} onClick={() => setTab(t_)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer ${
              tab === t_
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t_ === 'login' ? t('auth_tab_login') : t('auth_tab_register')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-white mb-1 tracking-wide">
              {tab === 'login' ? t('auth_welcome') : t('auth_create')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {tab === 'login' ? t('auth_login_subtitle') : t('auth_register_subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">{t('auth_email')}</label>
              <div className="relative group">
                <Mail className={inputIcon} />
                <input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)}
                  className={inputBase} placeholder={t('auth_email_placeholder')} />
              </div>
            </div>

            {tab === 'login' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">{t('auth_password')}</label>
                <div className="relative group">
                  <Lock className={inputIcon} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className={inputBase + ' pr-11'} placeholder={t('auth_password_placeholder')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-600 hover:text-emerald-400 transition cursor-pointer">
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-1 px-1">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <button type="button" onClick={() => setPassword(generatePassword())}
                    className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 cursor-pointer whitespace-nowrap">
                    {t('auth_generate')}
                  </button>
                </div>
              </div>
            )}

            {tab === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">{t('auth_name')}</label>
                  <div className="relative group">
                    <User className={inputIcon} />
                    <input type="text" value={registerName} onChange={e => setRegisterName(e.target.value)}
                      className={inputBase} placeholder={t('auth_name_placeholder')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">{t('auth_password')}</label>
                  <div className="relative group">
                    <Lock className={inputIcon} />
                    <input type={showRegisterPassword ? 'text' : 'password'} value={registerPassword} onChange={e => setRegisterPassword(e.target.value)}
                      className={inputBase + ' pr-11'} placeholder={t('auth_register_password_placeholder')} />
                    <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3.5 top-3 text-slate-600 hover:text-emerald-400 transition cursor-pointer">
                      {showRegisterPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">{t('auth_confirm_password')}</label>
                  <div className="relative group">
                    <Lock className={inputIcon} />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className={inputBase} placeholder={t('auth_confirm_placeholder')} />
                  </div>
                </div>
              </>
            )}

            {errorMessage && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] text-rose-400 font-semibold text-center bg-rose-500/10 border border-rose-500/20 rounded-lg py-2">
                {errorMessage}
              </motion.p>
            )}

            <button type="button"
              onClick={tab === 'login' ? handleLogin : handleRegister}
              disabled={isLoggingIn || isRegistering}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-extrabold rounded-xl text-xs transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 disabled:shadow-none">
              {(isLoggingIn || isRegistering) ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>{tab === 'login' ? t('auth_btn_logging') : t('auth_btn_registering')}</span></>
              ) : (
                <><span>{tab === 'login' ? t('auth_btn_login') : t('auth_btn_register')}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-[9px] text-slate-600 font-mono">
        <span>{t('auth_footer_secure')}</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>{t('auth_footer_encrypted')}</span>
        </div>
      </div>
    </motion.div>
  );
}
