import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Heart, Zap, Share, MessageCircle, MessageSquare, Shield, Link as LinkIcon, Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { AvatarWithRing } from './ui';

export function PulseCommentsSheet({ 
  isOpen, 
  onClose, 
  currentUser,
  postId,
  postCommentCount,
  onCommentAdded
}: { 
  isOpen: boolean, 
  onClose: () => void,
  currentUser: any,
  postId: string,
  postCommentCount: number,
  onCommentAdded: () => void
}) {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([
    { id: '1', handle: 'priya_vibes', text: "Samosa khaya kya? 😂", pulses: 12, time: "2h ago", avatar: "https://i.pravatar.cc/150?u=priya" },
    { id: '2', handle: 'raju_3idiots', text: "Bhai kya scene hai 🔥", pulses: 24, time: "1h ago", avatar: "https://i.pravatar.cc/150?u=raju" },
    { id: '3', handle: 'amit_kumar', text: "Wait till the end... 💀", pulses: 8, time: "3h ago", avatar: "https://i.pravatar.cc/150?u=amit" },
    { id: '4', handle: 'dolly_ka_dhaba', text: "Ekdum mast hai bhai 💜", pulses: 15, time: "4h ago", avatar: "https://i.pravatar.cc/150?u=dolly" },
    { id: '5', handle: 'chikoo_official', text: "Gym ke baad ye dekhna 😂", pulses: 31, time: "5h ago", avatar: "https://i.pravatar.cc/150?u=chikoo" },
  ]);

  const handleSend = () => {
    if (!commentInput.trim()) return;
    
    const newId = `${currentUser?.username?.replace('@', '') || 'you'}_${Date.now()}`;

    const newComment = {
      id: newId,
      handle: currentUser?.username?.replace('@', '') || 'you',
      text: commentInput.trim(),
      pulses: 0,
      time: "Just now",
      avatar: currentUser?.avatar || "https://i.pravatar.cc/150?u=you"
    };

    setComments(prev => {
      if (prev.some(c => c.id === newId)) return prev;
      return [newComment, ...prev];
    });

    setCommentInput('');
    onCommentAdded();
  };

  const handlePulseComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, pulses: c.pulses + 1 } : c));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
           <motion.div
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             exit={{ y: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             onClick={(e) => e.stopPropagation()}
             className="bg-[rgba(20,20,20,0.95)] border-t border-white/10 rounded-t-3xl h-[75vh] flex flex-col w-full max-w-2xl mx-auto shadow-2xl relative"
           >
             {/* Header */}
             <div className="p-4 border-b border-white/10 shrink-0 flex items-center justify-between sticky top-0 bg-[rgba(20,20,20,0.95)] z-10 rounded-t-3xl">
               <h3 className="text-lg font-bold text-white pl-4">Comments <span className="text-gray-500 font-normal text-sm ml-1">({postCommentCount})</span></h3>
               <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                 <X className="w-5 h-5 text-gray-400" />
               </button>
             </div>
             
             {/* Comments List */}
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                     <AvatarWithRing src={c.avatar} size="sm" isStory={false} />
                     <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <span className="font-semibold text-sm text-white">@{c.handle}</span>
                           <span className="text-xs text-gray-500">{c.time}</span>
                        </div>
                        <p className="text-sm text-gray-200 mt-0.5">{c.text}</p>
                        <div className="flex gap-4 mt-2">
                           <button className="flex items-center gap-1 group" onClick={() => handlePulseComment(c.id)}>
                              <Zap className="w-4 h-4 text-gray-400 group-hover:text-[#B026FF] group-active:scale-125 transition-transform" />
                              <span className="text-xs text-gray-400 font-medium">{c.pulses}</span>
                           </button>
                           <button className="flex items-center gap-1 group" onClick={() => setCommentInput(`@${c.handle} `)}>
                              <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                              <span className="text-xs text-gray-400 font-medium">Reply</span>
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Input Bar */}
             <div className="p-4 border-t border-white/10 bg-[#141414] shrink-0 sticky bottom-0">
               <div className="flex gap-3 items-center">
                 <img src={currentUser?.avatar || "https://i.pravatar.cc/150?u=you"} alt="You" className="w-9 h-9 rounded-full object-cover" />
                 <div className="flex-1 bg-white/5 border border-white/10 rounded-full flex items-center px-4 py-2 focus-within:border-white/30 focus-within:bg-white/10 transition-colors relative">
                    <input 
                      type="text" 
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Add a comment..." 
                      className="bg-transparent text-sm text-white outline-none w-full pr-10"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!commentInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 text-[#B026FF] hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                 </div>
               </div>
             </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PulseShareSheet({
  isOpen,
  onClose,
  onShareComplete
}: {
  isOpen: boolean,
  onClose: () => void,
  onShareComplete: (type: string, message: string) => void
}) {
  const [view, setView] = useState<'main' | 'connect' | 'veil' | 'more'>('main');

  const handleShare = (type: string, msg: string) => {
    onShareComplete(type, msg);
    setTimeout(onClose, 200);
    setTimeout(() => setView('main'), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
        >
           <motion.div
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             exit={{ y: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             onClick={(e) => e.stopPropagation()}
             className="bg-[rgba(20,20,20,0.95)] border-t border-white/10 rounded-t-3xl flex flex-col w-full max-w-2xl mx-auto shadow-2xl relative pb-8"
           >
             {/* Header */}
             <div className="p-4 border-b border-white/10 shrink-0 flex items-center justify-between sticky top-0">
               <h3 className="text-lg font-bold text-white pl-4 flex items-center gap-2">
                 {view !== 'main' && (
                    <button onClick={() => setView('main')} className="mr-2 p-1 hover:bg-white/10 rounded-full transition-colors text-white">
                      ←
                    </button>
                 )}
                 {view === 'main' && 'Share Post ⚡'}
                 {view === 'connect' && 'Send in Connect 💬'}
                 {view === 'veil' && 'Share via Veil 🔒'}
                 {view === 'more' && 'More Platforms ⋯'}
               </h3>
               <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                 <X className="w-5 h-5 text-gray-400" />
               </button>
             </div>

             {/* Content */}
             <div className="p-4 overflow-y-auto max-h-[60vh] no-scrollbar">
                {view === 'main' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleShare('spark', 'Added to your Sparks! ✨')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                        <span>✨</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Share as Spark Story</div>
                        <div className="text-xs text-gray-400 mt-0.5">Post card to your Sparks</div>
                      </div>
                    </button>
                    
                    <button onClick={() => setView('connect')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">Send in Connect</div>
                        <div className="text-xs text-gray-400 mt-0.5">Share privately in chat</div>
                      </div>
                    </button>

                    <button onClick={() => setView('veil')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-[#B026FF]/20 flex items-center justify-center text-[#B026FF] group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">Share via Veil</div>
                        <div className="text-xs text-gray-400 mt-0.5">Send encrypted privately</div>
                      </div>
                    </button>

                    <button onClick={() => setView('more')} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <span>⋯</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">More Platforms</div>
                        <div className="text-xs text-gray-400 mt-0.5">Arattai, WhatsApp & more</div>
                      </div>
                    </button>
                  </div>
                )}

                {view === 'connect' && (
                  <div className="flex flex-col gap-2">
                     {['priya_vibes', 'raju_3idiots', 'amit_kumar'].map((u, i) => (
                       <button key={u} onClick={() => handleShare('connect', `Sent to @${u}! 💬`)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left group">
                         <AvatarWithRing src={`https://i.pravatar.cc/150?u=${u}`} size="md" />
                         <span className="text-white font-semibold">@{u}</span>
                         <div className="ml-auto bg-[#00F0FF]/20 text-[#00F0FF] font-medium text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Send</div>
                       </button>
                     ))}
                  </div>
                )}

                {view === 'veil' && (
                  <div className="flex flex-col gap-2">
                     {['amit_kumar', 'secure_node_7'].map((u, i) => (
                       <button key={u} onClick={() => handleShare('veil', 'Sent via Veil 🔒')} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 transition-colors text-left group border border-[#B026FF]/20">
                         <div className="w-12 h-12 rounded-full bg-[#111] border border-[#B026FF]/50 flex items-center justify-center">
                           <Shield className="w-5 h-5 text-[#B026FF]" />
                         </div>
                         <span className="text-white font-semibold">@{u}</span>
                         <div className="ml-auto bg-[#B026FF]/20 text-[#B026FF] font-medium text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Encrypt & Send</div>
                       </button>
                     ))}
                  </div>
                )}

                {view === 'more' && (
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    <button onClick={() => handleShare('arattai', 'Shared to Arattai!')} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 rounded-full bg-[#202020] border border-[#ff6b00]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🇮🇳</span>
                      </div>
                      <span className="text-xs text-gray-300 font-medium">Arattai</span>
                    </button>
                    <button onClick={() => window.open('https://wa.me/', '_blank')} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">WhatsApp</span>
                    </button>
                    <button onClick={() => window.open('https://twitter.com/intent/tweet', '_blank')} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 rounded-full bg-[#1DA1F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Twitter className="w-6 h-6 text-white text-xl fill-current" />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">X</span>
                    </button>
                    <button onClick={() => window.open('https://facebook.com', '_blank')} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Facebook className="w-6 h-6 text-white fill-current" />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">Facebook</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); handleShare('copy', 'Link copied to clipboard! 📋'); }} className="flex flex-col items-center gap-2 group">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LinkIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-gray-300 font-medium">Copy Link</span>
                    </button>
                  </div>
                )}
             </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
