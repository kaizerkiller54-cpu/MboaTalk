import React, { useState } from 'react';
import { Lock, Shield, Delete, Eye, EyeOff, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../i18n/LanguageContext';

interface PinCodeAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinCodeAuth({ onSuccess, onCancel }: PinCodeAuthProps) {
  const { t } = useLang();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  
  const CORRECT_PIN = '1234';

  const handleKeyPress = async (num: string) => {
    if (pin.length < 4) {
      const newVal = pin + num;
      setPin(newVal);
      setErrorMsg('');

      // Validate if reached 4 digits
      if (newVal.length === 4) {
        try {
          await api.verifyWalletPin(newVal);
          setTimeout(() => {
            onSuccess();
          }, 300);
        } catch (err: any) {
          setErrorMsg(err.message || t('pin_error'));
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[70vh] py-6 px-4 rounded-3xl text-white max-w-md mx-auto relative" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-3xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full text-center space-y-2 mt-2 relative z-10">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{t('pin_title')}</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          {t('pin_desc')}
        </p>
        <div className="inline-block mt-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-[10px] text-yellow-400 font-mono">
          {t('pin_hint')} <span className="font-bold underline">{CORRECT_PIN}</span>
        </div>
      </div>

      {/* Display Dots representing pin code entry */}
      <div className="my-8 relative z-10 flex flex-col items-center">
        <div className="flex justify-center gap-4 mb-4">
          {[0, 1, 2, 3].map((index) => {
            const hasValue = pin.length > index;
            return (
              <motion.div
                key={index}
                animate={{ 
                  scale: hasValue ? 1.2 : 1,
                  backgroundColor: hasValue ? '#10b981' : '#334155',
                  boxShadow: hasValue ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
                }}
                className={`w-4 h-4 rounded-full transition-all duration-150`}
              />
            );
          })}
        </div>

        {/* Display clear text pin indicator optionally */}
        <div className="h-6 text-sm font-mono text-slate-400 flex items-center justify-center gap-1.5">
          {showPin ? (
            <span>{pin || '____'}</span>
          ) : (
            <span>{pin.replace(/./g, '●') || ''}</span>
          )}
          {pin.length > 0 && (
            <button 
              onClick={() => setShowPin(!showPin)}
              className="text-slate-500 hover:text-slate-300 ml-1 p-0.5"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 mt-2 text-center"
          >
            {errorMsg}
          </motion.p>
        )}
      </div>

      {/* Numerical Keyboard Grid */}
      <div className="grid grid-cols-3 gap-y-3.5 gap-x-6 w-full max-w-[280px] mb-6 relative z-10 font-sans">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num)}
            className="w-16 h-16 rounded-full transition text-lg font-bold flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {num}
          </button>
        ))}

        {/* Asterisk / Swift login simulation button */}
        <button
          onClick={async () => {
            try {
              await api.verifyWalletPin(CORRECT_PIN);
              setPin(CORRECT_PIN);
              setTimeout(() => onSuccess(), 250);
            } catch (err: any) {
              setErrorMsg(err.message || 'Erreur de code PIN');
            }
          }}
          title="Remplissage rapide de test"
          className="w-16 h-16 rounded-full transition text-xs font-semibold flex flex-col items-center justify-center cursor-pointer text-amber-400"
          style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(217,119,6,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(217,119,6,0.15)'}
        >
          <KeyRound className="w-4 h-4 mb-0.5" />
          <span>Auto</span>
        </button>

        {/* Zero */}
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full transition text-lg font-bold flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          0
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full transition text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Shield Info and cancel */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-mono pt-4 border-t border-slate-800 px-2 mt-2">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>{t('pin_security')}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition font-sans underline"
        >
          {t('pin_cancel')}
        </button>
      </div>

    </div>
  );
}
