import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Share, Camera, MapPin, Link as LinkIcon, Plus, X, Zap, Eye, Calendar, Smile, Bookmark, Repeat, User as UserIcon, LogOut, Settings, Bell, Users, BarChart3, DollarSign, Shield, PlaySquare, Heart, MessageCircle, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockPosts, mockUsers, mockReels, mockSparks } from '../lib/mock/mockData';
import { useAuthStore } from '../store/authStore';
import { useSavedStore } from '../store/savedStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNotificationStore } from '../store/notificationStore';
import { useDataModeStore, DATA_MODES } from '../store/dataModeStore';
import { useOfflineStore } from '../store/offlineStore';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ImmersivePostViewer } from '../components/ImmersivePostViewer';
import { FollowButton } from '../components/ui';
import { ShareProfileSheet } from '../components/ShareProfileSheet';
import { StatBreakdownSheet } from '../components/StatBreakdownSheet';
import { BadgeRow } from '../components/BadgeComponents';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { useDailyMissions } from '../lib/mock/achievementEngine';
import { SparkViewer } from '../components/SparkViewer';
import { HighlightAvatar } from '../components/HighlightAvatar';

const CountUp = ({ end, decimals = 0, suffix = "", prefix = "" }: { end: number, decimals?: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
     let start = 0;
     const duration = 1500;
     const increment = end / (duration / 16);
     const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
           clearInterval(timer);
           setCount(end);
        } else {
           setCount(start);
        }
     }, 16);
     return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

