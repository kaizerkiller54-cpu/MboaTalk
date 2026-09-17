import React, { useState } from 'react';
import { CheckCircle2, Cookie, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../i18n/LanguageContext';
import PhoneMoneyLogo from './PhoneMoneyLogo';

interface CookieConsentModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function CookieConsentModal({ isOpen, onComplete }: CookieConsentModalProps) {
  const { t } = useLang();
  const [view, setView] = useState<'ask' | 'thanks'>('ask');

  const handleChoose = (choice: 'accepted' | 'refused') => {
    localStorage.setItem('mboatalk_consent', choice);
    setView('thanks');
    setTimeout(() => {
      setView('ask');
      onComplete();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/95 text-white p-4 md:p-6 font-sans flex items-center justify-center no-scrollbar">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14)_0,rgba(56,189,248,0.06)_50%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
          <AnimatePresence mode="wait">
            {view === 'ask' ? (
              <motion.div
                key="ask"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center">
                    <Cookie className="w-8 h-8 text-[#00a884]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-lg font-black tracking-wide text-[#e9edef]">{t('consent_title')}</h2>
                  <p className="text-xs text-[#8696a0] leading-relaxed">{t('consent_desc')}</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/25 rounded-full text-[10px] text-sky-400 font-extrabold font-mono tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  CONFIDENTIALITÉ MBOATALK
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleChoose('refused')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[#e9edef] transition-all"
                  >
                    {t('consent_refuse')}
                  </button>
                  <button
                    onClick={() => handleChoose('accepted')}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#00a884] hover:bg-[#06846d] text-white shadow-lg shadow-[#00a884]/20 transition-all"
                  >
                    {t('consent_accept')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                <h2 className="text-lg font-black tracking-wide text-[#e9edef]">{t('consent_thanks')}</h2>
                <p className="text-xs text-[#8696a0]">{t('consent_continue')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}