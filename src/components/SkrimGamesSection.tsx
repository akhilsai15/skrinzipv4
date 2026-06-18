import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Clock, X, Star, ChevronRight, Zap, Users, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import emojiLogo from '../assets/images/emoji_3d_logo_1781529919555.jpg';
import gilliLogo from '../assets/images/gilli_3d_logo_1781529764992.jpg';
import kabaddiLogo from '../assets/images/kabaddi_3d_logo_1781529809409.jpg';
import kanchaLogo from '../assets/images/kancha_3d_logo_1781529795855.jpg';
import lagoriLogo from '../assets/images/lagori_3d_logo_1781529780638.jpg';
import ludoLogo from '../assets/images/ludo_3d_logo_1781529851748.jpg';
import quizLogo from '../assets/images/quiz_3d_logo_1781529904429.jpg';
import snakeLogo from '../assets/images/snake_3d_logo_1781529824487.jpg';
import snakesladdersLogo from '../assets/images/snakesladders_3d_logo_1781529865363.jpg';
import tictactoeLogo from '../assets/images/tictactoe_3d_logo_1781529838123.jpg';
import truthdareLogo from '../assets/images/truthdare_3d_logo_1781529890548.jpg';

const CATEGORIES = [
  { id: "all", label: "🎯 All" },
  { id: "indian", label: "🏏 Indian" },
  { id: "classic", label: "🕹️ Classic" },
  { id: "social", label: "👥 Social" },
  { id: "hot", label: "🔥 Hot Now" }
];

const GAMES = [
  { id: "gilli", title: "Gilli Danda", category: "indian", rating: "4.8", players: "12K", score: "840", color: "from-orange-500", hot: true, image: gilliLogo },
  { id: "lagori", title: "Lagori", category: "indian", rating: "4.6", players: "8.2K", score: "120", color: "from-orange-400", new: true, image: lagoriLogo },
  { id: "kancha", title: "Kancha Strike", category: "indian", rating: "4.9", players: "24K", score: "2400", color: "from-blue-500", new: true, image: kanchaLogo },
  { id: "kabaddi", title: "Kabaddi", category: "indian", rating: "4.8", players: "32K", score: "150", color: "from-red-500", hot: true, image: kabaddiLogo },
  
  { id: "snake", title: "Snake", category: "classic", rating: "4.9", players: "120K", score: "2450", color: "from-green-400", hot: true, image: snakeLogo },
  { id: "tictactoe", title: "Tic Tac Toe", category: "classic", rating: "4.5", players: "54K", score: "89", color: "from-cyan-400", image: tictactoeLogo },
  { id: "ludo", title: "Ludo", category: "classic", rating: "4.9", players: "800K", score: "Turn: 3", color: "from-yellow-400", hot: true, image: ludoLogo },
  { id: "snakesladders", title: "Snakes & Ladders", category: "classic", rating: "4.6", players: "40K", score: "0", color: "from-rose-400", image: snakesladdersLogo },
  
  { id: "truthdare", title: "Truth or Dare", category: "social", rating: "4.8", players: "300K", score: "0", color: "from-pink-500", hot: true, image: truthdareLogo },
  { id: "quiz", title: "Quiz Battle", category: "social", rating: "4.9", players: "150K", score: "Q: 7/10", color: "from-purple-500", image: quizLogo },
  { id: "emoji", title: "Emoji Guess", category: "social", rating: "4.7", players: "90K", score: "18", color: "from-indigo-400", new: true, image: emojiLogo }
];

const RECENT_GAMES = [
  { id: "lagori", scoreRef: "Score", scoreValue: "120" },
  { id: "snake", scoreRef: "Score", scoreValue: "240" },
  { id: "quiz", scoreRef: "Q", scoreValue: "7/10" }
];