function DailyMissionsCard() {
  const dm = useDailyMissions();
  
  return (
    <div className="px-6 mb-8">
       <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                   🎯 Daily Missions
                </h3>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide">Refreshes in 12h 45m</p>
             </div>
             {dm.bonusClaimed && (
                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                   DONE
                </span>
             )}
          </div>
          
          <div className="space-y-3">
             {dm.missions.map(m => (
                <div key={m.id} className="relative">
                   <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-bold ${m.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{m.desc}</p>
                      <p className={`text-[10px] font-black ${m.done ? 'text-[#00F0FF]' : 'text-yellow-400'}`}>+{m.points} ⚡</p>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min((m.currentCount/m.targetCount)*100, 100)}%` }}
                         className={`h-full ${m.done ? 'bg-[#00F0FF]' : 'bg-yellow-400'}`} 
                      />
                   </div>
                </div>
             ))}
          </div>
          
          {dm.bonusClaimed && (
             <div className="absolute inset-0 bg-skrim-bg/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                   <p className="text-3xl mb-1">🎉</p>
                   <p className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest">+100 ⚡ CLAIMED</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}


export default function IdentityScreen() {
  const { setAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [repostItems, setRepostItems] = useState<any[]>([]);
  const { savedPosts, repostedPosts, hydrate } = useSavedStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [activeSavedTab, setActiveSavedTab] = useState<'bookmarks' | 'offline'>('bookmarks');
  const { offlineVibes, loadVibes, deleteVibe } = useOfflineStore();
  const [selectedMedia, setSelectedMedia] = useState<{index: number, type: 'post'|'vibe'|'saved'|'repost'|'tagged'|string, urls: string[], users?: any[]} | null>(null);

  useEffect(() => {
    loadVibes();
  }, []);
  
  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDataSettings, setShowDataSettings] = useState(false);
  const [showFeedSettings, setShowFeedSettings] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  
  const { regionalBoostEnabled, setRegionalBoost } = useSettingsStore();
  const { globalVibeNotificationsEnabled, toggleGlobalVibeNotifications } = useNotificationStore();
  const { dataMode, setDataMode } = useDataModeStore();
  const [statsData, setStatsData] = useState({ pulse: 4200, blaze: 12, views: 892, vibe: 9.1, followers: 850 });
  const [activeStatType, setActiveStatType] = useState<'pulse' | 'blaze' | 'views' | 'vibe' | null>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [activeHighlightGroup, setActiveHighlightGroup] = useState<any[]>([]);
  const [activeHighlightName, setActiveHighlightName] = useState<string>('');
  const [isHighlightViewer, setIsHighlightViewer] = useState<boolean>(true);
  const [activeHighlightOptions, setActiveHighlightOptions] = useState<any | null>(null);
  const [activeHighlightRename, setActiveHighlightRename] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);



  useEffect(() => {
    const fetchHighlights = () => {
      const storedH = localStorage.getItem('skrimchat_highlights');
      if (storedH) {
        let parsed = JSON.parse(storedH);
        if (!Array.isArray(parsed)) parsed = [];
        setHighlights(parsed);
      } else {
        setHighlights([]);
      }
    };
    fetchHighlights();
    const handleHighlightEvent = () => fetchHighlights();
    window.addEventListener('highlightSaved', handleHighlightEvent);
    const intv = setInterval(fetchHighlights, 1000);
    return () => {
      clearInterval(intv);
      window.removeEventListener('highlightSaved', handleHighlightEvent);
    };
  }, []);

  useEffect(() => {
    // Quick initialize stats
    let pulse = parseInt(localStorage.getItem('skrimchat_pulse_score') || '4200', 10);
    
    let blaze = parseInt(localStorage.getItem('skrimchat_blaze_run') || '12', 10);
    const lastActive = localStorage.getItem('skrimchat_last_active_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastActive) {
      if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currDate = new Date(today);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          blaze += 1;
        } else if (diffDays > 1) {
          blaze = 1;
        }
      }
    } else {
      blaze = 12; // Start gracefully for preview if not set
    }
    localStorage.setItem('skrimchat_blaze_run', blaze.toString());
    localStorage.setItem('skrimchat_last_active_date', today);

    let views = parseInt(localStorage.getItem('skrimchat_profile_views') || '892', 10);
    views += Math.floor(Math.random() * 5) + 1;
    localStorage.setItem('skrimchat_profile_views', views.toString());

    let vibe = parseFloat(localStorage.getItem('skrimchat_vibe_rating') || '9.1');
    localStorage.setItem('skrimchat_vibe_rating', vibe.toString());

    let followers = parseInt(localStorage.getItem('skrimchat_followers') || '850', 10);

    setStatsData({ pulse, blaze, views, vibe, followers: user?.followers || followers });
  }, [user]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const modalCoverInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    if (user) {
      setEditName(user.fullName || user.displayName || '');
      setEditUsername(user.username?.replace('@', '') || '');
      setEditBio(user.bio || '');
      setEditWebsite(user.website || '');
      setEditLocation(user.location || '');
      setEditAvatar(user.avatar || '');
      setEditCover(user.cover || '');
    }
  }, [user, isEditing]);

  useEffect(() => {
    // Load user's mocked posts
    setPosts(mockPosts.slice(0, 6));
    
    // Always call hydrate on mount to sync with localStorage in case it changed externally
    hydrate();
  }, []);

  useEffect(() => {
    const allContent = [...mockReels, ...mockPosts];
    setSavedItems(allContent.filter(item => savedPosts.includes(item.id)));
    setRepostItems(allContent.filter(item => repostedPosts.includes(item.id)));
  }, [savedPosts, repostedPosts]);

   useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      // 30% chance to get a new follower every 10 seconds
      if (Math.random() > 0.7) {
        const currentUserStr = localStorage.getItem('skrimchat_user');
        if (currentUserStr) {
          try {
             const currentUserData = JSON.parse(currentUserStr);
             const currentFollowers = currentUserData.followers || 0;
             const updatedUser = { ...currentUserData, followers: currentFollowers + 1 };
             localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
             window.dispatchEvent(new Event('skrimchat_user_updated'));
          } catch (e) {}
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.username]);


  const handleLogout = () => {
    localStorage.removeItem('skrimchat_user');
    localStorage.removeItem('skrimchat_mock_user');
    setAuthenticated(false);
    setToastMessage('Logged out successfully');
    setTimeout(() => {
      setToastMessage('');
      navigate('/login');
    }, 1500);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      fullName: editName,
      displayName: editName,
      username: '@' + editUsername,
      bio: editBio,
      website: editWebsite,
      location: editLocation,
      avatar: editAvatar,
      cover: editCover,
    };
    localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
    if (editAvatar && editAvatar.startsWith('data:')) {
      localStorage.setItem('skrimchat_avatar', editAvatar); // keep it synced if used elsewhere
    }
    window.dispatchEvent(new Event('skrimchat_user_updated'));
    setIsEditing(false);
  };

  const handleQuickFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const updatedUser = { ...user, [type]: result };
        localStorage.setItem('skrimchat_user', JSON.stringify(updatedUser));
        if (type === 'avatar') {
          localStorage.setItem('skrimchat_avatar', result);
        }
        window.dispatchEvent(new Event('skrimchat_user_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleHighlightClick = (h: any) => {
    if (!h.id) return;
    setActiveHighlightName(h.title);
    setIsHighlightViewer(true);
    setActiveHighlightGroup([{
      userId: 'highlight',
      id: h.id, // Store original highlight id
      emoji: h.emoji,
      user: { id: 'highlight', displayName: h.title, username: '', avatar: h.cover || h.sparks?.[0]?.image || h.sparks?.[0]?.backgroundTheme || h.sparks?.[0]?.background },
      sparks: h.sparks || [],
      hasViewed: true,
      isOwn: true
    }]);
  };

  if (!user) return <div className="p-8 text-center text-white">Loading...</div>;

  const currentCover = user.cover || "none"; // Using none to show gradient

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-skrim-bg relative pb-20">
      
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleQuickFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleQuickFileChange(e, 'cover')} />
      
      {/* SECTION 1 - Profile Hero */}
      <div className="relative w-full h-[160px] md:h-[200px] cursor-pointer group" onClick={() => coverInputRef.current?.click()}>
        {currentCover === 'none' ? (
          <div className="w-full h-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] opacity-80 animate-pulse" />
        ) : (
          <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-skrim-bg to-transparent opacity-80" />
        
        {/* Center Camera Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center text-white/90">
             <Camera className="w-8 h-8 mb-2 drop-shadow-md" />
             <span className="text-sm font-bold drop-shadow-md">Add Cover Photo</span>
          </div>
        </div>
        
        {/* Edit Cover Action */}
        <button 
          className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-2 hover:bg-black/60 transition z-10"
          onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
        >
          <Camera className="w-3.5 h-3.5" /> Edit Cover
        </button>

        {/* Vibe Aura + Avatar */}
        <div className="absolute -bottom-[45px] left-6 z-20" onClick={e => e.stopPropagation()}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full blur-[20px] opacity-60 animate-pulse" />
            <div className="relative w-[90px] h-[90px] rounded-full p-[3px] bg-gradient-to-br from-[#B026FF] to-[#00F0FF]">
              <img 
                src={user.avatar || 'https://i.pravatar.cc/150'} 
                alt="Avatar" 
                className="w-full h-full rounded-full border-4 border-skrim-bg object-cover bg-black"
                onClick={() => avatarInputRef.current?.click()}
              />
              <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-skrim-bg shadow-[0_0_8px_rgba(34,197,94,0.6)] pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#B026FF] rounded-full border-2 border-skrim-bg flex items-center justify-center cursor-pointer shadow-[0_0_10px_#B026FF]" onClick={() => avatarInputRef.current?.click()}>
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 - Identity Info */}
      <div className="px-6 pt-14 pb-4 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{user.fullName || user.displayName || user.username?.replace('@', '') || 'No Name'}</h1>
            </div>
            <p className="text-sm font-medium text-[#B026FF] mb-2.5">
              {user.username?.startsWith('@') ? user.username : `@${user.username}`}
            </p>
            <div className="mb-4">
              <BadgeRow stats={{
                pulseScore: statsData.pulse,
                blazeRun: statsData.blaze,
                vibeRating: statsData.vibe,
                profileViews: statsData.views,
                followers: statsData.followers
              }} />
            </div>
            {user.bio ? (
              <p className="text-sm text-gray-300 leading-relaxed mb-3 max-w-[90%]">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-3 cursor-pointer hover:text-gray-400" onClick={() => setIsEditing(true)}>
                ✨ Add a bio to tell your story
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1 hover:text-[#B026FF] cursor-pointer transition">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="flex gap-8 mb-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-none">9</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Posts</span>
          </div>
          <div className="flex flex-col cursor-pointer hover:opacity-80 transition">
            <span className="text-lg font-bold text-white leading-none">{user.followers || 0}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Followers</span>
          </div>
          <div className="flex flex-col cursor-pointer hover:opacity-80 transition">
            <span className="text-lg font-bold text-white leading-none">{user.following || 0}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Following</span>
          </div>
        </div>

        {/* SECTION 3 - Action Buttons */}
        <div className="flex gap-2 mb-8">
          <button 
            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-sm font-semibold text-white backdrop-blur-md flex items-center justify-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          <button 
            className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-sm font-semibold text-white backdrop-blur-md flex items-center justify-center gap-2"
            onClick={() => setShowShareSheet(true)}
          >
            <Share className="w-4 h-4" /> Share
          </button>
          <button 
            className="w-11 h-11 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center shrink-0"
            onClick={() => setShowSettingsMenu(true)}
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>



      {/* SECTION 3.5 - Spark Highlights */}
      {highlights.length > 0 && (
        <div className="px-6 mb-8">
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 items-start">
              {highlights.map((h) => {
              const cover = h.cover;
              const isImage = cover?.startsWith('http') || cover?.startsWith('data:');
              const bgs: Record<string, string> = {
                'purple': 'linear-gradient(to bottom right, #B026FF, #00F0FF)',
                'rose': 'linear-gradient(to bottom, #FF416C, #FF4B2B)',
                'dark': '#121212',
                'orange-red': 'linear-gradient(to bottom right, #FF8A00, #FF0000)',
                'cyan-blue': 'linear-gradient(to bottom right, #00FFFF, #0000FF)',
                'green-teal': 'linear-gradient(to bottom right, #00FF00, #008080)',
                'pink-purple': 'linear-gradient(to bottom right, #FF00FF, #800080)',
                'gold-orange': 'linear-gradient(to bottom right, #FFD700, #FFA500)',
              };
              const bgStyle = isImage ? {} : { background: cover?.includes('gradient') || cover?.startsWith('#') ? cover : (bgs[cover] || bgs['purple']) };

              return (
                <motion.div 
                  key={h.id} 
                  animate={{ scale: pressingId === h.id ? 0.9 : 1 }}
                  onMouseDown={() => {
                    setPressingId(h.id);
                    pressTimer.current = setTimeout(() => {
                      setPressingId(null);
                      setActiveHighlightOptions(h);
                    }, 600);
                  }}
                  onMouseUp={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    if (pressingId === h.id) {
                      setPressingId(null);
                      handleHighlightClick(h);
                    }
                  }}
                  onMouseLeave={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    setPressingId(null);
                  }}
                  onTouchStart={() => {
                    setPressingId(h.id);
                    pressTimer.current = setTimeout(() => {
                      setPressingId(null);
                      setActiveHighlightOptions(h);
                    }, 600);
                  }}
                  onTouchEnd={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                    if (pressingId === h.id) {
                      setPressingId(null);
                      handleHighlightClick(h);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                >
                  <HighlightAvatar emoji={h.emoji || "✨"} theme={bgStyle.background as string} size={64} />
                  <span className="text-xs font-semibold text-gray-300 pointer-events-none mt-1">{h.title}</span>
                </motion.div>
              );
            })}
         </div>
      </div>
      )}

      {/* SECTION 4 - Quick Stats Cards */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 mb-8 snap-x">
        {[
          { icon: Zap, color: 'text-yellow-400', glow: 'group-hover:border-yellow-400/50 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]', label: 'Pulse Score', type: 'pulse', val: statsData.pulse, suffix: '', decimals: 0 },
          { icon: Calendar, color: 'text-orange-500', glow: 'group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]', label: 'Blaze Run', type: 'blaze', val: statsData.blaze, suffix: ' days', decimals: 0 },
          { icon: Eye, color: 'text-blue-400', glow: 'group-hover:border-blue-400/50 group-hover:shadow-[0_0_15px_rgba(96,165,250,0.2)]', label: 'Profile Views', type: 'views', val: statsData.views, suffix: '', decimals: 0 },
          { icon: Smile, color: 'text-pink-500', glow: 'group-hover:border-pink-500/50 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]', label: 'Vibe Rating', type: 'vibe', val: statsData.vibe, suffix: '', decimals: 1 },
        ].map((stat, i) => (
          <button 
            key={stat.label} 
            onClick={() => setActiveStatType(stat.type as any)}
            className={`shrink-0 w-[140px] text-left snap-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] cursor-pointer group relative overflow-hidden ${stat.glow}`}
          >
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />

            <stat.icon className={`w-5 h-5 mb-3 ${stat.color} drop-shadow-[0_0_8px_currentColor] relative z-10`} />
            <div className="relative z-10">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white whitespace-nowrap">
                <CountUp end={stat.val} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* SECTION 4.5 - Daily Missions */}
      <DailyMissionsCard />

      {/* SECTION 7 - Quick Access Icons */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 mb-8">
        {[
          { icon: Bell, label: 'Signal', active: false, path: '/signal' },
          { icon: Users, label: 'Spaces', active: false, path: '/communities' },
          { icon: BarChart3, label: 'Creator', active: false, path: '/creator' },
          { icon: DollarSign, label: 'Promote', active: false, path: '/promote' },
          { icon: Shield, label: 'Admin', active: false, path: '/admin' },
        ].map((item, i) => (
          <div 
             key={item.label} 
             onClick={() => navigate(item.path)} 
             className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition active:scale-95 hover:border-neon-purple hover:drop-shadow-[0_0_8px_rgba(176,38,255,0.8)] ${item.active ? 'bg-neon-purple/20 border border-neon-purple/50 text-neon-purple' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-neon-purple hover:shadow-[0_0_8px_rgba(176,38,255,0.8)]'}`}
          >
             <item.icon className="w-4 h-4" />
             <span className="text-xs font-semibold drop-shadow-md">{item.label}</span>
          </div>
        ))}
        {/* Added logout button nicely inside quick access */}
        <div onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition active:scale-95 bg-red-500/10 border border-red-500/30 text-red-500 hover:text-white hover:border-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] active:bg-red-500">
           <LogOut className="w-4 h-4" />
           <span className="text-xs font-semibold drop-shadow-md">Log Out</span>
        </div>
      </div>

      {/* SECTION 5 - Discover People */}
      <div className="mb-8">
        <div className="px-6 flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white">People you may know</h3>
          <span onClick={() => navigate('/discover')} className="text-xs text-[#B026FF] cursor-pointer hover:underline font-semibold">See all</span>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x">
          {mockUsers.slice(3, 8).map((mu, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={mu.id} 
              onClick={() => navigate(`/profile/${mu.username.replace('@', '')}`)}
              className="shrink-0 w-[140px] snap-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center relative cursor-pointer hover:bg-white/10 transition"
            >
              <X 
                className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-white" 
                onClick={(e) => e.stopPropagation()} 
              />
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#B026FF] to-[#00F0FF] mb-3">
                <img src={mu.avatar} alt={mu.username} className="w-full h-full rounded-full border-2 border-skrim-bg object-cover" />
              </div>
              <div className="flex items-center gap-1 w-full justify-center">
                 <p className="text-sm font-bold text-white text-center truncate">{mu.displayName}</p>
                 <BadgeRow stats={generateMockStatsForBadge(mu.username)} isSmall={true} />
              </div>
              <p className="text-[10px] text-gray-400 mb-1">{mu.username}</p>
              <p className="text-[9px] text-gray-500 mb-3">{i + 2} mutuals</p>
              <FollowButton username={mu.username} initialCount={mu.followers} className="w-full justify-center h-8 text-[11px]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 6 - Content Tabs */}
      <div className="sticky top-0 z-30 bg-skrim-bg/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex overflow-x-auto no-scrollbar px-2">
          {[
            { id: 'posts', icon: <div className="w-4 h-4 grid grid-cols-2 gap-0.5"><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /><div className="border border-current rounded-[2px]" /></div>, label: 'Posts' },
            { id: 'vibes', icon: <PlaySquare className="w-4 h-4" />, label: 'Vibes' },
            { id: 'saved', icon: <Bookmark className="w-4 h-4" />, label: 'Saved' },
            { id: 'reposts', icon: <Repeat className="w-4 h-4" />, label: 'Reposts' },
            { id: 'tagged', icon: <UserIcon className="w-4 h-4" />, label: 'Tagged' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 min-w-[70px] relative transition-colors ${activeTab === tab.id ? 'text-[#B026FF]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.icon}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] shadow-[0_-2px_10px_rgba(176,38,255,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {posts.map((post, i) => {
              const url = `https://picsum.photos/400/400?random=${i+10}`;
              return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 9) * 0.05 }}
                key={post.id} 
                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({ 
                  index: i, 
                  type: 'post', 
                  urls: posts.map((_, idx) => `https://picsum.photos/400/400?random=${idx+10}`)
                })}
              >
                <img src={url} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </motion.div>
            )})}
          </div>
        )}
        
        {activeTab === 'vibes' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {posts.slice(0, 6).map((post, i) => {
              const url = `https://picsum.photos/400/700?random=${i+20}`;
              return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 6) * 0.05 }}
                key={post.id} 
                className="aspect-[9/16] bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({ 
                  index: i, 
                  type: 'vibe', 
                  urls: posts.slice(0, 6).map((_, idx) => `https://picsum.photos/400/700?random=${idx+20}`)
                })}
              >
                <img src={url} alt="vibe" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2">
                   <PlaySquare className="w-4 h-4 text-white drop-shadow-md" />
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-md">
                   <PlaySquare className="w-3 h-3 fill-white/80" /> 1.{i}M
                </div>
              </motion.div>
            )})}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col">
          <div className="flex px-4 py-0 gap-6 border-b border-white/5">
            <button 
              className={`text-sm font-semibold py-3 px-1 relative ${activeSavedTab === 'bookmarks' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
              onClick={() => setActiveSavedTab('bookmarks')}
            >
              Bookmarks
              {activeSavedTab === 'bookmarks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
            </button>
            <button 
              className={`text-sm font-semibold py-3 px-1 relative flex items-center gap-1.5 ${activeSavedTab === 'offline' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
              onClick={() => setActiveSavedTab('offline')}
            >
              <Download className="w-4 h-4" /> Offline
              {activeSavedTab === 'offline' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
            </button>
          </div>

          {activeSavedTab === 'bookmarks' && (
           <div className="grid grid-cols-3 gap-0.5 pt-0.5">
             {savedItems.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-gray-500 text-sm">No saved posts yet.</div>
             ) : savedItems.map((item, i) => {
               const url = item.image || item.videoImageHover || item.videoImage;
               const isVideo = item.id?.startsWith('reel');
               return (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: (i % 6) * 0.05 }}
                 key={`saved-${item.id}`} 
                 className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                 onClick={() => setSelectedMedia({ 
                   index: i, 
                   type: isVideo ? 'vibe' : 'saved', 
                   urls: savedItems.map(it => it.image || it.videoImageHover || it.videoImage),
                   users: savedItems.map(it => ({ username: it.handle || it.userName || it.user?.username || '@someone', avatar: it.avatar || it.userAvatar || it.user?.avatar }))
                 })}
               >
                 <img src={url} alt="saved" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 {isVideo && <div className="absolute top-2 left-2"><PlaySquare className="w-4 h-4 text-white drop-shadow-md" /></div>}
                 <div className="absolute top-2 right-2"><Bookmark className="w-4 h-4 fill-[#00F0FF] text-[#00F0FF] drop-shadow-md" /></div>
               </motion.div>
             )})}
           </div>
          )}

          {activeSavedTab === 'offline' && (
           <div className="grid grid-cols-3 gap-0.5 pt-0.5">
             {offlineVibes.length === 0 ? (
                <div className="col-span-3 text-center py-24 text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
                   <Download className="w-10 h-10 text-gray-600 mb-2 opacity-50" />
                   <p className="font-medium text-white/50 text-base flex flex-col">No offline vibes downlaoded. <span className="text-xs mt-1">Save vibes to watch without internet.</span></p>
                </div>
             ) : offlineVibes.map((item, i) => {
               return (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: (i % 6) * 0.05 }}
                 key={`offline-${item.id}`} 
                 className="aspect-[3/4] bg-white/5 relative group cursor-pointer overflow-hidden"
                 onClick={() => setSelectedMedia({ 
                   index: i, 
                   type: 'vibe', 
                   urls: offlineVibes.map(v => v.videoUrl),
                   users: offlineVibes.map(v => {
                     const c = v.creator;
                     if (!c || Object.keys(c).length === 0) return { username: '@someone', avatar: 'https://i.pravatar.cc/150' };
                     return {
                       username: c.username || c.handle || c.user || c.displayName || '@someone',
                       avatar: c.avatar || 'https://i.pravatar.cc/150'
                     };
                   })
                 })}
                 onContextMenu={(e) => {
                   e.preventDefault();
                   if (window.confirm(`Delete offline vibe: ${item.caption}?`)) {
                     deleteVibe(item.id);
                   }
                 }}
               >
                 <img src={item.thumbnail} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute top-2 left-2"><PlaySquare className="w-4 h-4 text-white drop-shadow-md" /></div>
                 
                 <div className="absolute top-2 right-2 flex items-center justify-center bg-black/60 backdrop-blur text-white text-[10px] w-6 h-6 rounded-full shadow">
                    <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
                 </div>

                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                   {(item.creator?.username || item.creator?.handle) && <p className="text-white text-xs font-semibold truncate drop-shadow">{item.creator.username || item.creator.handle}</p>}
                   {item.caption && <p className="text-white/80 text-[10px] truncate mt-0.5 drop-shadow">{item.caption}</p>}
                 </div>
               </motion.div>
             )})}
           </div>
          )}
          </div>
        )}

        {activeTab === 'reposts' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {repostItems.length === 0 ? (
               <div className="col-span-3 text-center py-20 text-gray-500 text-sm">No reposts yet.</div>
            ) : repostItems.map((item, i) => {
              const url = item.image || item.videoImageHover || item.videoImage;
              const isVideo = item.id?.startsWith('reel');
              return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 6) * 0.05 }}
                key={`repost-${item.id}`} 
                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({ 
                  index: i, 
                  type: isVideo ? 'vibe' : 'repost', 
                  urls: repostItems.map(it => it.image || it.videoImageHover || it.videoImage),
                  users: repostItems.map(it => ({ username: it.handle || it.userName || it.user?.username || '@someone', avatar: it.avatar || it.userAvatar || it.user?.avatar }))
                })}
              >
                <img src={url} alt="repost" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {isVideo && <div className="absolute top-2 left-2"><PlaySquare className="w-4 h-4 text-white drop-shadow-md" /></div>}
                <div className="absolute top-2 right-2"><Repeat className="w-4 h-4 text-green-400 drop-shadow-md" /></div>
              </motion.div>
            )})}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="grid grid-cols-3 gap-0.5 pt-0.5">
            {posts.slice(0, 6).map((post, i) => {
              const url = `https://picsum.photos/400/400?random=${i+30+activeTab.charCodeAt(0)}`;
              return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (i % 6) * 0.05 }}
                key={`${activeTab}-${post.id}`} 
                className="aspect-square bg-white/5 relative group cursor-pointer overflow-hidden"
                onClick={() => setSelectedMedia({ 
                  index: i, 
                  type: 'tagged', 
                  urls: posts.slice(0, 6).map((_, idx) => `https://picsum.photos/400/400?random=${idx+30+activeTab.charCodeAt(0)}`)
                })}
              >
                <img src={url} alt={activeTab} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 left-2"><UserIcon className="w-4 h-4 fill-white text-white drop-shadow-md" /></div>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Selected Media Fullscreen Modal */}
      {selectedMedia && (
        <ImmersivePostViewer
          initialIndex={selectedMedia.index}
          type={selectedMedia.type}
          urls={selectedMedia.urls}
          user={user}
          users={selectedMedia.users}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Log Out Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1F1F1F] border border-white/10 rounded-2xl w-full max-w-[280px] p-6 text-center select-none"
          >
            <h3 className="text-lg font-bold text-white mb-2">Log Out?</h3>
            <p className="text-sm text-gray-400 mb-6 px-2">Are you sure you want to log out of SkrimChat?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition active:scale-95">Cancel</button>
              <button onClick={() => {
                setShowLogoutConfirm(false);
                handleLogout();
              }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/50 font-semibold text-sm hover:bg-red-500/30 transition active:scale-95">Log Out</button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-8 left-1/2 z-[150] bg-black/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-full border border-white/20 select-none"
          >
            <span className="text-white text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-skrim-bg w-full max-w-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40">
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white transition font-medium">Cancel</button>
              <h3 className="text-lg font-bold">Edit Profile</h3>
              <button onClick={handleSaveProfile} className="text-[#B026FF] hover:text-[#00F0FF] transition font-bold">Save</button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto no-scrollbar space-y-5">
              
              {/* Photo Edit Areas */}
              <div className="flex flex-col gap-6 py-2">
                 <div className="flex flex-col items-center gap-3">
                   <div className="relative group cursor-pointer" onClick={() => modalAvatarInputRef.current?.click()}>
                      <img src={editAvatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:opacity-50 transition bg-black" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-full">
                         <Camera className="w-8 h-8 text-white" />
                      </div>
                   </div>
                   <input type="file" ref={modalAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditAvatar)} />
                 </div>

                 <div className="flex flex-col items-center gap-2 w-full mt-2">
                   <div 
                     className="w-full h-28 rounded-xl border-2 border-white/10 overflow-hidden relative group cursor-pointer"
                     onClick={() => modalCoverInputRef.current?.click()}
                   >
                     {editCover && editCover !== 'none' ? (
                       <img src={editCover} alt="Cover" className="w-full h-full object-cover group-hover:opacity-50 transition" />
                     ) : (
                       <div className="w-full h-full bg-gradient-to-br from-[#B026FF] to-[#00F0FF] opacity-80 group-hover:opacity-50 transition" />
                     )}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                       <div className="flex items-center gap-2 text-white font-semibold text-sm">
                         <Camera className="w-5 h-5" /> Change Cover Photo
                       </div>
                     </div>
                   </div>
                   <input type="file" ref={modalCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEditCover)} />
                 </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                    <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.replace(/@/g, ''))} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bio</label>
                    <span className="text-xs text-gray-500 font-semibold">{editBio.length}/150</span>
                  </div>
                  <textarea maxLength={150} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors min-h-[100px] resize-none" placeholder="Write something cool... ✨" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Website</label>
                  <input type="text" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" placeholder="https://" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Location</label>
                  <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors" placeholder="e.g. Mumbai, India" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {user && (
        <ShareProfileSheet
          isOpen={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          user={{
            username: user.username || user.displayName || '',
            displayName: user.fullName || user.displayName || 'You',
            avatar: user.avatar || '',
            bio: user.bio,
            followers: user.followers || 0,
            score: statsData.pulse,
            posts: posts.length
          }}
        />
      )}

      <StatBreakdownSheet
        isOpen={activeStatType !== null}
        onClose={() => setActiveStatType(null)}
        type={activeStatType}
        stats={statsData}
      />

      {activeHighlightGroup.length > 0 && (
        <SparkViewer
          groupedSparks={activeHighlightGroup}
          initialUserIndex={0}
          onClose={() => {
            setActiveHighlightGroup([]);
            setActiveHighlightName('');
            setIsHighlightViewer(true);
          }}
          currentUser={user}
          isHighlightMode={isHighlightViewer}
          highlightName={activeHighlightName}
          onDelete={(sparkId) => {
             // Let's remove it from activeHighlightGroup if there
             setActiveHighlightGroup(prev => {
                if (prev.length === 0) return prev;
                const newSparks = prev[0].sparks.filter((s:any) => s.id !== sparkId);
                return [{ ...prev[0], sparks: newSparks }];
             });
          }}
        />
      )}



      {/* Highlight Options Sheet */}
      <AnimatePresence>
        {activeHighlightOptions && (
          <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveHighlightOptions(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl pb-safe pointer-events-auto"
            >
              <div className="w-12 h-1.5 bg-[#B026FF] rounded-full mx-auto my-4 opacity-80" />
              
              <div className="px-4 pb-6 space-y-2">
                <button
                  onClick={() => {
                    setRenameInput(activeHighlightOptions.title);
                    setActiveHighlightRename(activeHighlightOptions);
                    setActiveHighlightOptions(null);
                  }}
                  className="w-full h-[52px] flex items-center px-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-2xl text-left"
                >
                  <span className="text-xl mr-3">🏷️</span>
                  <span className="font-semibold text-white">Rename Highlight</span>
                </button>

                <div className="h-px w-full bg-white/10 my-1" />

                <button
                  onClick={() => {
                    const highlightToDelete = activeHighlightOptions;
                    setActiveHighlightOptions(null);
                    setConfirmDialog({
                      visible: true,
                      title: "Delete Highlight?",
                      message: "This cannot be undone.",
                      onConfirm: () => {
                        const updated = highlights.filter((h) => h.id !== highlightToDelete.id);
                        localStorage.setItem("skrimchat_highlights", JSON.stringify(updated));
                        setHighlights(updated);
                        setToastMessage("🗑️ Highlight deleted");
                        setTimeout(() => setToastMessage(""), 2000);
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  className="w-full h-[52px] flex items-center px-4 bg-white/5 hover:bg-red-500/10 active:scale-95 transition-all rounded-2xl text-left"
                >
                  <span className="text-xl mr-3">🗑️</span>
                  <span className="font-semibold text-red-500">Delete Highlight</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Highlight Modal */}
      <AnimatePresence>
        {activeHighlightRename && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveHighlightRename(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Rename Highlight</h3>
              <input
                autoFocus
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B026FF] transition-colors mb-6"
                placeholder="Highlight Name"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveHighlightRename(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!renameInput.trim()}
                  onClick={() => {
                    const updated = highlights.map((h) => 
                      h.id === activeHighlightRename.id 
                        ? { ...h, title: renameInput.trim() }
                        : h
                    );
                    localStorage.setItem("skrimchat_highlights", JSON.stringify(updated));
                    setHighlights(updated);
                    setToastMessage("✅ Highlight renamed");
                    setTimeout(() => setToastMessage(""), 2000);
                    setActiveHighlightRename(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#B026FF] to-[#00F0FF] disabled:opacity-50 transition-opacity"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-400 mb-6">{confirmDialog.message}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="w-full py-3.5 rounded-xl font-bold text-white/70 bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MENU */}
      <AnimatePresence>
        {showSettingsMenu && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowSettingsMenu(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 overflow-hidden"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /> Settings</h2>
                 <button onClick={() => setShowSettingsMenu(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowDataSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                     <Zap className="w-5 h-5 text-[#1DB954]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Data & Storage</p>
                     <p className="text-white/50 text-sm">Video Quality, Auto-play limits</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowNotifSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center shrink-0">
                     <Bell className="w-5 h-5 text-[#00F0FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Notifications</p>
                     <p className="text-white/50 text-sm">New vibes, Follow alerts</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowFeedSettings(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                     <Repeat className="w-5 h-5 text-[#B026FF]" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Feed Preferences</p>
                     <p className="text-white/50 text-sm">Regional boost, Content filtering</p>
                   </div>
                 </button>

                 <button className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition" onClick={() => {
                   setShowSettingsMenu(false);
                   setShowLogoutConfirm(true);
                 }}>
                   <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                     <LogOut className="w-5 h-5 text-red-500" />
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-bold text-white text-lg">Log Out</p>
                     <p className="text-white/50 text-sm">Switch accounts securely</p>
                   </div>
                 </button>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* DATA SETTINGS */}
      <AnimatePresence>
        {showDataSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowDataSettings(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
                 <button onClick={() => { setShowDataSettings(false); setShowSettingsMenu(true); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-[#1DB954]" /> Video Quality</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 {DATA_MODES.map(mode => (
                   <button 
                     key={mode.id}
                     className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${dataMode === mode.id ? 'bg-[#1DB954]/10 border-[#1DB954] shadow-inner' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                     onClick={() => {
                       setDataMode(mode.id);
                       setToastMessage(`Switched to ${mode.label} mode`);
                       setTimeout(() => setShowDataSettings(false), 300);
                     }}
                   >
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dataMode === mode.id ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white'}`}>
                       <span className="text-xl">{mode.icon}</span>
                     </div>
                     <div className="flex-1">
                       <p className={`font-bold ${dataMode === mode.id ? 'text-[#1DB954]' : 'text-white'}`}>{mode.label}</p>
                       <p className="text-white/60 text-sm mt-0.5">{mode.description}</p>
                     </div>
                     {dataMode === mode.id && <Check className="w-5 h-5 text-[#1DB954] mt-2 shrink-0" />}
                   </button>
                 ))}
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* FEED SETTINGS */}
      <AnimatePresence>
        {showFeedSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowFeedSettings(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
                 <button onClick={() => { setShowFeedSettings(false); setShowSettingsMenu(true); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Repeat className="w-5 h-5 text-[#B026FF]" /> Feed Preferences</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex-1 pr-4">
                     <p className="font-bold text-white text-lg flex items-center gap-2">
                        Regional Content Boost
                     </p>
                     <p className="text-white/60 text-sm mt-1">
                       Boost content from creators in your country and state, and who speak your primary language. Default ON.
                     </p>
                   </div>
                   
                   <button 
                      onClick={() => setRegionalBoost(!regionalBoostEnabled)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${regionalBoostEnabled ? 'bg-[#B026FF]' : 'bg-white/20'}`}
                   >
                      <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${regionalBoostEnabled ? 'left-7' : 'left-1'}`} />
                   </button>
                 </div>
               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* NOTIFICATION SETTINGS */}
      <AnimatePresence>
        {showNotifSettings && (
           <>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
               onClick={() => setShowNotifSettings(false)}
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#141414] rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
             >
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
               <div className="px-6 flex items-center gap-3 pb-4 shrink-0 border-b border-white/5">
                 <button onClick={() => { setShowNotifSettings(false); setShowSettingsMenu(true); }} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-[#00F0FF]" /> Notifications</h2>
               </div>
               
               <div className="p-4 flex flex-col gap-2 overflow-y-auto pb-8">
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex-1 pr-4">
                     <p className="font-bold text-white text-lg flex items-center gap-2">
                        New Vibes from Followed Creators
                     </p>
                     <p className="text-white/60 text-sm mt-1">
                       Receive push notifications and in-app alerts when people you follow post new Vibes.
                     </p>
                   </div>
                   
                   <button 
                      onClick={() => toggleGlobalVibeNotifications(!globalVibeNotificationsEnabled)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${globalVibeNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                   >
                      <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${globalVibeNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                   </button>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-2 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg flex items-center gap-2">
                          Likes on your Vibes
                       </p>
                       <p className="text-white/60 text-sm mt-1">
                         Get notified when someone pulses your vibe.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleLikesNotifications(!useNotificationStore.getState().likesNotificationsEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${useNotificationStore.getState().likesNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().likesNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   {useNotificationStore.getState().likesNotificationsEnabled && (
                     <div className="flex items-center justify-between p-4 pl-8 bg-black/20">
                       <div className="flex-1 pr-4">
                         <p className="font-medium text-white text-md flex items-center gap-2">
                            Only milestone likes
                         </p>
                         <p className="text-white/50 text-xs mt-1">
                           Limit notifications to major milestones (10, 100, 1K...).
                         </p>
                       </div>
                       
                       <button 
                          onClick={() => useNotificationStore.getState().toggleLikesMilestonesOnly(!useNotificationStore.getState().likesMilestonesOnly)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${useNotificationStore.getState().likesMilestonesOnly ? 'bg-[#1DB954]' : 'bg-white/20'}`}
                       >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().likesMilestonesOnly ? 'left-7' : 'left-1'}`} />
                       </button>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-2 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg flex items-center gap-2">
                          Comments on your Vibes
                       </p>
                       <p className="text-white/60 text-sm mt-1">
                         Get notified when someone comments on your vibe.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleCommentsNotifications(!useNotificationStore.getState().commentsNotificationsEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${useNotificationStore.getState().commentsNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().commentsNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   <div className="flex items-center justify-between p-4 bg-black/20">
                     <div className="flex-1 pr-4">
                       <p className="font-medium text-white text-md flex items-center gap-2">
                          Replies to your comments
                       </p>
                       <p className="text-white/50 text-xs mt-1">
                         Get notified when someone replies to you.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleRepliesNotifications(!useNotificationStore.getState().repliesNotificationsEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${useNotificationStore.getState().repliesNotificationsEnabled ? 'bg-[#1DB954]' : 'bg-white/20'}`}
                     >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().repliesNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-2 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg flex items-center gap-2">
                          Blaze Run reminders
                       </p>
                       <p className="text-white/60 text-sm mt-1">
                         Get reminded to keep your streak alive.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleBlazeRunReminders(!useNotificationStore.getState().blazeRunRemindersEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${useNotificationStore.getState().blazeRunRemindersEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().blazeRunRemindersEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   
                   {useNotificationStore.getState().blazeRunRemindersEnabled && (
                     <div className="flex items-center justify-between p-4 pl-8 bg-black/20">
                       <div className="flex-1 pr-4">
                         <p className="font-medium text-white text-md flex items-center gap-2">
                            Reminder time
                         </p>
                       </div>
                       
                       <input 
                          type="time" 
                          className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1 outline-none text-sm"
                          value={useNotificationStore.getState().blazeRunReminderTime}
                          onChange={(e) => useNotificationStore.getState().setBlazeRunReminderTime(e.target.value)}
                       />
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-2 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg flex items-center gap-2">
                          Pulse reward alerts
                       </p>
                       <p className="text-white/60 text-sm mt-1">
                         Get notified when you earn pulse points.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().togglePulseRewards(!useNotificationStore.getState().pulseRewardsEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${useNotificationStore.getState().pulseRewardsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().pulseRewardsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

                 <div className="flex flex-col gap-0 bg-white/5 rounded-2xl border border-white/5 mt-2 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-white/5">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-white text-lg flex items-center gap-2">
                          New vibes in my language
                       </p>
                       <p className="text-white/60 text-sm mt-1">
                         Get notified when fresh vibes drop in your detected language.
                       </p>
                     </div>
                     
                     <button 
                        onClick={() => useNotificationStore.getState().toggleLanguageMatchNotifications(!useNotificationStore.getState().languageMatchNotificationsEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${useNotificationStore.getState().languageMatchNotificationsEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all ${useNotificationStore.getState().languageMatchNotificationsEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                 </div>

               </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
}
