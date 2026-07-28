import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, Cpu, Smartphone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhoneMoneyLogo from './PhoneMoneyLogo';

interface BiometricAuthProps {
  onSuccess: () => void;
  userEmail: string;
}

export default function BiometricAuth({ onSuccess, userEmail }: BiometricAuthProps) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [statusText, setStatusText] = useState('Prêt pour la reconnaissance biométrique');
  const [isFaceID, setIsFaceID] = useState(true); // Toggle between Face ID and Touch ID

  useEffect(() => {
    // Automatically start scanning shortly after launch for speediness
    const timer = setTimeout(() => {
      startScanning();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const startScanning = () => {
    const isFast = localStorage.getItem('securconnect_biometrics_fast') === 'true';
    const scanDelay = isFast ? 400 : 1800;
    const successDelay = isFast ? 200 : 800;

    setScanState('scanning');
    setStatusText(isFaceID ? 'Analyse faciale 3D ultra-rapide...' : 'Lecture instantanée de l\'empreinte...');
    
    // Simulate successful scan
    setTimeout(() => {
      setScanState('success');
      setStatusText('Authentification biométrique vérifiée !');
      
      // Proceed to dashboard
      setTimeout(() => {
        onSuccess();
      }, successDelay);
    }, scanDelay);
  };

  const forceFail = () => {
    setScanState('error');
    setStatusText('Échec de la reconnaissance. Veuillez réessayer.');
    setTimeout(() => {
      setScanState('idle');
      setStatusText('Appuyez sur le capteur pour réessayer');
    }, 2000);
  };

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-slate-950 text-white p-4 md:p-6 font-sans flex flex-col items-center justify-start sm:justify-center no-scrollbar">
      {/* Background decoration with custom Light Blue / WhatsApp style radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14)_0,rgba(56,189,248,0.06)_50%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-md flex flex-col justify-between py-6 md:py-8 relative z-10 my-auto">
        
        {/* Header styling */}
        <div className="text-center space-y-3 mt-4 flex flex-col items-center">
          <PhoneMoneyLogo size="lg" animate={true} className="mb-1" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/25 rounded-full text-[10px] text-sky-400 font-extrabold font-mono tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse text-sky-400" />
            CONNEXION APPLICATION MBOATALK
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white uppercase relative">
            mboaTalk
            {/* Fine light blue bar beneath the logo title */}
            <div className="h-[2px] w-16 bg-mboa-tricolor mx-auto mt-1 rounded" />
          </h1>
          <p className="text-slate-400 text-xs font-semibold max-w-[280px] mx-auto leading-relaxed">
            Transferts d'argent instantanés & discussions chiffrées de bout en bout
          </p>
          <p className="text-amber-400/90 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {userEmail ? `${userEmail}` : 'Utilisateur connecté'}
          </p>
        </div>

        {/* Central Scan Zone */}
        <div className="flex flex-col items-center justify-center my-auto py-12 relative">
          
          {/* Animated rings */}
          <div className="relative flex items-center justify-center w-56 h-56">
            
            {/* outer radar/pulsing ring */}
            <AnimatePresence>
              {scanState === 'scanning' && (
                <motion.div
                  className="absolute inset-0 border-2 border-sky-500/40 rounded-full"
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {scanState === 'scanning' && (
                <motion.div
                  className="absolute inset-2 border border-sky-400/30 rounded-full"
                  initial={{ scale: 0.9, opacity: 1 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                />
              )}
            </AnimatePresence>

            {/* Glowing orb behind */}
            <div className={`absolute inset-4 rounded-full blur-2xl transition-all duration-700 ${
              scanState === 'scanning' ? 'bg-sky-600/20 scale-110' :
              scanState === 'success' ? 'bg-sky-500/30 scale-125' :
              scanState === 'error' ? 'bg-rose-600/20' : 'bg-slate-800/10'
            }`} />

            {/* Core Scanner button */}
            <button
              onClick={scanState === 'idle' ? startScanning : undefined}
              disabled={scanState === 'scanning' || scanState === 'success'}
              className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 border focus:outline-none cursor-pointer ${
                scanState === 'scanning' ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/20' :
                scanState === 'success' ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/20' :
                scanState === 'error' ? 'bg-slate-900 border-rose-500 shadow-md shadow-rose-500/20' :
                'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800/90'
              }`}
            >
              <AnimatePresence mode="wait">
                {scanState === 'scanning' ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    {isFaceID ? (
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 border-2 border-sky-400 rounded-lg"
                          animate={{ borderRadius: ["30%", "50%", "30%"] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <span className="text-3xl">👤</span>
                        {/* Interactive scan light bar */}
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-sky-400 shadow-md shadow-sky-400"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Fingerprint className="w-16 h-16 text-sky-400 animate-pulse" />
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-sky-400 shadow-md shadow-sky-400"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : scanState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-sky-400"
                  >
                    <ShieldCheck className="w-20 h-20" />
                  </motion.div>
                ) : scanState === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-rose-500"
                  >
                    <AlertCircle className="w-16 h-16" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="flex flex-col items-center text-slate-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isFaceID ? (
                      <div className="text-4xl mb-2">👤</div>
                    ) : (
                      <Fingerprint className="w-16 h-16 text-slate-400 mb-2" />
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      Cliquer pour scanner
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <p className={`mt-8 text-sm text-center font-medium transition-all duration-300 ${
            scanState === 'success' ? 'text-sky-455' :
            scanState === 'error' ? 'text-rose-500' :
            scanState === 'scanning' ? 'text-sky-400' : 'text-slate-300'
          }`}>
            {statusText}
          </p>
        </div>

        {/* Bottom controls / switcher */}
        <div className="space-y-4 px-4">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setIsFaceID(true);
                if (scanState === 'idle') setStatusText('Prêt pour la reconnaissance faciale FaceID');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isFaceID 
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Face ID
            </button>
            <button
              onClick={() => {
                setIsFaceID(false);
                if (scanState === 'idle') setStatusText('Prêt pour la reconnaissance d\'empreintes TouchID');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isFaceID 
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Touch ID
            </button>
          </div>

          {/* Fallbacks or instructions */}
          <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-900/60 font-mono">
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Chiffrement AES-255</span>
            </div>
            {scanState === 'idle' && (
              <button 
                onClick={forceFail}
                className="text-slate-600 hover:text-rose-500 underline transition"
              >
                Simuler échec
              </button>
            )}
            <div className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Biométrie sécurisée</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
