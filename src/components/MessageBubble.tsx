import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Clock, Play, Pause, File, Download, MapPin, ExternalLink, Music, Crown } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Message, Mood, Theme } from '../types';
import { CHAT_MOODS } from '../constants/moods';

interface Props {
  message: Message;
  isConsecutiveTop: boolean;
  isConsecutiveBottom: boolean;
  mood?: Mood;
  theme: Theme;
  onLongPress?: () => void;
  onReactionClick?: () => void;
  onAcceptChallenge?: () => void;
  onDeclineChallenge?: () => void;
  onRematchChallenge?: () => void;
}

const useVoicePlayback = (duration: number) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  const speedOptions = [1, 1.5, 2];

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = speedOptions.indexOf(speed);
    const next = (current + 1) % speedOptions.length;
    setSpeed(speedOptions[next]);
  };

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setElapsed(e => {
        const next = e + (0.1 * speed);
        if (next >= duration) {
          setPlaying(false);
          setProgress(0);
          return 0; // return 0 instead of next for elapsed to reset immediately on end
        }
        setProgress(next / duration);
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [playing, speed, duration]);
  
  // reset on completion
  useEffect(() => {
      if(progress >= 1) {
          setPlaying(false);
          setProgress(0);
          setElapsed(0);
      }
  }, [progress])

  return { playing, setPlaying, progress, speed, cycleSpeed, elapsed, setProgress, setElapsed };
};

