import React, { useEffect, useState } from 'react';
import { Lock, Search, MoreVertical, Edit, Phone, Video, ArrowLeft, MessageCircle, CheckCircle, XCircle, Play, Zap, Settings, Pin, Users, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarWithRing, GlassCard } from '../components/ui';
import { getChats } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMessageRequests, acceptRequest, declineRequest } from '../lib/mock/mockSocialGraph';
import { mockUsers } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { useWindowDimensions } from '../hooks/useWindowDimensions';
import { getSparkFlow, MOCK_SPARK_FLOWS } from '../lib/sparkFlowEngine';
import { SparkFlowIcon } from '../components/SparkFlowIcon';
import { GroupCreateFlow } from '../components/GroupCreateFlow';


function SwipeableChatRow({ chat, onClick }: { chat: any, onClick: any, key?: React.Key }) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [dragX, setDragX] = useState(0);
   
    const getReadReceiptIcon = (lastMessage: string, unread: number) => {
        if (unread > 0) return null;
        if (lastMessage.startsWith('You:')) {
            return <span className="text-neon-blue text-[10px] ml-1 opacity-80 shrink-0 select-none tracking-tight">✓✓</span>;
        }
        return null;
    };

    return (
        <div className="group relative overflow-hidden bg-[#0A0A12]">
            {/* Background Actions (Underneath the row) */}
            <div className="absolute inset-0 flex justify-between items-center px-4">
                {/* Left Action (Swipe Right) */}
                <div className={`flex items-center text-blue-400 transition-opacity ${dragX > 20 ? 'opacity-100' : 'opacity-0'}`}>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    <span className="text-xs font-bold">Reply</span>
                </div>
                
                {/* Right Actions (Swipe Left) */}
                <div className={`flex items-center gap-4 text-gray-300 transition-opacity ${dragX < -20 ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-white/10 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-white/20">
                            <span className="text-sm">🔕</span>
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-[#B026FF]/20 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-[#B026FF]/40 text-[#B026FF]">
                            <Pin className="w-4 h-4" />
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-red-500/20 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-red-500/40 text-red-500">
                            <span className="text-sm">🗑️</span>
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition group/action pointer-events-auto">
                        <div className="bg-white/10 w-9 h-9 rounded-full flex items-center justify-center group-hover/action:bg-white/20">
                            <span className="text-sm">📁</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Draggable Top Layer */}
            <motion.div 
                className={`flex items-center gap-3 px-4 py-3 relative z-10 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] bg-[#0A0A12] ${chat.pinned ? 'bg-[#B026FF]/[0.03]' : ''} ${isMobile ? '' : 'cursor-pointer'}`}
                drag="x"
                dragConstraints={{ left: -220, right: 80 }}
                dragElastic={0.1}
                onDrag={(_, info) => setDragX(info.offset.x)}
                onDragEnd={(_, info) => {
                    const offset = info.offset.x;
                    if (offset > 50) {
                        // Quick Reply threshold
                        onClick(); // open chat in quick mode ideally
                    } else if (offset < -100) {
                        // Keep open or do something - for now just snapping back handled by animation config
                    } else {
                        setDragX(0); // if not moved enough
                    }
                }}
                whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 20 }}
                onClick={onClick}
                style={{ touchAction: 'pan-y' }}
            >
                {/* Avatar Area */}
                <div className="relative shrink-0 w-12 h-12">
                    {chat.isGroup ? (
                        <div className="relative w-full h-full">
                            <img src={chat.avatar2} className="w-8 h-8 rounded-full absolute top-0 right-0 border-2 border-[#0A0A12] bg-zinc-800" />
                            <img src={chat.avatar} className="w-8 h-8 rounded-full absolute bottom-0 left-0 border-2 border-[#0A0A12] bg-zinc-700" />
                        </div>
                    ) : (
                        <>
                            <img src={chat.avatar} className="w-full h-full rounded-full bg-white/10" />
                            {chat.online && (
                                <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#0A0A12]" />
                            )}
                        </>
                    )}
                </div>

                {/* Center Info */}
                <div className="flex-1 min-w-0 pr-2 pb-0.5 pt-0.5 flex flex-col justify-between h-[44px]">
                    <div className="flex items-center">
                        <h3 className="text-[15px] font-bold text-white truncate max-w-[80%] leading-tight">{chat.name}</h3>
                        <div className="ml-2 mt-[1px]">
                          {(() => {
                            const flow = getSparkFlow(chat.id);
                            if (flow && flow.count > 0) return <SparkFlowIcon flow={flow} />;
                            return null;
                          })()}
                        </div>
                        {chat.pinned && <Pin className="w-3 h-3 text-[10px] fill-gray-500 text-gray-500 ml-1.5 shrink-0" />}
                    </div>
                    <div className="flex items-center">
                        <p className={`text-[13px] truncate leading-tight mt-1 ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {chat.lastMessage.includes('You:') ? <span className="text-gray-500 mr-0.5">You:</span> : ''}
                            {chat.lastMessage.replace('You: ', '')}
                        </p>
                    </div>
                </div>

                {/* Right Accents */}
                <div className="flex flex-col items-end justify-between h-[44px] pb-0.5 pt-0.5 pointer-events-none">
                    <span className={`text-[11px] ${chat.unread > 0 ? 'text-[#B026FF] font-bold' : 'text-gray-500'} leading-none`}>{chat.time}</span>
                    <div className="flex items-center mt-auto">
                        {getReadReceiptIcon(chat.lastMessage, chat.unread)}
                        <AnimatePresence>
                            {chat.unread > 0 && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 rounded-full bg-[#B026FF] flex items-center justify-center ml-1 shrink-0"
                                >
                                    <span className="text-white text-[10px] font-bold font-mono">
                                        {chat.unread > 9 ? '9+' : chat.unread}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ConnectScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserParam = searchParams.get('user');
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all'|'requests'>('all');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      let fetchedChats: any[] = [];
      if (FEATURE_FLAGS.MOCK_MODE) {
        fetchedChats = await getChats();
      }
      
      // Merge with custom chats
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      
      const customChatEntries = Object.keys(customChats).map(key => {
         const msgs = customChats[key];
         const lastMsg = msgs[msgs.length - 1];
         return {
            id: `custom_${key}`,
            name: key,
            username: key,
            avatar: `https://i.pravatar.cc/150?u=${key}`,
            msg: lastMsg.text,
            time: 'Just now',
            unread: 0,
            isVeil: false
         };
      });

      // Filter out duplicates if any
      const finalChats = [...customChatEntries, ...fetchedChats.filter(fc => !customChatEntries.find(cc => cc.name.replace('@', '') === fc.name.replace('@', '')))];
      
      setChats(finalChats);
      setLoading(false);
    }
    fetchChats();
  }, []);

  useEffect(() => {
    const loadRequests = () => {
      setRequests(getMessageRequests());
    };
    loadRequests();
    window.addEventListener('skrimchat_requests_updated', loadRequests);
    return () => window.removeEventListener('skrimchat_requests_updated', loadRequests);
  }, []);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [customGroups, setCustomGroups] = useState<any[]>([]);

  useEffect(() => {
    const storedGroupsStr = localStorage.getItem('skrimchat_custom_groups');
    if (storedGroupsStr) {
      setCustomGroups(JSON.parse(storedGroupsStr));
    }
  }, []);

  const handleGroupCreated = (groupData: any) => {
    const newGroup = {
       id: `group_${Date.now()}`,
       name: groupData.name,
       avatar: groupData.avatar,
       avatar2: groupData.avatar, // for stacked layout if needed
       isGroup: true,
       lastMessage: `Group created · ${groupData.members.length + 1} members`,
       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       unread: 0,
       online: false,
       blazeStreak: 0,
       pinned: false,
       ...groupData
    };
    const updatedGroups = [newGroup, ...customGroups];
    setCustomGroups(updatedGroups);
    localStorage.setItem('skrimchat_custom_groups', JSON.stringify(updatedGroups));
    setShowGroupCreate(false);
    
    // Auto navigation to new group chat could be here
    // navigate(`/chat/${newGroup.id}`);
  };

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (targetUserParam) {
    const targetUserData = mockUsers.find(u => u.username === `@${targetUserParam}` || u.username === targetUserParam) || {
      username: `@${targetUserParam}`,
      displayName: targetUserParam.replace(/_/g, ' '),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUserParam}`
    };

    // Read custom messages
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
    const chatKey = targetUserParam.replace('@', '');
    const messages = customChats[chatKey] || [];

    return (
      <div className="w-full h-full flex flex-col bg-[#0A0A12] relative overflow-hidden z-50">
        <header className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-[#0A0A12]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/connect')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${targetUserParam}`)}>
              <AvatarWithRing src={targetUserData.avatar} size="sm" showOnlineDot username={targetUserParam} />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold tracking-tight text-white">{targetUserData.displayName}</h2>
                <span className="text-[10px] text-gray-400">@{targetUserParam}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <Phone className="w-4 h-4 text-white" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <Video className="w-4 h-4 text-white" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full flex flex-col p-4 no-scrollbar gap-4 justify-end">
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <AvatarWithRing src={targetUserData.avatar} size="xl" className="mb-4" showOnlineDot username={targetUserParam} />
            <span className="text-sm font-medium text-white mb-1">{targetUserData.displayName}</span>
            <span className="text-xs text-gray-400">@{targetUserParam}</span>
            <span className="text-xs text-gray-500 mt-4 bg-white/5 px-4 py-1 rounded-full">New Chat Created</span>
          </div>
          
          {messages.length > 0 ? (
            messages.map((msg: any) => {
              const isMine = msg.sender !== targetUserData.username && msg.sender !== `@${targetUserParam}`;
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const urls = msg.text.match(urlRegex) || [];
              const parts = msg.text.split(urlRegex);

              return (
                <div key={msg.id} className={`self-${isMine ? 'end' : 'start'} bg-${isMine ? '[#B026FF]/20' : 'white/10'} border border-${isMine ? '[#B026FF]/50' : 'white/10'} rounded-2xl rounded-t${isMine ? 'r' : 'l'}-sm px-4 py-2 text-sm text-white max-w-[80%] ${isMine ? 'shadow-[0_0_10px_rgba(176,38,255,0.2)]' : ''}`}>
                  <div className="flex flex-col gap-2">
                    <div className="whitespace-pre-wrap">
                      {parts.map((part: string, i: number) => {
                        if (part.match(urlRegex)) {
                          return (
                            <span key={i} onClick={() => {
                              if (part.includes('skrim.chat/vibe/')) return navigate('/vibes');
                              if (part.includes('skrim.chat/spark/')) return navigate('/');
                              window.open(part, '_blank');
                            }} className="text-[#00F0FF] hover:underline cursor-pointer font-semibold break-all inline-block">
                              {part.length > 30 ? part.substring(0, 30) + '...' : part}
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="self-end bg-[#B026FF]/20 border border-[#B026FF]/50 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-white max-w-[80%] shadow-[0_0_10px_rgba(176,38,255,0.2)]">
              Hello! 👋
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0A0A12]/90 backdrop-blur-md pb-safe">
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
            <input type="text" placeholder="Message..." className="flex-1 bg-transparent border-none outline-none text-sm text-white" />
            <button className="w-8 h-8 rounded-full bg-[#B026FF] flex items-center justify-center -mr-2">
              <span className="text-white text-xs font-bold leading-none select-none">↑</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- HOME CONNECT LIST VIEW ---
  const MOCK_CHATS = [
    { id: "1", name: "Priya Sharma", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya", lastMessage: "Did you watch that vibe I sent? 🔥", time: "2:34 PM", unread: 3, online: true, blazeStreak: 7, pinned: true },
    { id: "2", name: "Rahul Verma", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul", lastMessage: "🎤 Voice message", time: "1:15 PM", unread: 0, online: false, blazeStreak: 14, pinned: false },
    { id: "3", name: "Telugu Squad 🔥", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=telugu1", avatar2: "https://api.dicebear.com/7.x/avataaars/svg?seed=telugu2", lastMessage: "Arjun: Oka vibe chudandi guys!", time: "12:03 PM", unread: 12, online: false, isGroup: true, blazeStreak: 0, pinned: true },
    { id: "4", name: "Ananya K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya", lastMessage: "You: 😂😂😂", time: "Yesterday", unread: 0, online: true, blazeStreak: 3, pinned: false },
    { id: "5", name: "Kiran Reddy", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kiran", lastMessage: "🎮 Game Challenge!", time: "Yesterday", unread: 1, online: false, blazeStreak: 30, pinned: false },
    { id: "6", name: "Sneha Patel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha", lastMessage: "📷 Photo", time: "Mon", unread: 0, online: false, blazeStreak: 0, pinned: false },
    { id: "7", name: "Vibes Gang 🌟", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vibes1", avatar2: "https://api.dicebear.com/7.x/avataaars/svg?seed=vibes2", lastMessage: "Priya: sending good vibes only✨", time: "Sun", unread: 5, online: false, isGroup: true, blazeStreak: 0, pinned: false }
  ];

  const ACTIVE_USERS = MOCK_CHATS.filter(c => c.online);
  const ACTIVE_MOCKS = [...ACTIVE_USERS, {id:"a1", name: "Ravi", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ravi", online: true}, {id:"a2", name: "Jessica", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jess", online: true}, {id:"a3", name: "Ali", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ali", online: true}, {id:"a4", name: "Sam", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", online: true}, {id:"a5", name: "Kavya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kavya", online: true}];

  const ALL_CHATS = [...customGroups, ...MOCK_CHATS];

  const filteredChats = ALL_CHATS.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === 'Unread' && c.unread === 0) return false;
    if (filter === 'Groups' && !c.isGroup) return false;
    return true;
  });

  const atRiskChat = ALL_CHATS.find(c => {
    const flow = getSparkFlow(c.id);
    return flow && flow.atRisk;
  });

  return (
    <div className="w-full h-full flex flex-col pt-4 pb-24 relative overflow-hidden bg-[#0A0A12] text-white">
      {/* Top subtle purple gradient */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#B026FF]/[0.08] to-transparent pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center px-4 mb-4 z-10 relative mt-2">
        <h1 className="text-[22px] font-bold text-white">Connect</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateMenu(true)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 mb-5 z-10 relative">
        <div className={`flex items-center bg-white/5 rounded-3xl px-4 py-2.5 border transition-all duration-300 ${isSearchFocused ? 'border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.2)]' : 'border-transparent'}`}>
          <Search className={`w-4 h-4 ${isSearchFocused ? 'text-[#B026FF]' : 'text-gray-400'} mr-2`} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="bg-transparent flex-1 outline-none text-[15px] placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Filters */}
        <AnimatePresence>
          {isSearchFocused && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar"
            >
              {['All', 'Unread', 'Groups', 'Archived'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === f ? 'bg-[#B026FF]/20 text-[#B026FF] border border-[#B026FF]/30' : 'bg-white/5 text-gray-400 border border-transparent'}`}
                >
                  {f}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto w-full flex flex-col no-scrollbar pb-20 relative z-10">
          {/* Active Now Row */}
          {!isSearchFocused && (
              <div className="mb-2">
                 <div className="px-4 mb-2">
                    <span className="text-[11px] font-bold text-gray-500 tracking-widest">ACTIVE NOW</span>
                 </div>
                 <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 pt-1 w-full">
                    {/* Your Story */}
                    <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer w-14">
                       <div className="relative w-[52px] h-[52px]">
                           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" className="w-full h-full rounded-full bg-white/10 border-2 border-transparent" />
                           <div className="absolute right-0 bottom-0 w-4 h-4 bg-[#B026FF] rounded-full border-2 border-[#0A0A12] flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold leading-none -mt-0.5">+</span>
                           </div>
                       </div>
                       <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">Your Story</span>
                    </div>

                    {/* Active Contacts */}
                    {ACTIVE_MOCKS.map(contact => (
                       <div key={contact.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer w-14">
                           <div className="relative w-[52px] h-[52px]">
                               {/* Neon Ring */}
                               <div className="absolute inset-[-2px] rounded-full border-[2px] border-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" style={{animationDuration: '3s'}} />
                               <img src={contact.avatar} className="w-full h-full rounded-full bg-white/10 relative z-10" />
                               <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#0A0A12] z-20" />
                           </div>
                           <span className="text-[10px] text-white font-medium truncate w-14 text-center block">{contact.name}</span>
                       </div>
                    ))}
                 </div>
              </div>
          )}

          {/* Messages Header */}
          <div className="px-4 mt-6 mb-2">
              <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Messages</span>
          </div>

          {/* Chat List */}
          {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8 opacity-60">
                 <MessageCircle className="w-12 h-12 text-gray-500 mb-4" />
                 <p className="text-white font-medium mb-1">No conversations found</p>
                 <p className="text-sm text-gray-500">Start connecting with people you follow!</p>
              </div>
          ) : (
              <div className="flex flex-col">
                  {atRiskChat && (
                     <div className="px-4 mb-2">
                       <div onClick={() => navigate(`/chat/${atRiskChat.id}`)} className="bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-[0_0_15px_rgba(255,165,0,0.1)]">
                          <div>
                             <div className="flex items-center gap-2 mb-0.5 text-orange-400">
                               <SparkFlowIcon flow={getSparkFlow(atRiskChat.id)!} />
                               <span className="text-white font-bold text-sm ml-1">{atRiskChat.name}</span>
                               <span className="text-yellow-500 font-bold ml-1">⚠️</span>
                             </div>
                             <p className="text-orange-200/80 text-xs">"Message now or lose your flow! ⏰"</p>
                          </div>
                          <div className="px-3 py-1.5 bg-orange-500 text-white font-bold text-xs rounded-full">Message</div>
                       </div>
                     </div>
                  )}
                  {filteredChats.map(chat => (
                     <SwipeableChatRow key={chat.id} chat={chat} onClick={() => navigate(`/chat/${chat.id}`)} />
                  ))}
              </div>
          )}
      </div>

      {/* FAB - Compose */}
      <button 
        onClick={() => setShowCreateMenu(true)}
        className="absolute bottom-24 right-5 sm:bottom-6 sm:right-6 bg-gradient-to-tr from-[#B026FF] to-[#D869FF] text-white rounded-full px-5 py-3.5 shadow-[0_4px_25px_rgba(176,38,255,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all z-40"
      >
          <Edit className="w-5 h-5" />
          <span className="font-bold text-sm">New Chat</span>
      </button>

      <AnimatePresence>
        {showCreateMenu && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" 
              onClick={() => setShowCreateMenu(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 bg-[#1A1A24] rounded-t-3xl p-4 pb-8 shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="space-y-3">
                 <button 
                   onClick={() => { setShowCreateMenu(false); /* normal new chat logic */ }}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                 >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                       <MessageCircle />
                    </div>
                    <div className="text-left flex-1">
                       <div className="text-white font-bold text-lg">New Chat</div>
                       <div className="text-white/50 text-sm">Start a simple 1-on-1 chat</div>
                    </div>
                 </button>
                 <button 
                   onClick={() => { setShowCreateMenu(false); setShowGroupCreate(true); }}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 hover:border-neon-purple/60 transition-colors"
                 >
                    <div className="w-12 h-12 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-[0_0_15px_rgba(176,38,255,0.5)]">
                       <Users />
                    </div>
                    <div className="text-left flex-1">
                       <div className="text-white font-bold text-lg">New Group</div>
                       <div className="text-white/70 text-sm">Create a squad, invite friends</div>
                    </div>
                 </button>
                 <button 
                   onClick={() => setShowCreateMenu(false)}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                 >
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                       <Megaphone />
                    </div>
                    <div className="text-left flex-1">
                       <div className="text-white font-bold text-lg">New Broadcast</div>
                       <div className="text-white/50 text-sm">Send message to multiple people</div>
                    </div>
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroupCreate && (
          <GroupCreateFlow 
            onClose={() => setShowGroupCreate(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
