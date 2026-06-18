import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User } from 'lucide-react';

interface VeilInviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (username: string) => void;
}

const SUGGESTED_CONTACTS = ['Priya Sharma', 'Rahul Mehta', 'Arjun Singh'];

export function VeilInviteSheet({ isOpen, onClose, onSendInvite }: VeilInviteSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = SUGGESTED_CONTACTS.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-[#0c0c16] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Start a Veil Chat</h3>
              <button onClick={onClose} className="p-2 text-[#888899] hover:text-white transition-colors bg-[rgba(255,255,255,0.05)] rounded-full">
                <X size={16} />
              </button>
            </div>

            <p className="text-[#888899] font-mono text-xs mb-6 leading-relaxed">
              Only people you know on SkrimChat can be invited to Veil.
            </p>

            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888899]" size={16} />
              <input 
                type="text"
                placeholder="Search by Skrim username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white rounded-xl py-3 pl-10 pr-4 text-sm font-mono placeholder-[#888899]/50 focus:outline-none focus:border-[#7B2FF7] transition-colors"
              />
            </div>

            <div className="mb-4">
              <div className="text-[10px] text-[#888899] uppercase tracking-widest font-bold mb-4 px-2">
                Suggested (from Connect)
              </div>
              <div className="flex flex-col gap-2">
                {filteredContacts.map(contact => (
                  <div key={contact} className="flex items-center justify-between p-3 rounded-xl hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#888899]">
                        <User size={18} />
                      </div>
                      <span className="text-sm text-white font-medium">{contact}</span>
                    </div>
                    <button 
                      onClick={() => onSendInvite(contact)}
                      className="px-4 py-2 border border-[#7B2FF7]/50 text-[#b382fc] rounded-full text-xs uppercase tracking-wider font-bold hover:bg-[#7B2FF7]/10 transition-colors"
                    >
                      Invite
                    </button>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-center py-4 text-[#888899] font-mono text-xs">
                    No matching contacts found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
