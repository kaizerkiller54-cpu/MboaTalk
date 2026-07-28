import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Wallet, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Phone, 
  User, 
  Euro, 
  CircleDollarSign, 
  PlusCircle,
  Gift,
  Award,
  Copy,
  Users,
  Sparkles,
  Share2
} from 'lucide-react';
import { Contact, Transaction, Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface PortefeuilleTabProps {
  contacts: Contact[];
  setContacts?: React.Dispatch<React.SetStateAction<Contact[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  prefilledContactName?: string | null;
  clearPrefilledContactName?: () => void;
  onTransferSuccess?: (contactName: string, amount: number) => void;
  isMobile?: boolean;
}

export default function PortefeuilleTab({ 
  contacts, 
  setContacts, 
  transactions, 
  setTransactions, 
  balance, 
  setBalance, 
  setNotifications,
  prefilledContactName,
  clearPrefilledContactName,
  onTransferSuccess,
  isMobile = false
}: PortefeuilleTabProps) {
  // Transfer Form Stages:
  // 'dashboard' | 'enter_number' | 'enter_amount' | 'receipt'
  const [stage, setStage] = useState<'dashboard' | 'enter_number' | 'enter_amount' | 'receipt'>('dashboard');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [matchedContact, setMatchedContact] = useState<Contact | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  // Auto-detect and prefill the contact from active chats
  useEffect(() => {
    if (prefilledContactName) {
      const matched = contacts.find(c => c.name.toLowerCase() === prefilledContactName.toLowerCase());
      if (matched) {
        setMatchedContact(matched);
        setPhoneNumber(matched.phone);
        setStage('enter_amount');
      }
    }
  }, [prefilledContactName, contacts]);

  // Top Up state
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpVal, setTopUpVal] = useState('');

  // Referral states
  const [hasReferred, setHasReferred] = useState(() => {
    return localStorage.getItem('securconnect_has_referred') === 'true';
  });
  const [referralCount, setReferralCount] = useState(() => {
    return parseInt(localStorage.getItem('securconnect_referral_count') || '1', 10);
  });
  const [referralEarnings, setReferralEarnings] = useState(() => {
    return parseFloat(localStorage.getItem('securconnect_referral_earnings') || '5.00');
  });
  const [isCopied, setIsCopied] = useState(false);

  // Simulation status State
  const [testReferralName, setTestReferralName] = useState('Thomas Durant');
  const [testReferralPhone, setTestReferralPhone] = useState('+33 7 89 01 23 45');
  const [simStep, setSimStep] = useState<number>(0); // 0: ready, 1: signup, 2: transaction, 3: completed
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSummary, setSimSummary] = useState<{name: string; bonusReferrer: number; bonusReferred: number; firstTxAmount: number} | null>(null);

  // Sub-tabs for wallet info: 'transactions' | 'referral'
  const [walletSubTab, setWalletSubTab] = useState<'transactions' | 'referral'>('transactions');

  // Handle phone number input to dynamically match contact
  const handlePhoneChange = (num: string) => {
    setPhoneNumber(num);
    
    // Find matching contact by partial/exact phone match
    const digitsOnly = num.replace(/\D/g, '');
    if (digitsOnly.length >= 4) {
      const matched = contacts.find(c => {
        const cDigits = c.phone.replace(/\D/g, '');
        return cDigits.includes(digitsOnly) || c.name.toLowerCase().includes(num.toLowerCase());
      });
      setMatchedContact(matched || null);
    } else {
      setMatchedContact(null);
    }
  };

  const selectSuggestedContact = (contact: Contact) => {
    setMatchedContact(contact);
    setPhoneNumber(contact.phone);
    setStage('enter_amount');
  };

  const handleValidateNumber = () => {
    if (matchedContact) {
      setStage('enter_amount');
    } else {
      alert("Aucun contact correspondant n'a été trouvé dans votre annuaire de l'application.");
    }
  };

  const handleExecuteTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide supérieur à 0 €.");
      return;
    }

    if (amount > balance) {
      alert("Solde insuffisant pour réaliser ce transfert.");
      return;
    }

    setIsProcessing(true);

    // Calculate low fees (0.1% baseline, or 0.05% if referred)
    const activeFeeRate = hasReferred ? 0.0005 : 0.001; 
    const calculatedFee = parseFloat((amount * activeFeeRate).toFixed(2));

    api.executeTransfer({
      contactPhone: phoneNumber,
      amount,
      fee: calculatedFee
    }).then(res => {
      if (res.success) {
        setBalance(res.balance);
        setTransactions([res.transaction, ...transactions]);
        setLastTx(res.transaction);
        setIsProcessing(false);
        setTransferAmount('');
        setStage('receipt');
        if (onTransferSuccess && matchedContact) {
          onTransferSuccess(matchedContact.name, amount);
        }
        if (clearPrefilledContactName) {
          clearPrefilledContactName();
        }
      }
    }).catch(err => {
      setIsProcessing(false);
      alert(err.message || 'Erreur lors du transfert.');
    });
  };

  const handleTopUpBalance = async () => {
    const topUpAmount = parseFloat(topUpVal);
    if (isNaN(topUpAmount) || topUpAmount <= 0) return;

    try {
      const res = await api.topUpBalance(topUpAmount);
      if (res.success) {
        setBalance(res.balance);
        setTransactions([res.transaction, ...transactions]);
        setTopUpVal('');
        setShowTopUp(false);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la recharge.');
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText('SECURE-MD-2026');
    } catch (e) {
      // safe fallback in sandboxed iframe environment
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRunSimulation = () => {
    if (!testReferralName.trim()) {
      alert("Veuillez saisir un nom de filleul valide.");
      return;
    }
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => {
      setSimStep(2);
      
      setTimeout(async () => {
        try {
          const res = await api.runReferralSimulation({
            name: testReferralName,
            phone: testReferralPhone
          });
          if (res.success && res.user) {
            setBalance(res.user.balance);
            setTransactions(res.user.transactions);
            if (setNotifications) {
              setNotifications(res.user.notifications);
            }
            if (setContacts) {
              setContacts(res.user.contacts);
            }
            
            // Save progress to localStorage (safe backup)
            localStorage.setItem('securconnect_has_referred', 'true');
            localStorage.setItem('securconnect_referral_count', String(res.user.referralCount));
            localStorage.setItem('securconnect_referral_earnings', String(res.user.referralEarnings));

            setHasReferred(true);
            setReferralCount(res.user.referralCount);
            setReferralEarnings(res.user.referralEarnings);
            setSimStep(3);

            // Save summary
            setSimSummary({
              name: testReferralName,
              bonusReferrer: 5.00,
              bonusReferred: 5.00,
              firstTxAmount: 20.00
            });
            setIsSimulating(false);
          }
        } catch (err: any) {
          alert(err.message || 'Erreur lors de la simulation.');
          setIsSimulating(false);
          setSimStep(0);
        }
      }, 1200);

    }, 1200);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 font-sans text-white max-w-7xl mx-auto">
      
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-12 gap-6'} items-start`}>
        {/* Left Column: Wallet available balance, CEMAC card, and quick recharge actions */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-5 xl:col-span-4'}`}>
          
          {/* Portefeuille Tab Header Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden text-left">
        {/* Background chips patterns */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <Wallet className="w-4 h-4 animate-pulse" />
            <span>PORT_MONNAIE TRICOLORE MBOATALK</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700 font-mono relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
            <span className="absolute left-1 top-0 bottom-0 w-1 bg-yellow-500" />
            <span className="absolute left-2 top-0 bottom-0 w-1 bg-red-500" />
            <span className="pl-3.5">CEMAC • SOLDE EN DIRECT</span>
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Solde Disponible</span>
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h1>
            <span className="text-emerald-400 text-xs font-mono font-bold">Sans frais cachés</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {/* Main button Envoyer de l'argent */}
          <button
            onClick={() => {
              setStage('enter_number');
              setPhoneNumber('');
              setMatchedContact(null);
            }}
            className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Envoyer de l'argent</span>
          </button>

          {/* Top up button */}
          <button
            onClick={() => setShowTopUp(!showTopUp)}
            className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700/60 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Recharger le compte</span>
          </button>
        </div>

        {/* Quick Top up panel toggler */}
        {showTopUp && (
          <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
            <input
              type="number"
              placeholder="Montant à recharger"
              value={topUpVal}
              onChange={(e) => setTopUpVal(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none"
            />
            <button
              onClick={handleTopUpBalance}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>

        </div>

        {/* Right Column: Interacting Fintech workspace (Dashboard, transfers, or automated receipt) */}
        <div className={`space-y-6 ${isMobile ? 'w-full' : 'lg:col-span-7 xl:col-span-8'}`}>
          {stage === 'dashboard' && (
            <div className="space-y-4">
          {/* Dynamic Sub-tabs for Account Hub */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setWalletSubTab('transactions')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                walletSubTab === 'transactions' 
                  ? 'bg-slate-800 text-white shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setWalletSubTab('referral')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 relative cursor-pointer ${
                walletSubTab === 'referral' 
                  ? 'bg-slate-800 text-white shadow-sm font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Filleuls & Parrainage</span>
              {!hasReferred && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          </div>

          {/* SUB-TAB 1: TRANSACTIONS LIST */}
          {walletSubTab === 'transactions' ? (
            /* STANDARD HISTORY LIST VIEW */
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Historique des Transactions</h2>
                <span className="text-[11px] font-medium text-slate-500 font-mono">
                  Frais: {hasReferred ? '0.05 % (Parrainage Actif)' : '0.1 % (Standard)'}
                </span>
              </div>

              <div className="space-y-2.5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-900/45 hover:bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        tx.type === 'send' ? 'bg-red-500/10 text-red-500' :
                        tx.type === 'top_up' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">
                          {tx.type === 'send' ? `Envoi à ${tx.contactName}` :
                           tx.type === 'top_up' ? 'Approvisionnement' : `Reçu de ${tx.contactName}`}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold font-mono ${
                        tx.type === 'send' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(2)} €
                      </span>
                      {tx.fees > 0 && (
                        <p className="text-[10px] text-slate-500 font-mono">Frais: {tx.fees.toFixed(2)} €</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SUB-TAB 2: REFERRAL / PARRAINAGE PORTAL */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-left"
            >
              {/* Intro Card */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/25 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Programme de Parrainage</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Gagnez des bonus et divisez vos frais de transfert par deux ! Partagez votre code sécurisé avec votre entourage.
                    </p>
                  </div>
                </div>

                {/* Reward Badges */}
                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-slate-800/80">
                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-2">
                    <span className="text-lg">💶</span>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 uppercase font-mono block">Cadeau d'arrivée</span>
                      <span className="text-xs font-bold text-white font-mono">+5.00 € chacun</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 uppercase font-mono block">Frais de Transfert</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">Frais divisés par 2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Votre code de parrainage unique</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span>SECURE-MD-2026</span>
                    <span className="text-[9px] text-slate-500 font-normal">Code Actif</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-emerald-600/15"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* referral stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Inscriptions</span>
                  <span className="text-sm font-extrabold text-white font-mono">{referralCount}</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Gains parrain</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">{referralEarnings.toFixed(2)} €</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Taux frais</span>
                  <span className="text-xs font-extrabold text-amber-400 font-mono">
                    {hasReferred ? '0.05 % ✓' : '0.10 %'}
                  </span>
                </div>
              </div>

              {/* SIMULATOR TOOL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <span className="text-base">🛠️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulateur d'inscription filleul</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Simulez le parcours d'un nouvel utilisateur qui s'inscrit et effectue sa 1ère transaction</p>
                  </div>
                </div>

                {simStep === 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Nom du Filleul</label>
                        <input
                          type="text"
                          value={testReferralName}
                          onChange={(e) => setTestReferralName(e.target.value)}
                          placeholder="Thomas Durant"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Téléphone</label>
                        <input
                          type="text"
                          value={testReferralPhone}
                          onChange={(e) => setTestReferralPhone(e.target.value)}
                          placeholder="+33 7 89 01 23 45"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-medium font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleRunSimulation}
                      disabled={isSimulating}
                      className="w-full py-2.5 bg-[#00a884] hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span>Démarrer la Simulation</span>
                    </button>
                  </div>
                )}

                {isSimulating && (
                  <div className="space-y-3.5 py-2 font-sans">
                    {/* Stepper display */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          simStep >= 1 ? 'bg-[#00a884] text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {simStep > 1 ? '✓' : '1'}
                        </div>
                        <span className={`text-xs ${simStep === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                          {testReferralName} s'enregistre avec le code SECURE-MD-2026...
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          simStep >= 2 ? 'bg-[#00a884] text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {simStep > 2 ? '✓' : '2'}
                        </div>
                        <span className={`text-xs ${simStep === 2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                          Première transaction ({testReferralName} transfère 20.00 €)...
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          simStep >= 3 ? 'bg-[#00a884] text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                          3
                        </div>
                        <span className={`text-xs ${simStep === 3 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                          Distribution des primes (+5.00 € chacun)...
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-[#00a884] transition-all duration-1000"
                        style={{ width: simStep === 1 ? '33%' : simStep === 2 ? '66%' : '100%' }}
                      />
                    </div>
                  </div>
                )}

                {simStep === 3 && simSummary && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950 p-4 rounded-xl border border-emerald-500/25 space-y-4"
                  >
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <span>🎉</span>
                      <span>Parrainage validé avec succès !</span>
                    </div>

                    <div className="space-y-2 text-xs border border-slate-850 p-3 rounded-lg bg-slate-900/50">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-slate-300">Votre Récompense (Parrain) :</span>
                        <div className="text-right">
                          <span className="font-black text-white font-mono block">+{simSummary.bonusReferrer.toFixed(2)} € crédité</span>
                          <span className="text-[9px] text-amber-400">Frais divisés par 2 (0.05 %) active !</span>
                        </div>
                      </div>
                      <div className="h-px bg-slate-800 my-1" />
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-slate-300">Récompense de {simSummary.name} (Filleul) :</span>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 font-mono block">+{simSummary.bonusReferred.toFixed(2)} € offert</span>
                          <span className="text-[9px] text-slate-500">1ère transaction complétée ✓</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-900" />
                    <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                      {simSummary.name} a maintenant été ajouté à votre carnet d'adresses. Retrouvez-le dans l'onglet Discussions !
                    </p>

                    <button
                      onClick={() => setSimStep(0)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                    >
                      Parrainer un autre proche
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* STAGE: ENTER RECIPIENT PHONE NUMBER */}
      {stage === 'enter_number' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-left"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-400" />
              Saisir le numéro du destinataire
            </h3>
            <button onClick={() => setStage('dashboard')} className="text-xs text-slate-400 hover:text-slate-200">
              Annuler
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-400">Numéro de téléphone ou Nom :</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                👤
              </span>
              <input
                type="text"
                placeholder="Ex: +33 6 12 34 56 78 ou 'Alice'"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs placeholder-slate-500 text-left"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              L'application recherchera les comptes correspondants en temps réel.
            </p>
          </div>

          {/* DYNAMIC MATCH CONTAINER DISPLAY */}
          <AnimatePresence>
            {matchedContact ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img src={matchedContact.avatar} alt="Matched User" className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-400">Compte trouvé ! ✅</h4>
                    <p className="text-xs font-bold text-slate-100">{matchedContact.name}</p>
                    <span className="text-[9px] text-slate-400 font-mono">{matchedContact.phone}</span>
                  </div>
                </div>

                <button
                  onClick={handleValidateNumber}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                >
                  Continuer
                </button>
              </motion.div>
            ) : phoneNumber.length > 3 ? (
              <div className="p-3 bg-red-950/20 border border-red-900/20 rounded-md text-xs text-red-400 font-medium">
                Aucun compte correspondant trouvé pour "{phoneNumber}". Saisissez le nom d'un contact existant (ex: Alice, Sophie, Clara).
              </div>
            ) : null}
          </AnimatePresence>

          {/* Direct selection of existing contacts list for fluid testing experience */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-400">Sélectionner un bénéficiaire de confiance :</h4>
            <div className="grid grid-cols-2 gap-2">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectSuggestedContact(c)}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition text-left flex items-center gap-2 cursor-pointer"
                >
                  <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate text-slate-200">{c.name}</p>
                    <span className="text-[8px] text-slate-500 truncate font-mono">{c.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* STAGE: CONFIRM CONTACT NAME AND INPUT TRANSFER AMOUNT */}
      {stage === 'enter_amount' && matchedContact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-left"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Validation du Transfert</h3>
            <button onClick={() => {
              setStage('enter_number');
              if (clearPrefilledContactName) {
                clearPrefilledContactName();
              }
            }} className="text-xs text-slate-400">Retour</button>
          </div>

          <div className="text-center py-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Bénéficiaire Sélectionné</span>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <img src={matchedContact.avatar} alt="Beneficiary" className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-lg" />
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-100">{matchedContact.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{matchedContact.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400">Saisir le Montant en Euros (€) :</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg text-slate-500 font-bold">
                €
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-center text-lg font-bold font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            {/* Real-time calculated low fee estimation display */}
            {transferAmount && parseFloat(transferAmount) > 0 && (
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between font-mono">
                  <span>Montant brut :</span>
                  <span>{parseFloat(transferAmount).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-mono text-blue-400 font-bold">
                  <span>Frais Pay&Chat réduits ({hasReferred ? '0.05 % parrain' : '0.1 %'}) :</span>
                  <span>{parseFloat((parseFloat(transferAmount) * (hasReferred ? 0.0005 : 0.001)).toFixed(2))} €</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between font-bold flex-row text-left justify-items-stretch">
                  <span>Total à débiter :</span>
                  <span className="ml-auto">{parseFloat((parseFloat(transferAmount) * (hasReferred ? 1.0005 : 1.001)).toFixed(2))} €</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExecuteTransfer}
            disabled={isProcessing || !transferAmount || parseFloat(transferAmount) <= 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            {isProcessing ? (
              <span>Authentification et transfert sécurisé...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Effectuer le Transfert Sécurisé</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* STAGE: SUCCESSFUL TRANSACTION SUMMARY RECEIPT */}
      {stage === 'receipt' && lastTx && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 space-y-5 text-center relative"
        >
          {/* Confetti decoration */}
          <div className="mx-auto w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-3xl">
            ✓
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-400">Transfert Réussi !</h3>
            <p className="text-xs text-slate-400">Le destinataire a bien été crédité instantanément.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl space-y-2 text-left border border-slate-850">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Bénéficiaire :</span>
              <span className="font-bold text-white mb-1">{lastTx.contactName}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>N° de Compte :</span>
              <span className="font-mono text-slate-300">{lastTx.contactPhone}</span>
            </div>
            <div className="h-px bg-slate-900" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Montant transféré :</span>
              <span className="font-bold text-white">{lastTx.amount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Frais de courtage réduits :</span>
              <span className="font-bold text-blue-400">{lastTx.fees.toFixed(2)} €</span>
            </div>
            <div className="h-px bg-slate-900" />
            <div className="flex justify-between text-sm font-bold text-slate-200">
              <span>Montant Débité :</span>
              <span className="text-emerald-400 font-mono">{(lastTx.amount + lastTx.fees).toFixed(2)} €</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono">
            ID de référence : {lastTx.id} <br />
            Chiffrement de bout en bout conforme SEPA & RGPD 🛡️
          </p>

          <button
            onClick={() => setStage('dashboard')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs transition cursor-pointer"
          >
            Fermer le reçu
          </button>
        </motion.div>
      )}

        </div>
      </div>

    </div>
  );
}
