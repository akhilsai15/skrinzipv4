import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';

export function ReactionRow({ 
  initialReactions, 
  onReact, 
  className = "" 
}: { 
  initialReactions: Record<string, number>, 
  onReact?: (reactionId: string | null, reaction?: typeof SKRIM_REACTIONS[0]) => void,
  className?: string
}) {
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(initialReactions || {});
  const [showWhoReacted, setShowWhoReacted] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Generate an array of all SKRIM_REACTIONS with their counts, defaulting to 0
  const allReactions = SKRIM_REACTIONS.map(r => ({
    ...r,
    count: counts[r.id] || 0
  }));

  // Sort descending by count
  allReactions.sort((a, b) => b.count - a.count);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num/1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleTap = (rId: string) => {
    let newCounts = { ...counts };
    let newActive = activeReactionId;

    if (activeReactionId === rId) {
      // Remove reaction
      newCounts[rId] = Math.max(0, (newCounts[rId] || 0) - 1);
      newActive = null;
    } else {
      // If we had a previous reaction, remove it
      if (activeReactionId) {
        newCounts[activeReactionId] = Math.max(0, (newCounts[activeReactionId] || 0) - 1);
      }
      // Add new reaction
      newCounts[rId] = (newCounts[rId] || 0) + 1;
      newActive = rId;
      
      // Dispatch event to show fly animation
      if (typeof window !== 'undefined') {
         const r = SKRIM_REACTIONS.find(x => x.id === rId);
         if (r) {
           window.dispatchEvent(new CustomEvent('skrim_fly_reaction', { detail: { reaction: r } }));
         }
      }
    }

    setCounts(newCounts);
    setActiveReactionId(newActive);
    if (onReact) {
      onReact(newActive, newActive ? SKRIM_REACTIONS.find(x => x.id === newActive) : undefined);
    }
  };

  const startPress = (rId: string) => {
    const timer = setTimeout(() => {
      setShowWhoReacted(rId);
    }, 500); // 500ms long press
    setPressTimer(timer);
  };

  const clearPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const rgbaFromHex = (hex: string, alpha: number) => {
    const defaultHex = hex || '#FFFFFF'; // Fallback
    const r = parseInt(defaultHex.slice(1, 3), 16) || 255;
    const g = parseInt(defaultHex.slice(3, 5), 16) || 255;
    const b = parseInt(defaultHex.slice(5, 7), 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <div 
        className={`flex items-center gap-[6px] overflow-x-auto overflow-y-hidden select-none shrink-0 w-full ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
          paddingRight: '40px' // Extra space so last item can be fully seen
        }}
      >
        {allReactions.map(r => {
          const isActive = activeReactionId === r.id;
          
          return (
            <motion.div
              key={r.id}
              className={`flex items-center justify-center cursor-pointer shrink-0 group relative`}
              style={{
                height: '28px',
                padding: '0 10px',
                borderRadius: '20px',
                background: isActive ? rgbaFromHex(r.color, 0.2) : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isActive ? rgbaFromHex(r.color, 0.6) : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.2s ease',
              }}
              whileTap={{ scale: isActive ? 1 : 1.05 }}
              onPointerDown={() => startPress(r.id)}
              onPointerUp={() => { clearPress(); handleTap(r.id); }}
              onPointerLeave={clearPress}
              onContextMenu={(e) => { e.preventDefault(); clearPress(); setShowWhoReacted(r.id); }}
            >
              <div 
                className="absolute inset-[-1px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
                style={{ 
                   border: `1px solid ${isActive ? 'transparent' : rgbaFromHex(r.color, 0.4)}`,
                   background: isActive ? 'transparent' : 'rgba(255,255,255,0.1)' 
                }} 
              />
              <div className="flex items-center gap-[4px] relative z-10 pointer-events-none">
                <span style={{ fontSize: '14px', lineHeight: '14px' }}>{r.emoji}</span>
                <span 
                  className="font-bold tracking-tight"
                  style={{ 
                    fontSize: '12px', 
                    lineHeight: '12px', 
                    color: isActive ? r.color : 'white' 
                  }}
                >
                  {formatCount(r.count)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showWhoReacted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowWhoReacted(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col relative z-[101]"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const r = SKRIM_REACTIONS.find(x => x.id === showWhoReacted);
                if (!r) return null;
                const count = counts[showWhoReacted] || 0;
                return (
                  <>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{r.emoji}</span>
                        <h3 className="font-bold text-white uppercase" style={{ color: r.color }}>{r.name} Reactions</h3>
                      </div>
                      <button onClick={() => setShowWhoReacted(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer">
                        ✕
                      </button>
                    </div>
                    <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                      <div className="flex items-center gap-3">
                        <img src="https://i.pravatar.cc/150?img=1" alt="avatar" className="w-8 h-8 rounded-full border border-[#222]" />
                        <span className="text-sm font-bold text-white">@raju_3idiots_fan</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="https://i.pravatar.cc/150?img=2" alt="avatar" className="w-8 h-8 rounded-full border border-[#222]" />
                        <span className="text-sm font-bold text-white">@dolly_ka_dhaba</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="https://i.pravatar.cc/150?img=3" alt="avatar" className="w-8 h-8 rounded-full border border-[#222]" />
                        <span className="text-sm font-bold text-white">@chikoo_official</span>
                      </div>
                      {count > 3 && (
                        <div className="pt-2 text-xs font-bold text-white/40 text-center">
                          + {(count - 3).toLocaleString()} others
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
