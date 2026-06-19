import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Heart, MessageCircle, Zap, Share2, ArrowLeft } from 'lucide-react';
import { ChatBackground } from '../components/ChatBackground';
import { ChatHeader } from '../components/ChatHeader';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { GameChallengePicker } from '../components/GameChallengePicker';
import { GameModal } from '../components/GameModal';
import { Message, Theme, Mood } from '../types';
import { AVAILABLE_GAMES } from '../constants/games';

import { SparkFlowDetailModal } from '../components/SparkFlowDetailModal';
import { SparkFlowMilestoneModal, BrokenSparkFlowScreen } from '../components/SparkFlowScreens';
import { getSparkFlow, updateSparkFlow, SparkFlowData } from '../lib/sparkFlowEngine';
import { CHAT_MOODS } from '../constants/moods';
import { CHAT_THEMES } from '../constants/themes';
import { useChatEnergy } from '../hooks/useChatEnergy';

const generateWaveform = (barCount = 40) => {
  return Array.from({ length: barCount }, () => {
    const base = 0.2 + Math.random() * 0.4;
    const spike = Math.random() > 0.8 ? Math.random() * 0.4 : 0;
    return Math.min(base + spike, 1.0);
  });
};

const MOCK_MESSAGES: Message[] = [
  { id: (Date.now() - 1250000).toString(), sender: "them", text: "Hey! Did you watch that new video? 🔥", time: "10:32 AM", type: "text", mood: "hype" },
  { id: (Date.now() - 1240000).toString(), sender: "me", text: "Yes!! It was so good 😂😂", time: "10:33 AM", type: "text", status: "read", mood: "hype" },
  { id: (Date.now() - 1230000).toString(), sender: "them", time: "10:34 AM", type: "voice", duration: 24, waveform: generateWaveform(), mood: "chill" },
  { id: (Date.now() - 1220000).toString(), sender: "me", time: "10:35 AM", type: "voice", duration: 8, waveform: generateWaveform(), status: "read", mood: "chill" },
  { id: (Date.now() - 1210000).toString(), sender: "me", text: "Sending you something 👀", time: "10:35 AM", type: "text", status: "delivered", mood: "chill" },
  { id: (Date.now() - 1200000).toString(), sender: "them", time: "10:38 AM", type: "voice", duration: 47, waveform: generateWaveform(), mood: "happy" },
  { id: (Date.now() - 10000).toString(), sender: "me", text: "HAHA this is amazing 😭🔥", time: "10:39 AM", type: "text", status: "read", mood: "happy" },
  { 
    id: "ch1", 
    type: "challenge", 
    sender: "them", 
    game: "emoji_guess", 
    gameLabel: "Emoji Guess", 
    gameEmoji: "🎯", 
    score: 850, 
    challengeMessage: "Bet you can't beat my 850! 😎🎯", 
    challengeStatus: "pending", 
    expiresAt: Date.now() + 82800000, 
    time: "10:40 AM" 
  }
];

