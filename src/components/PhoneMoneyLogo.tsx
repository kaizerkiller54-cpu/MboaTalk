import React from 'react';
import { motion } from 'motion/react';

interface PhoneMoneyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export default function PhoneMoneyLogo({ size = 'md', className = '', animate = true }: PhoneMoneyLogoProps) {
  const dims = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-28 h-28', xl: 'w-40 h-40' }[size];
  const a = animate ? 'floating' : 'idle';

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dims} ${className}`}>
      <motion.svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible" initial="idle" animate={a}>
        <defs>
          <linearGradient id="phoneBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="phoneAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="billGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="billGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="bubbleGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter>
          <filter id="glowStrong"><feGaussianBlur stdDeviation="4" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter>
        </defs>

        {/* Ambient glow behind phone */}
        <circle cx="60" cy="60" r="40" fill="#0d9488" opacity="0.06" filter="url(#glowStrong)" />

        {/* ── CHAT BUBBLE ── */}
        <motion.g variants={{
          idle: { x: 0, y: 0 },
          floating: { x: [0, 2, 0], y: [0, -1, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
        }}>
          <path d="M72 38 L72 46 C72 47.1 71.1 48 70 48 L48 48 C46.9 48 46 47.1 46 46 L46 38"
            fill="url(#bubbleGrad)" opacity="0.25" />
          <rect x="46" y="30" width="26" height="16" rx="6" fill="url(#bubbleGrad)" opacity="0.9" />
          <circle cx="53" cy="38" r="1.8" fill="white" opacity="0.7" />
          <circle cx="59" cy="38" r="1.8" fill="white" opacity="0.9" />
          <circle cx="65" cy="38" r="1.8" fill="white" opacity="0.7" />
        </motion.g>

        {/* ── PHONE ── */}
        <motion.g variants={{
          idle: { rotate: 0 },
          floating: { rotate: [-0.5, 1, -0.5], y: [0, -1.5, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }
        }}>
          {/* Shadow */}
          <rect x="43" y="52" width="34" height="52" rx="7" fill="black" opacity="0.2" filter="url(#glow)" />
          {/* Body */}
          <rect x="42" y="50" width="34" height="52" rx="7" fill="url(#phoneBody)" stroke="url(#phoneAccent)" strokeWidth="1.5" />
          {/* Screen */}
          <rect x="45" y="53" width="28" height="43" rx="4" fill="#020617" />
          {/* Screen glow line */}
          <rect x="47" y="70" width="24" height="1.5" rx="0.75" fill="#0d9488" opacity="0.15" />
          <rect x="47" y="75" width="18" height="1.5" rx="0.75" fill="#0d9488" opacity="0.1" />
          {/* Camera dot */}
          <circle cx="59" cy="51.5" r="1.2" fill="#0d9488" opacity="0.5" />
          {/* Home bar */}
          <rect x="54" y="96" width="10" height="1.2" rx="0.6" fill="#334155" />
          {/* Notification dot on screen */}
          <circle cx="67" cy="57" r="2.5" fill="#f43f5e" opacity="0.9" />
        </motion.g>

        {/* ── MONEY BILL 1 (rising right) ── */}
        <motion.g variants={{
          idle: { y: 0, x: 0, rotate: -10 },
          floating: { y: [-2, -14, -2], x: [0, 5, 0], rotate: [-10, -5, -10],
            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } }
        }}>
          <rect x="69" y="28" width="16" height="10" rx="1.5" fill="url(#billGrad1)" stroke="#059669" strokeWidth="0.6"
            filter="url(#glow)" transform="rotate(-10 77 33)" />
          <text x="77" y="36" fill="white" fontSize="5" fontWeight="black" fontFamily="monospace" textAnchor="middle"
            transform="rotate(-10 77 33)">€</text>
        </motion.g>

        {/* ── MONEY BILL 2 (rising left) ── */}
        <motion.g variants={{
          idle: { y: 0, x: 0, rotate: 12 },
          floating: { y: [0, -18, 0], x: [0, -4, 0], rotate: [12, 16, 12],
            transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }
        }}>
          <rect x="33" y="24" width="15" height="9" rx="1.5" fill="url(#billGrad2)" stroke="#d97706" strokeWidth="0.6"
            filter="url(#glow)" transform="rotate(12 40 28)" />
          <text x="40" y="31" fill="white" fontSize="4.5" fontWeight="black" fontFamily="monospace" textAnchor="middle"
            transform="rotate(12 40 28)">$</text>
        </motion.g>

        {/* ── COIN popping up ── */}
        <motion.g variants={{
          idle: { y: 0, scale: 0.8 },
          floating: { y: [0, -12, 0], scale: [0.8, 1.1, 0.8],
            transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }
        }}>
          <circle cx="60" cy="28" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" filter="url(#glow)" />
          <circle cx="60" cy="28" r="2.5" fill="none" stroke="#f59e0b" strokeWidth="0.4" opacity="0.5" />
          <text x="60" y="30" fill="#78350f" fontSize="4" fontWeight="bold" fontFamily="serif" textAnchor="middle">€</text>
        </motion.g>

        {/* ── Small sparkle dots ── */}
        <motion.circle cx="82" cy="20" r="1.2" fill="#34d399"
          variants={{ idle: { opacity: 0.4 }, floating: { opacity: [0.3, 1, 0.3], scale: [0.5, 1.3, 0.5],
            transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } } }} />
        <motion.circle cx="36" cy="16" r="1" fill="#fbbf24"
          variants={{ idle: { opacity: 0.4 }, floating: { opacity: [0.3, 1, 0.3], scale: [0.5, 1.3, 0.5],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } } }} />
        <circle cx="25" cy="38" r="0.8" fill="#fbbf24" opacity="0.6" />
        <circle cx="85" cy="40" r="0.8" fill="#34d399" opacity="0.6" />

        {/* ── Signal waves ── */}
        <motion.path d="M52 54 Q 46 48 52 44" stroke="#0d9488" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"
          fill="none" />
        <motion.path d="M56 52 Q 50 44 56 38" stroke="#0d9488" strokeWidth="0.6" strokeLinecap="round" opacity="0.15"
          fill="none" />
      </motion.svg>
    </div>
  );
}