const VoiceContent = ({ message, isMe }: { message: any, isMe: boolean }) => {
  const { duration, waveform = Array(40).fill(0.2), played } = message;
  const { playing, setPlaying, progress, speed, cycleSpeed, elapsed, setProgress, setElapsed } = useVoicePlayback(duration);
  const [hasPlayed, setHasPlayed] = useState(played || false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPlayed && !isMe) setHasPlayed(true);
    if(playing) {
        setPlaying(false);
    } else {
        if(progress >= 1) {
            setProgress(0);
            setElapsed(0);
        }
        setPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const clickProgress = Math.max(0, Math.min(1, x / bounds.width));
    setProgress(clickProgress);
    setElapsed(clickProgress * duration);
  };

  const displayTime = playing ? Math.ceil(duration - elapsed) : duration;
  const mins = Math.floor(displayTime / 60);
  const secs = Math.floor(displayTime % 60).toString().padStart(2, '0');

  // Colors
  const playBtnBg = isMe ? 'bg-white text-purple-600' : 'bg-white/20 text-white backdrop-blur-md';
  const playedBarColor = isMe ? 'bg-white' : 'bg-white';
  const unplayedBarColor = isMe ? 'bg-white/30' : 'bg-white/20';

  return (
    <div className="flex flex-col p-2 min-w-[220px]">
      <div className="flex items-center gap-3">
        {/* Play Button */}
        <button 
          onClick={togglePlay}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${playBtnBg}`}
        >
          {playing ? <Pause size={20} className={isMe ? 'fill-current' : ''} /> : <Play size={20} className={isMe ? 'fill-current ml-0.5' : 'ml-0.5'} />}
          {!hasPlayed && !isMe && !playing && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A1A24]" />
          )}
        </button>

        {/* Waveform & Time */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div 
            className="flex items-center gap-0.5 h-6 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
            onClick={handleSeek}
          >
            {waveform.map((val: number, i: number) => {
              const isPlayed = (i / waveform.length) <= progress;
              return (
                <div 
                  key={i}
                  className={`w-1 rounded-full ${isPlayed ? playedBarColor : unplayedBarColor}`}
                  style={{ height: `${Math.max(15, val * 100)}%`, transition: 'background-color 0.1s' }}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center px-1">
             <span className="text-[11px] font-mono text-white/80 select-none">
               {mins}:{secs}
             </span>
             <button 
               onClick={cycleSpeed}
               className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none ${
                 speed === 1 ? 'bg-white/10 text-white/80' : 
                 speed === 1.5 ? 'bg-white/80 text-purple-600' : 
                 'bg-neon-purple text-white shadow-[0_0_8px_rgba(176,38,255,0.6)]'
               }`}
             >
               {speed}x
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const defaultSentGradient = 'linear-gradient(135deg, #7B2FF7, #B026FF)';

export function MessageBubble({ message, isConsecutiveTop, isConsecutiveBottom, mood, theme, onLongPress, onReactionClick, onAcceptChallenge, onDeclineChallenge, onRematchChallenge }: Props) {
  const isMe = message.sender === 'me';
  
  const [isActive, setIsActive] = useState(false);
  const pressTimer = useRef<any>(null);

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      setIsActive(true);
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress?.();
      // Remove active state after a bit or let parent handle, but for scale we can just revert
      setTimeout(() => setIsActive(false), 200);
    }, 350);
  };

  const clearTimer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setIsActive(false);
  };

  // Border radius logic based on consecutive messages
  // Normally:
  // Me: top-right 18, bottom-right 4, top-left 18, bottom-left 18
  // Them: top-left 18, bottom-left 4, top-right 18, bottom-right 18
  
  let borderRadius = '';
  if (isMe) {
    const tr = isConsecutiveTop ? '4px' : '18px';
    const br = isConsecutiveBottom ? '4px' : '4px';
    borderRadius = `18px ${tr} ${br} 18px`;
  } else {
    const tl = isConsecutiveTop ? '4px' : '18px';
    const bl = isConsecutiveBottom ? '4px' : '4px';
    borderRadius = `${tl} 18px 18px ${bl}`;
  }

  const wrapperProps = {
    className: `flex w-full mb-${isConsecutiveBottom ? '1' : '3'} ${isMe ? 'justify-end' : 'justify-start'}`,
  };

  const bubbleStyle: React.CSSProperties = {
    borderRadius,
    maxWidth: '75%',
    position: 'relative',
  };

  const isPulsed = message.type === 'text' && message.isPulsed;

  if (message.type === 'gif' || message.type === 'sticker' || message.type === 'photo' || message.type === 'video' || message.type === 'file' || message.type === 'song' || message.type === 'location' || message.type === 'challenge' || message.type === 'challenge_result') {
    bubbleStyle.background = 'transparent';
    bubbleStyle.border = 'none';
    bubbleStyle.boxShadow = 'none';
    bubbleStyle.backdropFilter = 'none';
  } else {
    if (isMe) {
      const currentMoodObj = CHAT_MOODS.find(m => m.id === message.mood);
      bubbleStyle.background = currentMoodObj ? `linear-gradient(135deg, ${currentMoodObj.bubbleGradient[0]}, ${currentMoodObj.bubbleGradient[1]})` : defaultSentGradient;
      bubbleStyle.boxShadow = `0 2px 12px ${currentMoodObj ? currentMoodObj.glow : 'rgba(176,38,255,0.3)'}`;
    } else {
      bubbleStyle.background = 'rgba(255,255,255,0.08)';
      bubbleStyle.backdropFilter = 'blur(10px)';
      bubbleStyle.border = isPulsed ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.06)';
      if (isPulsed) {
        bubbleStyle.boxShadow = '0 0 10px rgba(255,215,0,0.5)';
      }
    }

    if (isMe && isPulsed) {
      bubbleStyle.border = '1px solid #FFD700';
      bubbleStyle.boxShadow = '0 0 10px rgba(255,215,0,0.5), 0 2px 12px rgba(176,38,255,0.3)';
    }
  }

  const renderStatus = () => {
    if (!isMe || !message.status) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock size={12} className="text-white/60 ml-1 inline" />;
      case 'sent':
        return <Check size={14} className="text-white/60 ml-1 inline" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-white/60 ml-1 inline" />;
      case 'read':
        return <CheckCheck size={14} className="text-[#00B4FF] ml-1 inline drop-shadow-[0_0_2px_rgba(0,180,255,0.8)]" />;
    }
  };

  const renderTimeAndStatus = () => (
    <div className={`text-[10px] text-white/50 flex items-center mt-1 select-none ${isMe ? 'justify-end' : 'justify-start'}`}>
      {message.time} {isMe && renderStatus()}
    </div>
  );

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="px-4 py-2.5 text-[15px] leading-relaxed text-white break-words">
            {isPulsed && <div className="text-[#FFD700] text-sm font-bold flex items-center gap-1 mb-1">⚡ {message.text} ⚡</div>}
            {!isPulsed && message.text}
            {isPulsed && <div className="text-[#FFD700]/80 text-[10px] mt-1">[Pulsed with energy! 🔥]</div>}
          </div>
        );
      
      case 'voice':
        return <VoiceContent message={message} isMe={isMe} />;

      case 'gif':
        return (
          <div 
            className="rounded-2xl overflow-hidden flex items-center justify-center relative w-48 h-32"
            style={{ background: `linear-gradient(135deg, ${message.gif.color}40, ${message.gif.color})` }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="flex flex-col items-center z-10">
               <span className="text-6xl filter drop-shadow-md mb-2" style={{ animation: `gif-${message.gif.animation} 2s infinite` }}>
                 {message.gif.emoji}
               </span>
               <span className="text-[11px] text-white/90 font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded backdrop-blur-sm">
                 {message.gif.label}
               </span>
            </div>
          </div>
        );

      case 'sticker':
        return (
          <motion.div 
            whileTap={{ scale: 0.85, transition: { duration: 0.1 } }}
            className="flex flex-col items-center justify-center p-2 mb-2 select-none"
          >
            <span className="text-[80px] leading-none mb-1 filter drop-shadow-xl animate-spring-pop hover:animate-pill-bounce cursor-pointer">
              {message.sticker.emoji}
            </span>
            <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md">
              {message.sticker.label}
            </span>
          </motion.div>
        );

      case 'challenge':
        const isChallenger = isMe;
        return (
          <div className={`p-4 min-w-[240px] ${isMe ? 'opacity-90' : ''}`} style={{
            border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #10b981',
            borderRadius: borderRadius,
            background: isMe ? 'transparent' : 'rgba(16, 185, 129, 0.1)',
          }}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isMe ? 'text-white/70' : 'text-[#10b981]'}`}>
              🎮 Game Challenge!
            </div>
            
            <div className="flex flex-col items-center mb-3 text-center">
              <span className="text-4xl drop-shadow-md">{message.gameEmoji}</span>
              <span className="font-bold text-lg text-white mt-1">{message.gameLabel}</span>
            </div>

            <div className="bg-black/20 p-3 rounded-lg mb-3">
              <p className="text-white text-sm font-medium italic">"{message.challengeMessage}"</p>
            </div>

            {message.score !== undefined && (
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-white/70">🏆 Score to beat:</span>
                <span className="text-yellow-400 font-bold">{message.score} ⚡</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[11px] text-white/50 mb-4 font-mono bg-black/30 p-2 rounded">
              <span>⏰ Expires in</span>
              <span>{Math.max(1, Math.floor((message.expiresAt - Date.now()) / 3600000))}h</span>
            </div>

            {message.challengeStatus === 'pending' ? (
              isMe ? (
                <div className="w-full text-center text-xs text-white/50 bg-black/20 py-2 rounded-lg py-2.5">
                  [Waiting for response... ⏳]
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={onAcceptChallenge} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                    🎮 Accept!
                  </button>
                  <button onClick={onDeclineChallenge} className="bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium px-4 py-2.5 rounded-lg transition-colors">
                    Decline
                  </button>
                </div>
              )
            ) : message.challengeStatus === 'accepted' ? (
              <div className="w-full text-center text-xs text-white/80 bg-blue-500/20 text-blue-300 py-2.5 rounded-lg">
                Playing now... 🎯
              </div>
            ) : message.challengeStatus === 'declined' ? (
              <div className="w-full text-center text-xs text-white/50 bg-black/20 py-2.5 rounded-lg">
                Declined 😅
              </div>
            ) : (
               <div className="w-full text-center text-xs text-white/40 bg-black/20 py-2.5 rounded-lg">
                Expired ⏰
              </div>
            )}
          </div>
        );

      case 'challenge_result':
        const iWon = message.winnerId === (isMe ? message.challengerId : message.opponentId);
        const isTie = message.winnerId === 'tie';
        const color = isTie ? 'border-gray-500 text-gray-400 bg-gray-500/10' : iWon ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-purple-500 text-purple-400 bg-purple-500/10';
        const titleEmoji = isTie ? '🤝' : iWon ? '🏆' : '😱';
        
        return (
          <div className={`p-4 min-w-[240px] border ${color}`} style={{ borderRadius }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2">
              {titleEmoji} Challenge Result!
            </div>
            
            <div className="flex flex-col items-center mb-3">
              <span className="text-3xl mb-1">{message.gameEmoji}</span>
              <span className="font-bold text-white mb-2">{message.gameLabel}</span>
            </div>

            <div className="space-y-1 mb-3 text-sm">
              <div className="flex justify-between items-center text-white">
                <span className="font-medium">{message.challengerName}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{message.challengerScore} ⚡</span>
                  {message.winnerId === message.challengerId && <span className="text-xs">👑 WINNER!</span>}
                </div>
              </div>
               <div className="flex justify-between items-center text-white">
                <span className="font-medium">{message.opponentName}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{message.opponentScore} ⚡</span>
                  {message.winnerId === message.opponentId && <span className="text-xs">👑 WINNER!</span>}
                </div>
              </div>
            </div>

            <div className="bg-black/20 p-2 rounded mb-3 text-center">
              <p className="text-white/80 text-xs italic">"{message.resultMessage}"</p>
            </div>

            <div className="flex gap-2">
               <button onClick={onRematchChallenge} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1">
                  🔄 Rematch!
               </button>
               {!iWon && !isTie && (
                  <button onClick={onAcceptChallenge} className="bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium px-3 py-2 rounded transition-colors">
                     😤 Accept
                  </button>
               )}
            </div>
          </div>
        );

      case 'photo':
        const isPhotoUploading = (message.uploadProgress ?? 100) < 100;
        return (
          <div className="flex flex-col">
             <div 
               onClick={!isPhotoUploading ? () => window.dispatchEvent(new CustomEvent('open-media-viewer', { detail: message })) : undefined}
               className={`w-[220px] aspect-[4/5] rounded-xl flex flex-col relative overflow-hidden ${!isPhotoUploading ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`} 
               style={{ 
                 backgroundColor: message.photo.color, 
                 filter: isPhotoUploading ? 'blur(4px)' : 'none',
                 transition: 'filter 0.3s ease'
               }}
             >
                {/* Mock photo content */}
                <div 
                  className="flex-1 flex items-center justify-center text-8xl"
                  style={{ 
                    filter: message.photo.filter === 'Vivid' ? 'saturate(200%)' : message.photo.filter === 'Cool' ? 'hue-rotate(90deg)' : message.photo.filter === 'Warm' ? 'sepia(50%)' : 'none'
                  }}
                >
                  {message.photo.emoji}
                </div>
             </div>
             
             {isPhotoUploading && (
               <div className="mt-2 px-1 text-white text-xs font-mono flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-purple rounded-full" style={{ width: `${message.uploadProgress}%` }} />
                 </div>
                 {Math.round(message.uploadProgress || 0)}%
               </div>
             )}
             
             {message.photo.caption && !isPhotoUploading && (
               <div className="px-2 pt-2 pb-1 text-sm text-white max-w-[220px] break-words">
                 {message.photo.caption}
               </div>
             )}
          </div>
        );

      case 'video':
        const isVideoUploading = (message.uploadProgress ?? 100) < 100;
        return (
          <div className="flex flex-col">
             <div 
               onClick={!isVideoUploading ? () => window.dispatchEvent(new CustomEvent('open-media-viewer', { detail: message })) : undefined}
               className={`w-[240px] aspect-video rounded-xl flex relative overflow-hidden ${!isVideoUploading ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`} 
               style={{ 
                 backgroundColor: message.video.color,
                 filter: isVideoUploading ? 'blur(4px)' : 'none',
                 transition: 'filter 0.3s ease'
               }}
             >
                <div className="flex-1 flex items-center justify-center text-6xl">
                  {message.video.emoji}
                </div>
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center pointer-events-none">
                   {!isVideoUploading && <Play fill="white" size={32} className="text-white opacity-90 drop-shadow-lg" />}
                </div>
                {!isVideoUploading && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono flex items-center gap-1 backdrop-blur-sm">
                    <Play size={8} fill="white" /> {message.video.duration}
                  </div>
                )}
             </div>
             
             {isVideoUploading && (
               <div className="mt-2 px-1 text-white text-xs font-mono flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-purple rounded-full" style={{ width: `${message.uploadProgress}%` }} />
                 </div>
                 {Math.round(message.uploadProgress || 0)}%
               </div>
             )}
          </div>
        );

      case 'file':
        const isFileUploading = (message.uploadProgress ?? 100) < 100;
        const [downloading, setDownloading] = useState(false);
        const [downloaded, setDownloaded] = useState(false);
        
        const handleDownload = () => {
           setDownloading(true);
           setTimeout(() => {
              setDownloading(false);
              setDownloaded(true);
           }, 1500);
        };
        
        return (
          <div className="flex flex-col">
            <div className={`p-4 rounded-xl flex items-center gap-3 w-[260px] ${isMe ? 'bg-black/20 border border-white/10' : 'bg-black/40 border border-white/10'}`}>
               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${message.file.fileType === 'pdf' ? 'bg-red-500/20 text-red-400' : message.file.fileType === 'excel' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                 <File size={24} />
               </div>
               <div className="flex-1 overflow-hidden flex flex-col justify-center">
                 <div className="text-white text-sm font-bold truncate mb-1">{message.file.name}</div>
                 <div className="text-white/50 text-[11px] font-medium whitespace-nowrap">{message.file.size} · {message.file.fileType.toUpperCase()}</div>
               </div>
               
               {!isFileUploading && (
                 <button 
                   onClick={handleDownload}
                   disabled={downloading || downloaded}
                   className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                 >
                   {downloading ? <Clock size={16} className="animate-spin" /> : downloaded ? <Check size={16} className="text-green-400" /> : <Download size={16} />}
                 </button>
               )}
            </div>
            
            {isFileUploading && (
               <div className="mt-2 px-1 text-white text-xs font-mono flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-purple rounded-full" style={{ width: `${message.uploadProgress}%` }} />
                 </div>
                 {Math.round(message.uploadProgress || 0)}%
               </div>
            )}
          </div>
        );

      case 'song':
        return (
          <div className={`p-3 rounded-2xl flex items-center gap-3 w-[260px] relative overflow-hidden backdrop-blur-md border border-white/10 shadow-lg`} style={{ background: `linear-gradient(135deg, ${message.song.color}40, rgba(0,0,0,0.6))` }}>
             <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-screen opacity-20 filter blur-xl" style={{ backgroundColor: message.song.color }}></div>
             <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md relative z-10" style={{ backgroundColor: message.song.color }}>
               {/* Mock album art just uses the color icon */}
               <Music size={24} className="text-white/80" />
             </div>
             <div className="flex-1 z-10">
               <div className="text-white text-sm font-bold truncate">{message.song.title}</div>
               <div className="text-white/70 text-[10px] uppercase tracking-wider mb-2">{message.song.movie} · {message.song.artist}</div>
               
               {/* Mini player mock */}
               <div className="flex items-center gap-2">
                 <button className="text-white hover:text-neon-purple"><Play size={12} fill="currentColor" /></button>
                 <div className="flex-1 h-1 bg-white/20 rounded-full relative">
                   <div className="absolute inset-y-0 left-0 bg-white rounded-full w-1/3"></div>
                 </div>
                 <span className="text-[10px] text-white font-mono">{message.song.duration}</span>
               </div>
             </div>
          </div>
        );

      case 'location':
        return (
          <div className="flex flex-col bg-black/40 rounded-2xl border border-white/10 overflow-hidden w-[240px]">
             <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-teal-600/40 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                <MapPin size={28} className="text-red-500 drop-shadow-md z-10" fill="currentColor" />
             </div>
             <div className="p-3">
                <div className="text-white font-bold text-sm tracking-tight">{message.location.name}</div>
                <div className="text-white/50 text-xs mb-2">{message.location.country}</div>
                <button className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex justify-center items-center gap-1.5 transition-colors">
                  <ExternalLink size={12} /> Open Map
                </button>
             </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-1">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="rounded-xl w-full max-w-[240px] object-cover bg-white/5" 
            />
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div {...wrapperProps}>
       {!isMe && message.senderAvatar && !isConsecutiveTop && (
          <div className="flex flex-col items-center mr-2 w-8 h-8 rounded-full overflow-visible shrink-0 self-end mb-1 relative">
              <img src={message.senderAvatar} className="w-8 h-8 rounded-full bg-white/10" />
              {message.senderIsAdmin && (
                 <div className="absolute -bottom-1 -right-1 bg-[#1A1A24] rounded-full p-[2px] border-2 border-[#1A1A24]">
                    <Crown size={10} className="text-yellow-500 fill-yellow-500" />
                 </div>
               )}
          </div>
       )}
       {!isMe && message.senderAvatar && isConsecutiveTop && (
          <div className="w-8 mr-2 shrink-0 self-end" />
       )}
      <div className="flex flex-col relative w-full items-[inherit]" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {!isMe && message.senderName && !isConsecutiveTop && (
           <span className="text-[11px] font-bold mb-1 ml-1" style={{ color: message.senderColor || '#B026FF' }}>
              {message.senderName}
           </span>
        )}
        <motion.div 
          onPointerDown={handlePointerDown}
          onPointerUp={clearTimer}
          onPointerCancel={clearTimer}
          onPointerLeave={clearTimer}
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={bubbleStyle}
          className="select-none cursor-pointer"
        >
          {message.replyTo && (
            <div className={`mx-3 mt-3 mb-1 p-2 rounded-lg text-[13px] border-l-2 ${isMe ? 'bg-black/20 border-white/50 text-white/90' : 'bg-white/10 border-neon-purple text-white/80'}`}>
              <div className="font-bold text-xs mb-0.5" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : '#B026FF' }}>{message.replyTo.senderName}</div>
              <div className="truncate opacity-80">{message.replyTo.text}</div>
            </div>
          )}
          {renderContent()}
        </motion.div>
        
        {/* Reactions Pill */}
        <AnimatePresence>
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1.2, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`absolute -bottom-4 ${isMe ? 'left-6' : 'right-6'} bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-2 py-1 flex items-center gap-1 shadow-lg cursor-pointer z-10 hover:scale-105 active:scale-95`}
            onClick={onReactionClick}
          >
            {Object.entries(message.reactions).map(([emoji, users], idx) => (
              <motion.div 
                key={emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-xs font-bold flex items-center gap-0.5 ${emoji === '⚡' ? 'text-yellow-400' : 'text-white/80'}`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>

        {!isConsecutiveBottom && <div className={message.reactions && Object.keys(message.reactions).length > 0 ? "mt-4" : ""}>{renderTimeAndStatus()}</div>}
      </div>
    </div>
  );
}


