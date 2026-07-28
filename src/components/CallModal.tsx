import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, VolumeX, Users, UserPlus, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '../i18n/LanguageContext';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerAvatar?: string;
  type: 'audio' | 'video';
  isGroupCall?: boolean;
}

export default function CallModal({ isOpen, onClose, callerName, callerAvatar, type, isGroupCall = false }: CallModalProps) {
  const { t } = useLang();
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [time, setTime] = useState(0);
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    setCallStatus('connecting');
    setTime(0);

    // Simulate joining call after 2 seconds
    const timerConnect = setTimeout(() => {
      setCallStatus('active');
    }, 2000);

    return () => {
      clearTimeout(timerConnect);
    };
  }, [isOpen]);

  // Handle active call timer
  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const triggerReaction = (emoji: string) => {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-white font-sans overflow-hidden">
      
      {/* Immersive interactive visual background for video calls */}
      {type === 'video' && callStatus === 'active' && (
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" 
            alt="Filtre vidéo call" 
            className="w-full h-full object-cover blur-md"
          />
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col justify-between h-[85vh] max-h-[700px] bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Floating Ring background */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 font-mono">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span>{callStatus === 'connecting' ? t('call_connecting') : callStatus === 'active' ? t('call_live') : t('call_ended')}</span>
          </div>
          {callStatus === 'active' && (
            <div className="text-sm font-mono text-white bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
              {formatTime(time)}
            </div>
          )}
          <div className="flex items-center gap-1">
            {type === 'video' ? <Video className="w-4 h-4 text-emerald-400" /> : <Phone className="w-4 h-4 text-emerald-400" />}
          </div>
        </div>

        {/* Central caller/video view */}
        <div className="flex flex-col items-center justify-center my-auto py-6 relative">
          
          {/* Reaction animation overlay */}
          {reaction && (
            <motion.div 
              initial={{ scale: 0.3, y: 50, opacity: 0 }}
              animate={{ scale: 1.5, y: -80, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute text-6xl z-40"
            >
              {reaction}
            </motion.div>
          )}

          {type === 'video' && callStatus === 'active' ? (
            /* Mock Video Frame of Remote user and Local in small */
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950">
              {/* Remote speaker background video simulation */}
              <img 
                src={callerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"} 
                alt={callerName} 
                className="w-full h-full object-cover"
              />
              {/* Dynamic tag overlays */}
              <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-white border border-slate-800 flex items-center gap-1">
                {isGroupCall ? <Users className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{callerName}</span>
              </div>

              {/* Local mini preview */}
              <div className="absolute top-3 right-3 w-24 aspect-[3/4] bg-slate-800 border-2 border-emerald-500 rounded-lg overflow-hidden shadow-lg">
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-500 relative">
                  <div className="absolute inset-0 bg-emerald-500/10" />
                  <span className="text-xl">🤳</span>
                  <span>{t('call_me_camera')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Audio Mode: Beautiful avatar pulsing waves */
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-36 h-36 mb-6">
                
                {/* Pulse waves */}
                {callStatus === 'connecting' && (
                  <>
                    <div className="absolute inset-0 border border-emerald-500/40 rounded-full animate-ping" />
                    <div className="absolute inset-3 border border-emerald-500/25 rounded-full animate-pulse" />
                  </>
                )}
                {callStatus === 'active' && !isMuted && (
                  <div className="absolute -inset-4 border border-emerald-400/20 rounded-full animate-ping opacity-60" style={{ animationDuration: '3s' }} />
                )}

                {/* Avatar */}
                <div className="w-28 h-28 rounded-full border-4 border-slate-800 shadow-xl overflow-hidden relative z-10">
                  {callerAvatar ? (
                    <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 border border-slate-705 flex items-center justify-center text-3xl font-bold text-emerald-400">
                      {isGroupCall ? '👥' : callerName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-100 text-center">{callerName}</h3>
              {isGroupCall && (
                <p className="text-xs text-emerald-400 font-medium mt-1">{t('call_group')}</p>
              )}
              <p className="text-xs text-slate-400 mt-2 font-mono h-4">
                {callStatus === 'connecting' && t('call_secure_connecting')}
                {callStatus === 'active' && t('call_encrypted')}
                {callStatus === 'ended' && t('call_ended_status')}
              </p>
            </div>
          )}
        </div>

        {/* Reaction strip during active call */}
        {callStatus === 'active' && (
          <div className="flex justify-center items-center gap-3 bg-slate-800/40 backdrop-blur-sm p-2 rounded-xl border border-slate-800 max-w-xs mx-auto mb-4">
            <button onClick={() => triggerReaction('👍')} className="hover:scale-125 transition duration-150 p-1 text-sm bg-slate-800 rounded">👍</button>
            <button onClick={() => triggerReaction('👋')} className="hover:scale-125 transition duration-150 p-1 text-sm bg-slate-800 rounded">👋</button>
            <button onClick={() => triggerReaction('❤️')} className="hover:scale-125 transition duration-150 p-1 text-sm bg-slate-800 rounded">❤️</button>
            <button onClick={() => triggerReaction('😂')} className="hover:scale-125 transition duration-150 p-1 text-sm bg-slate-800 rounded">😂</button>
            <button onClick={() => triggerReaction('🔥')} className="hover:scale-125 transition duration-150 p-1 text-sm bg-slate-800 rounded">🔥</button>
            <div className="h-4 w-px bg-slate-700" />
            <Smile className="w-4 h-4 text-slate-400" />
          </div>
        )}

        {/* Bottom controls panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-around">
            
            {/* Speaker lock button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full transition-all duration-200 border cursor-pointer ${
                isSpeakerOn 
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Main Red End button */}
            <button
              onClick={handleEndCall}
              className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center border border-red-500"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Mute Mic button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full transition-all duration-200 border cursor-pointer ${
                isMuted 
                  ? 'bg-red-900/30 text-red-400 border-red-900/60 hover:bg-red-900/55' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono text-center">
            <span>{t('call_fee_info')}</span>
            <span>•</span>
            <span>{t('call_secure')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