export default function ChatThreadScreen() {
  const navigate = useNavigate();
  const { id: chatId } = useParams();
  
  // mock users 
  const recipientUser = { displayName: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200' };

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const chatId = window.location.pathname.split('/chat/')[1] || 'default';
      const stored = localStorage.getItem(`skrimchat_messages_${chatId}`);
      let base: Message[] = MOCK_MESSAGES;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) base = parsed;
      }
      // Merge in any Spark shares / reposts sent via SparkViewer (skrimchat_custom_chats)
      const customChatsStr = localStorage.getItem('skrimchat_custom_chats');
      if (customChatsStr) {
        const customChats = JSON.parse(customChatsStr);
        const incoming = customChats[chatId];
        if (Array.isArray(incoming) && incoming.length > 0) {
          const existingIds = new Set(base.map((m: any) => m.id));
          const fresh = incoming.filter((m: any) => !existingIds.has(m.id));
          if (fresh.length > 0) {
            base = [...base, ...fresh].sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
            // Clear consumed custom chat entries so they don't duplicate on next load
            delete customChats[chatId];
            localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
          }
        }
      }
      return base;
    } catch (e) {}
    return MOCK_MESSAGES;
  });
  const [showGamePicker, setShowGamePicker] = useState(false);
  
  const [themeId, setThemeId] = useState<string>(() => {
     const stored = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored).themeId; } catch (e) {}
     }
     return 'dark_space';
  });
  
  const [energyOn, setEnergyOn] = useState<boolean>(() => {
     const stored = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored).energyOn; } catch (e) {}
     }
     return true;
  });

  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [previewThemeId, setPreviewThemeId] = useState<string>('');

  const moodStored = localStorage.getItem('chat_mood');
  const [mood, setMood] = useState<Mood>(() => {
    if (moodStored) {
      try {
        const parsed = JSON.parse(moodStored);
        if (new Date().toDateString() === new Date(parsed.timestamp).toDateString()) {
           return parsed.mood;
        }
      } catch (e) {}
    }
    return null;
  });
  
  const [otherMood, setOtherMood] = useState<Mood>('chill');
  
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [moodNotification, setMoodNotification] = useState<{name: string, mood: string} | null>(null);
  const [reactionToast, setReactionToast] = useState<{name: string, emoji: string, moodEmoji: string, moodLabel: string} | null>(null);

  useEffect(() => {
    if (mood) {
      localStorage.setItem('chat_mood', JSON.stringify({ mood, timestamp: Date.now() }));
    } else {
      localStorage.removeItem('chat_mood');
    }
  }, [mood]);
  
  useEffect(() => {
     if (showThemeSelector) setPreviewThemeId(themeId);
  }, [showThemeSelector, themeId]);
  
  const handleApplyTheme = () => {
     setThemeId(previewThemeId);
     localStorage.setItem(`chat_theme_${chatId || 'default'}`, JSON.stringify({
        themeId: previewThemeId,
        energyOn: energyOn
     }));
     setShowThemeSelector(false);
  };
  
  const handleEnergyToggle = () => {
      const newVal = !energyOn;
      setEnergyOn(newVal);
      localStorage.setItem(`chat_theme_${chatId || 'default'}`, JSON.stringify({
        themeId: themeId,
        energyOn: newVal
     }));
  }

  const energyLevel = useChatEnergy(messages);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [reactionSheetMessage, setReactionSheetMessage] = useState<Message | null>(null);
  const [mediaViewer, setMediaViewer] = useState<any>(null);

  const [sparkFlow, setSparkFlow] = useState<SparkFlowData | null>(null);
  const [showSparkDetail, setShowSparkDetail] = useState(false);
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [showBrokenFlow, setShowBrokenFlow] = useState<number | null>(null);
  
  const [activeChallengeMessage, setActiveChallengeMessage] = useState<Message | null>(null);

  const [sendRipple, setSendRipple] = useState<{id: string, color: string} | null>(null);

  useEffect(() => {
    if (chatId) {
      const flow = getSparkFlow(chatId);
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const today = new Date().toDateString();
      if (flow && flow.lastDate !== today && flow.lastDate !== yesterday && flow.count > 1 && !flow.isFrozen) {
         setShowBrokenFlow(flow.bestSparkFlow);
      } else {
         setSparkFlow(flow);
      }
    }
    
    const handleOpenMediaViewer = (e: any) => setMediaViewer(e.detail);
    window.addEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
    return () => window.removeEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
  }, []);
  
  const triggerSparkFlowUpdate = () => {
    if (chatId) {
      const { sparkFlow: newFlow, milestoneReached } = updateSparkFlow(chatId);
      setSparkFlow(newFlow);
      if (milestoneReached) setShowMilestone(milestoneReached);
    }
  };

  const executeSendRipple = () => {
     let color = 'white';
     if (mood) {
         const obj = CHAT_MOODS.find(m => m.id === mood);
         if (obj) color = obj.bubbleGradient[0];
     } else {
         const tobj = CHAT_THEMES.find(t => t.id === themeId);
         if (tobj) color = tobj.orbs[0];
     }
     setSendRipple({ id: Date.now().toString(), color });
     setTimeout(() => setSendRipple(null), 600);
  }

  const handleSetMood = (newMood: Mood) => {
    setMood(newMood);
    if (newMood) {
      setTimeout(() => {
        const nextMood = newMood === 'chill' ? 'love' : 'chill';
        const nextMoodObj = CHAT_MOODS.find(m => m.id === nextMood);
        if (nextMoodObj) {
           setOtherMood(nextMood);
           setMoodNotification({ name: 'Priya', mood: `${nextMoodObj.emoji} ${nextMoodObj.label}` });
           setTimeout(() => setMoodNotification(null), 3000);
        }
      }, 5000);
    }
  };

  // Persist messages to localStorage on every change
  React.useEffect(() => {
    try {
      const chatId = window.location.pathname.split('/chat/')[1] || 'default';
      if (messages.length > 0) {
        // Keep last 100 messages only
        const toStore = messages.slice(-100);
        localStorage.setItem(`skrimchat_messages_${chatId}`, JSON.stringify(toStore));
      }
    } catch (e) {}
  }, [messages]);

  const handleSendMessage = (text: string, isPulsed: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      mood: mood || undefined,
      status: 'sending',
      isPulsed,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.sender === 'me' ? 'You' : 'Priya Sharma',
        text: replyingTo.type === 'text' ? replyingTo.text : 'Attachment'
      } : undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    triggerSparkFlowUpdate();
    executeSendRipple();

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
      }, 1000);
    }, 800);
    
    if (messages.length % 2 === 0) {
      setTimeout(() => {
        setIsOtherTyping(true);
        setTimeout(() => {
          setIsOtherTyping(false);
          const reply: Message = {
             id: Date.now().toString(),
             sender: 'them',
             type: 'text',
             text: 'I know right?! 🤯 So crazy',
             mood: otherMood,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, reply]);
          setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);
      }, 2000);
    }
  };

  const handleAcceptChallenge = (message: Message) => {
    setActiveChallengeMessage(message);
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'accepted' } : m));
  };

  const handleDeclineChallenge = (message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'declined' } : m));
  };

  const handleRematchChallenge = (message: Message) => {
    setActiveChallengeMessage(message);
  };

  const handleFinishGame = (myScore: number, opponentScore: number) => {
    if (!activeChallengeMessage) return;
    
    // We update the original message to 'completed'
    setMessages(prev => prev.map(m => m.id === activeChallengeMessage.id ? { ...m, challengeStatus: 'completed' } : m));
    
    const isChallenger = activeChallengeMessage.sender === 'me';
    const challengerId = 'me';
    const opponentId = 'them';
    
    const resultMessageId = Date.now().toString();
    const resultMessage: Message = {
      id: resultMessageId,
      sender: 'me',
      type: 'challenge_result',
      game: activeChallengeMessage.game || 'Game',
      gameLabel: activeChallengeMessage.gameLabel || 'Game',
      gameEmoji: activeChallengeMessage.gameEmoji || '🎮',
      challengerId,
      opponentId,
      challengerName: isChallenger ? 'You' : recipientUser.displayName,
      opponentName: isChallenger ? recipientUser.displayName : 'You',
      challengerScore: isChallenger ? myScore : opponentScore,
      opponentScore: isChallenger ? opponentScore : myScore,
      winnerId: myScore > opponentScore ? 'me' : (myScore < opponentScore ? 'them' : 'tie'),
      resultMessage: myScore > opponentScore ? `Haha! Beat that! 🔥` : (myScore < opponentScore ? `Argh, you got me! 😭` : `It's a tie! 🤝`),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setActiveChallengeMessage(null);
    setMessages(prev => [...prev, resultMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === resultMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendChallenge = (challengeData: any) => {
    setShowGamePicker(false);
    const newMessageId = Date.now().toString();
    const newMessage: Message = {
      id: newMessageId,
      sender: 'me',
      type: 'challenge',
      game: challengeData.game,
      gameLabel: challengeData.gameLabel,
      gameEmoji: challengeData.gameEmoji,
      score: challengeData.score,
      challengeMessage: challengeData.challengeMessage,
      challengeStatus: 'pending',
      expiresAt: challengeData.expiresAt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendVoice = (duration: number, waveform: number[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'voice',
      duration,
      waveform,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)), 1000);
    }, 800);
  };

  const handleSendGif = (gif: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'gif',
      gif,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendSticker = (sticker: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'sticker',
      sticker,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendAttachment = (type: string, data: any) => {
    const newMessageId = Date.now().toString();
    const baseMessage = {
      id: newMessageId,
      sender: 'me' as const,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' as const,
      uploadProgress: 0
    };

    let appendedMessage: Message | null = null;
    if (type === 'photo') appendedMessage = { ...baseMessage, type: 'photo', photo: data } as any;
    else if (type === 'video') appendedMessage = { ...baseMessage, type: 'video', video: data } as any;
    else if (type === 'file') appendedMessage = { ...baseMessage, type: 'file', file: data } as any;
    else if (type === 'song') { appendedMessage = { ...baseMessage, type: 'song', song: data } as any; delete appendedMessage?.uploadProgress; }
    else if (type === 'location') { appendedMessage = { ...baseMessage, type: 'location', location: data } as any; delete appendedMessage?.uploadProgress; }

    if (appendedMessage) {
      setMessages(prev => [...prev, appendedMessage!]);
      triggerSparkFlowUpdate();
      executeSendRipple();

      if (appendedMessage.uploadProgress !== undefined) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress >= 100) {
            clearInterval(interval);
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: undefined, status: 'sent' } : m));
          } else {
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: Math.min(progress, 99) } : m));
          }
        }, 200);
      } else {
        setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m)), 500);
      }
    }
  };

  const handleForwardMessage = (msg: Message) => {
    const forwardedMsg: Message = {
      ...msg,
      id: Date.now().toString(),
      sender: 'me',
      mood: mood || undefined,
      status: 'sending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, forwardedMsg]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === forwardedMsg.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions ? { ...m.reactions } : {};
        const isPulse = emoji === '⚡';
        const currentUsers = reactions[emoji] || [];
        if (currentUsers.includes('me')) {
          reactions[emoji] = currentUsers.filter(u => u !== 'me');
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...currentUsers, 'me'];
        }
        return { ...m, reactions };
      }
      return m;
    }));
    setActionMessage(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative z-[999] bg-black overflow-hidden">
      <ChatBackground themeId={showThemeSelector ? previewThemeId : themeId} mood={mood} energyLevel={energyLevel} energyOn={energyOn} />
      
      {/* Energy Level Indicator */}
      <div className="absolute top-16 right-4 z-[45] flex items-center gap-1 opacity-70 pointer-events-none">
        <span className="text-[10px] text-white/50 mr-1 select-none">⚡</span>
        <div className="flex gap-0.5">
           {[...Array(5)].map((_, i) => (
             <motion.div 
               key={i} 
               animate={
                  energyLevel > i * 20 
                    ? { backgroundColor: energyLevel >= 80 ? ['#FFD700', '#FFA500', '#FFD700'] : '#FFF', scale: energyLevel >= 80 ? [1, 1.2, 1] : 1 } 
                    : { backgroundColor: 'rgba(255,255,255,0.2)' }
               }
               transition={{ repeat: Infinity, duration: 1 }}
               className="w-1.5 h-1.5 rounded-full"
             />
           ))}
        </div>
      </div>

      <ChatHeader 
        name={recipientUser?.displayName || "Priya Sharma"}
        avatar={recipientUser?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200"}
        isOnline={true}
        isTyping={isOtherTyping}
        currentMood={otherMood}
        onThemeSelectClick={() => setShowThemeSelector(true)}
        onBack={() => navigate(-1)}
        sparkFlow={sparkFlow!}
        onSparkFlowClick={() => sparkFlow && setShowSparkDetail(true)}
        onReactToMood={(emoji) => {
           const myMoodObj = CHAT_MOODS.find(m => m.id === mood);
           if (!myMoodObj) return;

           setTimeout(() => {
              setReactionToast({
                name: "Priya",
                emoji: "💜",
                moodEmoji: myMoodObj.emoji,
                moodLabel: myMoodObj.label
              });
              
              setTimeout(() => {
                setReactionToast(null);
              }, 4000);
           }, 1500);
        }}
      />

      {moodNotification && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-24 inset-x-0 mx-auto w-max z-40 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg"
          >
             <span className="text-white/90 text-sm font-medium">{moodNotification.name} is feeling {moodNotification.mood}!</span>
          </motion.div>
        </AnimatePresence>
      )}

      {reactionToast && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-max z-50 bg-[#1A1A24] border border-white/10 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3"
          >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                {reactionToast.emoji}
             </div>
             <div>
                <div className="text-white font-medium text-sm">
                   {reactionToast.name} reacted {reactionToast.emoji}
                </div>
                <div className="text-white/50 text-xs">
                   to your {reactionToast.moodEmoji} {reactionToast.moodLabel} mood!
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      )}

      {sparkFlow?.atRisk && (
        <div className="absolute top-[60px] inset-x-0 z-40 px-4 pt-2">
           <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 flex justify-between items-center shadow-lg">
              <span className="text-white font-medium text-sm">⚠️ Your {sparkFlow.count}-day flow ends at midnight! Message now 🔥</span>
              <button className="text-white/70 hover:text-white"><Zap size={16}/></button>
           </div>
        </div>
      )}

      {pinnedMessage && (
        <div className="bg-purple-900/30 border-b border-purple-500/20 px-4 py-2 flex items-center gap-3 relative z-[50]">
           <div className="text-purple-400">📌</div>
           <div className="flex-1 overflow-hidden">
              <p className="text-white/90 text-sm font-medium truncate">"{pinnedMessage.type === 'text' ? pinnedMessage.text : 'Media Message'}"</p>
              <p className="text-white/50 text-xs">Tap to view</p>
           </div>
           <button onClick={() => setPinnedMessage(null)} className="text-white/50 hover:text-white">✕</button>
        </div>
      )}

      <MessageList 
        messages={messages}
        myMood={mood}
        theme={"dark"}
        isOtherTyping={isOtherTyping}
        onLongPress={(msg) => setActionMessage(msg)}
        onReactionClick={(msg) => setReactionSheetMessage(msg)}
        onAcceptChallenge={handleAcceptChallenge}
        onDeclineChallenge={handleDeclineChallenge}
        onRematchChallenge={handleRematchChallenge}
      />

      {/* Ripple effect container */}
      <div className="relative w-full shrink-0">
         {sendRipple && (
            <motion.div 
               key={sendRipple.id}
               className="absolute bottom-0 left-1/2 rounded-full pointer-events-none z-0 mix-blend-screen"
               initial={{ width: 0, height: 0, x: '-50%', y: '50%', opacity: 0.5, border: `2px solid ${sendRipple.color}` }}
               animate={{ width: 600, height: 600, opacity: 0, border: `10px solid ${sendRipple.color}` }}
               transition={{ duration: 0.6, ease: 'easeOut' }}
            />
         )}
         
         <ChatInput 
            currentMood={mood}
            onSetMood={handleSetMood}
            onSendMessage={handleSendMessage}
            onSendVoice={handleSendVoice}
            onSendGif={handleSendGif}
            onSendSticker={handleSendSticker}
            onSendAttachment={handleSendAttachment}
            onOpenGamePicker={() => setShowGamePicker(true)}
            onTyping={() => {}}
            replyingTo={replyingTo ? {
               senderName: replyingTo.sender === 'me' ? 'You' : 'Priya Sharma',
               text: replyingTo.type === 'text' ? (replyingTo.text || '') : 'Attachment'
            } : null}
            onCancelReply={() => setReplyingTo(null)}
         />
      </div>

      <AnimatePresence>
        {showGamePicker && (
          <GameChallengePicker 
            onClose={() => setShowGamePicker(false)}
            onSendChallenge={handleSendChallenge}
            opponentName="Priya"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChallengeMessage && (
          <GameModal
            game={AVAILABLE_GAMES.find(g => g.id === activeChallengeMessage.game) || AVAILABLE_GAMES[0]}
            scoreToBeat={activeChallengeMessage.score}
            opponentName={recipientUser.displayName}
            onClose={() => setActiveChallengeMessage(null)}
            onFinish={handleFinishGame}
          />
        )}
      </AnimatePresence>

      {showThemeSelector && (
         <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <div className="absolute inset-0 z-0 bg-transparent" onClick={() => setShowThemeSelector(false)} />
            <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="relative z-10 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-6 flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
               <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setShowThemeSelector(false)} className="text-white hover:text-white/70 flex items-center gap-2">
                     <ArrowLeft size={24} /> 
                     <span className="font-bold text-lg">Chat Background</span>
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                  <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Live Preview</div>
                  
                  <div 
                     className="w-full h-32 rounded-2xl mb-6 relative overflow-hidden border border-white/10"
                     style={{ backgroundColor: CHAT_THEMES.find(t => t.id === previewThemeId)?.preview }}
                  >
                     <div className="absolute inset-0 bg-black/20" />
                     <div className="absolute inset-0 p-3 flex flex-col justify-end gap-2 text-[10px]">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl rounded-tl-sm self-start text-white/90">
                           How do you like this theme?
                        </div>
                        <div 
                           className="bg-white px-3 py-2 rounded-2xl rounded-tr-sm self-end text-black font-medium"
                           style={{ background: `linear-gradient(to right, ${CHAT_THEMES.find(t => t.id === previewThemeId)?.orbs[0] || '#fff'}, ${CHAT_THEMES.find(t => t.id === previewThemeId)?.orbs[1] || '#ccc'})` }}
                        >
                           It looks beautiful! ✨
                        </div>
                     </div>
                  </div>

                  <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Choose Theme</div>
                  <div className="grid grid-cols-4 gap-3 mb-8">
                     {CHAT_THEMES.map(t => (
                        <button 
                           key={t.id}
                           onClick={() => setPreviewThemeId(t.id)}
                           className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${previewThemeId === t.id ? 'border-neon-purple bg-white/10' : 'border-transparent hover:bg-white/5'}`}
                        >
                           <div className="w-12 h-12 rounded-full relative overflow-hidden border border-white/10 shadow-lg flex items-center justify-center font-bold text-lg" style={{ backgroundColor: t.preview }}>
                              <div className="absolute top-0 right-0 w-8 h-8 rounded-full filter blur-md" style={{ backgroundColor: t.orbs[0] }} />
                              <div className="absolute bottom-0 left-0 w-8 h-8 rounded-full filter blur-md" style={{ backgroundColor: t.orbs[1] }} />
                              <span className="relative z-10 drop-shadow-md">{t.emoji}</span>
                           </div>
                           <span className="text-[10px] text-center font-medium leading-tight text-white/80">{t.name}</span>
                        </button>
                     ))}
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 flex justify-between items-center">
                     <div>
                        <div className="text-white font-medium mb-1">Energy Animation</div>
                        <div className="text-white/50 text-[11px]">Chat activity speeds up elements</div>
                     </div>
                     <button 
                        onClick={handleEnergyToggle}
                        className={`w-12 h-6 rounded-full relative transition-colors ${energyOn ? 'bg-neon-purple' : 'bg-white/20'}`}
                     >
                        <motion.div 
                           className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                           animate={{ left: energyOn ? 'calc(100% - 22px)' : '2px' }}
                        />
                     </button>
                  </div>
               </div>

               <button 
                  onClick={handleApplyTheme}
                  className="w-full mt-2 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-transform"
               >
                  ✓ Apply Theme
               </button>
            </motion.div>
         </div>
      )}

      {/* existing modals  */}
      {showSparkDetail && sparkFlow && (
        <SparkFlowDetailModal 
          chatId={chatId!}
          contactName={recipientUser?.displayName || "Priya Sharma"}
          flow={sparkFlow}
          onClose={() => setShowSparkDetail(false)}
          onUpdate={(f) => setSparkFlow(f)}
        />
      )}

      {showMilestone && (
        <SparkFlowMilestoneModal 
          milestone={showMilestone}
          contactName={recipientUser?.displayName || "Priya Sharma"}
          onDismiss={() => setShowMilestone(null)}
        />
      )}

      {showBrokenFlow && (
        <BrokenSparkFlowScreen 
          contactName={recipientUser?.displayName || "Priya Sharma"}
          bestScore={showBrokenFlow}
          onDismiss={() => {
            setShowBrokenFlow(null);
            if (chatId) {
               updateSparkFlow(chatId);
               setSparkFlow(getSparkFlow(chatId));
            }
          }}
        />
      )}

      {mediaViewer && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent z-10 absolute top-0 inset-x-0">
               <div className="flex items-center gap-4">
                 <button onClick={() => setMediaViewer(null)} className="text-white hover:text-white/70">
                   <span className="text-2xl leading-none">✕</span>
                 </button>
                 <span className="text-white font-medium">{mediaViewer.sender === 'me' ? 'You' : 'Priya Sharma'}</span>
               </div>
               <div className="flex items-center gap-4 text-xl">
                 <button className="text-white hover:opacity-70">⬇️</button>
                 <button className="text-white hover:opacity-70">📤</button>
               </div>
            </div>
            
            {/* Media Content */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center">
               {mediaViewer.type === 'photo' && (
                 <div 
                   className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                   style={{ backgroundColor: mediaViewer.photo.color, filter: mediaViewer.photo.filter === 'Vivid' ? 'saturate(200%)' : mediaViewer.photo.filter === 'Cool' ? 'hue-rotate(90deg)' : mediaViewer.photo.filter === 'Warm' ? 'sepia(50%)' : 'none' }}
                 >
                   {mediaViewer.photo.emoji}
                 </div>
               )}
               {mediaViewer.type === 'video' && (
                 <div 
                   className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                   style={{ backgroundColor: mediaViewer.video.color }}
                 >
                   {mediaViewer.video.emoji}
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                     <Play fill="white" size={80} className="text-white opacity-80" />
                   </div>
                 </div>
               )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0 text-center pointer-events-none transition-opacity">
               <span className="text-white/70 text-sm">Today, {mediaViewer.time}</span>
               {mediaViewer.type === 'photo' && mediaViewer.photo.caption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.photo.caption}</div>
               )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {actionMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
             onClick={() => setActionMessage(null)} 
           />
           
           {/* Floating Reaction Bar */}
           <div className="relative bottom-8 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full flex gap-1 shadow-2xl">
             {['❤️', '😂', '😮', '😢', '😤', '👑', '⚡'].map(emoji => (
               <button 
                 key={emoji}
                 className={`w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform origin-bottom ${emoji === '⚡' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}
                 onClick={() => handleReact(actionMessage.id, emoji)}
               >
                 {emoji}
               </button>
             ))}
           </div>
           
           {/* Action Menu */}
           <div className="relative top-4 w-64 bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { setReplyingTo(actionMessage); setActionMessage(null); }}>
               <span>↩️</span> Reply
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
                if (actionMessage.type === 'voice') {
                  alert("Voice message transcript unavailable");
                }
                setActionMessage(null);
             }}>
               <span>📋</span> {actionMessage.type === 'voice' ? 'Copy transcript' : 'Copy'}
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { handleForwardMessage(actionMessage); setActionMessage(null); }}>
               <span>↪️</span> Forward
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { setPinnedMessage(actionMessage); setActionMessage(null); }}>
               <span>📌</span> Pin Message
             </button>
             {actionMessage.sender === 'me' ? (
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/10 transition-colors" onClick={() => { setMessages(prev => prev.filter(m => m.id !== actionMessage.id)); setActionMessage(null); }}>
                  <span>🗑️</span> Delete
                </button>
             ) : (
                <button className="w-full flex items-center gap-3 px-4 py-3 text-orange-500 hover:bg-white/10 transition-colors" onClick={() => setActionMessage(null)}>
                  <span>⚠️</span> Report
                </button>
             )}
           </div>
        </div>
      )}

      {/* Reaction Summary Sheet */}
      {reactionSheetMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReactionSheetMessage(null)} />
           <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-4 min-h-[50vh] max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-white text-lg font-bold">Reactions</h2>
                 <button onClick={() => setReactionSheetMessage(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
              </div>
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                 <button className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5">
                   All {Object.values(reactionSheetMessage.reactions || {}).reduce((acc: number, arr) => acc + (arr as string[]).length, 0)}
                 </button>
                 {Object.entries(reactionSheetMessage.reactions || {}).map(([emoji, users]) => (
                   <button key={emoji} className={`px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5 flex items-center gap-1.5 ${emoji === '⚡' ? 'text-yellow-400' : ''}`}>
                     {emoji} <span>{(users as string[]).length}</span>
                   </button>
                 ))}
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto">
                 {Object.entries(reactionSheetMessage.reactions || {}).flatMap(([emoji, users]) => 
                    (users as string[]).map((userId, idx) => (
                      <div key={`${emoji}-${idx}`} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                             {userId === 'me' ? 'Y' : 'U'}
                           </div>
                           <span className="text-white font-medium">{userId === 'me' ? 'You' : 'Priya Sharma'}</span>
                         </div>
                         <span className="text-2xl">{emoji}</span>
                      </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