export function SkrimGamesSection() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);

  const filteredGames = React.useMemo(() => {
    if (activeCategory === "all") return GAMES;
    if (activeCategory === "hot") return GAMES.filter(g => g.hot);
    return GAMES.filter(g => g.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="relative min-h-[80vh] w-full rounded-3xl overflow-hidden bg-[#080810] border border-white/10 mb-8 pt-4 pb-12">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idHJhbnNwYXJlbnQiIC8+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiIC8+CjxwYXRoIGQ9Ik0wIDAuNWg0ME0wIDQwLjVoNDBNMC41IDB2NDBNNDAuNSAwdi00MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiIC8+Cjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative z-10 px-4 md:px-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mt-2 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] flex items-center gap-2 drop-shadow-[0_0_15px_rgba(176,38,255,0.4)]">
              <Gamepad2 className="w-8 h-8 text-[#00F0FF]" />
              SkrimGames
            </h2>
            <p className="text-white/60 text-sm font-medium animate-pulse">"Play. Win. Repeat." ⚡</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-xl">
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm tracking-tight">2,450</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-white font-bold text-xs">#4 Rank</span>
            </div>
          </div>
        </div>

        {/* Offline Banner */}
        <AnimatePresence>
          {showOfflineBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-3 mb-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-lg">📴</span>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold text-sm">All games work offline!</h4>
                  <p className="text-emerald-400/70 text-xs">Play anywhere, anytime ⚡</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOfflineBanner(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500/20 transition-colors"
              >
                <X className="w-4 h-4 text-emerald-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Playing */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00F0FF]" />
            Continue Playing
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {RECENT_GAMES.map((recent, idx) => {
              const game = GAMES.find(g => g.id === recent.id);
              if (!game) return null;
              return (
                <div key={idx} className="shrink-0 w-[160px] bg-white/5 border border-white/10 p-3 rounded-2xl hover:border-white/30 transition-colors group cursor-pointer">
                  <h4 className="text-white font-bold text-sm tracking-tight mb-1 truncate">{game.title}</h4>
                  <div className="text-[#00F0FF] text-xs font-mono font-medium mb-3">
                    {recent.scoreRef}: {recent.scoreValue}
                  </div>
                  <button 
                    onClick={() => navigate(`/games/${recent.id}`)}
                    className="w-full py-1.5 rounded-lg bg-white/10 group-hover:bg-[#00F0FF] group-hover:text-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Resume <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-2 mb-6">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeCategory === category.id 
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' 
                  : 'bg-white/5 text-white/70 hover:bg-white/15'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                key={game.id}
                className="bg-[#12121C] border border-white/5 rounded-2xl overflow-hidden group hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all cursor-pointer flex flex-col"
              >
                {/* Game Art Container */}
                <div className={`w-full h-[120px] md:h-[140px] bg-gradient-to-br ${game.color} to-black/80 relative overflow-hidden flex items-center justify-center p-4`}>
                   {game.hot && (
                     <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-0.5 z-10">
                       <FlameIcon className="w-3 h-3" /> HOT
                     </div>
                   )}
                   {game.new && (
                     <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg z-10">
                       NEW
                     </div>
                   )}
                   <motion.img 
                     src={game.image} 
                     alt={`${game.title} 3D Logo`} 
                     className="w-full h-full object-cover mix-blend-screen opacity-90 absolute inset-0 blur-sm pointer-events-none"
                   />
                   <motion.img 
                     src={game.image} 
                     alt={`${game.title} 3D Logo`} 
                     className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl shadow-2xl relative z-0"
                     animate={{ 
                        y: [-5, 5, -5],
                        rotateX: [-5, 5, -5],
                        rotateY: [-5, 5, -5]
                     }}
                     transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                     }}
                   />
                </div>

                <div className="p-3.5 flex-1 flex flex-col">
                  <h3 className="text-white font-bold text-sm tracking-tight mb-1.5">{game.title}</h3>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="flex items-center gap-0.5 text-white/70 text-xs font-medium">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {game.rating}
                    </span>
                    <span className="flex items-center gap-1 text-white/70 text-xs font-medium">
                      <Users className="w-3 h-3" /> {game.players}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    {game.score !== "0" && (
                      <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">
                        🏆 Your: {game.score}
                      </div>
                    )}
                    <button 
                      onClick={() => navigate(`/games/${game.id}`)}
                      className="w-full bg-white/5 group-hover:bg-[#00F0FF] text-white group-hover:text-black border border-white/10 group-hover:border-[#00F0FF] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}