import React, { useState } from 'react';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Contact } from '../types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: (contact: Contact) => void;
}

export default function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; email: string; phone: string; avatarUrl: string; statusText: string; isOnline: boolean; isContact: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!email.includes('@')) {
      setError('Entrez un email valide.');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchContact(email);
      setResults(res.users || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (targetEmail: string, id: string) => {
    setAddingId(id);
    setError('');
    try {
      const res = await api.addContact(targetEmail);
      onContactAdded(res.contact);
      setResults(prev => prev.map(u => u.id === id ? { ...u, isContact: true } : u));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setAddingId(null);
    }
  };

  const handleClose = () => {
    setEmail('');
    setResults([]);
    setSearched(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a3942]">
          <h3 className="text-sm font-bold text-[#e9edef] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#00a884]" />
            Ajouter un contact
          </h3>
          <button onClick={handleClose} className="text-[#8696a0] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8696a0]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Email de l'utilisateur..."
                className="w-full bg-[#1f2c34] border border-[#2a3942] rounded-lg pl-9 pr-3 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#06846d] text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Results */}
          {searched && !loading && results.length === 0 && (
            <p className="text-xs text-[#8696a0] text-center py-4">Aucun utilisateur trouvé avec cet email.</p>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {results.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#1f2c34] border border-[#2a3942]">
                  <div className="w-9 h-9 rounded-full bg-[#2a3942] flex items-center justify-center text-[#00a884] font-bold text-sm shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#e9edef] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#8696a0] truncate">{user.email}</p>
                  </div>
                  {user.isContact ? (
                    <span className="text-[10px] text-[#00a884] font-bold flex items-center gap-1 px-2 py-1">
                      <Check className="w-3 h-3" /> Ajouté
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(user.email, user.id)}
                      disabled={addingId === user.id}
                      className="px-2 py-1 bg-[#00a884]/10 text-[#00a884] text-[10px] font-bold rounded hover:bg-[#00a884]/20 disabled:opacity-50 flex items-center gap-1"
                    >
                      {addingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Ajouter
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
