import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, MapPin, Link as LinkIcon, Zap, PlaySquare, Bookmark, Repeat, MessageCircle, Eye, Calendar, Sparkles, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockUsers, mockPosts } from '../lib/mock/mockData';
import { AvatarWithRing, FollowButton } from '../components/ui';
import { ImmersivePostViewer } from '../components/ImmersivePostViewer';
import { useSocialCounts, useFollowStatus, sendRequest, hasSentRequest } from '../lib/mock/mockSocialGraph';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotificationStore, simulateCreatorPost } from '../store/notificationStore';
import { MessageRequestSheet } from '../components/MessageRequestSheet';
import { ShareProfileSheet } from '../components/ShareProfileSheet';
import { StatBreakdownSheet } from '../components/StatBreakdownSheet';
import { BadgeRow } from '../components/BadgeComponents';

// Helper to calculate score/streaks based on mock user likes/followers
const getStats = (user: any) => {
  const followScore = Math.floor(user.followers * 1.5 + user.following * 0.5);
  return {
    pulseScore: Math.floor(followScore * 3 + Math.random() * 500 + 200),
    blazeRun: Math.floor(Math.random() * 30) + 1,
    vibeRating: parseFloat((Math.random() * 2 + 8).toFixed(1)),
    profileViews: Math.floor(Math.random() * 100000) + 500,
    followers: user.followers
  };
};

export default function OtherUserProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const user = React.useMemo(() => {
    const foundUser = mockUsers.find(u => u.username === username || u.username === `@${username}`);
    if (foundUser) return foundUser;
    
    return {
      id: `u_${username}`,
      username: `@${username}`,
      displayName: username?.replace(/_/g, ' ') || 'User',
      avatar: `https://i.pravatar.cc/150?u=${username}`,
      followers: 420,
      following: 69,
      bio: 'Just vibing on SkrimChat. ⚡'
    };
  }, [username]);

  const [activeTab, setActiveTab] = useState<'posts'|'vibes'|'tagged'>('posts');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{index: number, type: 'post'|'vibe'|'saved'|'repost'|'tagged'|string, urls: string[]} | null>(null);

  const currentUser = useCurrentUser();
  const followStatus = useFollowStatus(user.username);
  const socialCounts = useSocialCounts(user.username, user.followers, user.following);
  const updatedUserWithCounts = { ...user, followers: socialCounts.followers };
  const stats = React.useMemo(() => getStats(updatedUserWithCounts), [updatedUserWithCounts.followers]);
  const [requestSent, setRequestSent] = useState(false);
  const [showRequestSheet, setShowRequestSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeStatType, setActiveStatType] = useState<'pulse' | 'blaze' | 'views' | 'vibe' | null>(null);

  const { creatorNotificationPrefs, toggleCreatorNotifications, globalVibeNotificationsEnabled } = useNotificationStore();
  const isCreatorNotifEnabled = creatorNotificationPrefs[user.username] !== false; // default true
  const showBell = followStatus.following && globalVibeNotificationsEnabled;

  useEffect(() => {
    if (currentUser?.username && user?.username) {
       setRequestSent(hasSentRequest(currentUser.username, user.username));
    }
  }, [currentUser, user]);

  const [showShareSheet, setShowShareSheet] = useState(false);

  const handleMessageClick = () => {
    if (followStatus.following && followStatus.followedBy) {
      navigate(`/connect?user=${user.username.replace('@', '')}`);
    } else if (followStatus.following || followStatus.followedBy) {
      if (!requestSent) {
         setShowRequestSheet(true);
      }
    }
  };

  const handleShowToast = (msg: string) => {
     setToastMessage(msg);
     setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Filter mock posts for this user (or just use generic mock posts if they don't have enough)
  let userPosts = mockPosts.filter((p: any) => p.user === user.username || p.handle === user.username || p.handle === `@${user.username}`) as any[];
  if (userPosts.length < 6) {
    // Fill with random images to make the grid look good
    const extra = Array.from({ length: 6 - userPosts.length }).map((_, i) => ({
      id: `fallback_${i}`,
      image: `https://picsum.photos/400/400?random=${username}_${i}`,
      type: i % 2 === 0 ? 'post' : 'vibe'
    }));
    userPosts = [...userPosts, ...extra] as any[];
  }

  const postsGrid = userPosts.slice(0, 9);
  const selectedMediaUrls = postsGrid.map((p: any) => p.image || p.urls?.[0] || 'https://picsum.photos/400/400').filter(Boolean);

  return (
    <div className="h-full bg-skrim-bg overflow-y-auto no-scrollbar flex flex-col pb-20 relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-skrim-bg/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-1">
          <span className="font-bold text-white text-lg tracking-tight">{user.username.startsWith('@') ? user.username : `@${user.username}`}</span>
        </div>
        <div className="flex items-center gap-1">
          {showBell && (
            <button 
              onClick={() => {
                 toggleCreatorNotifications(user.username, !isCreatorNotifEnabled);
                 handleShowToast(isCreatorNotifEnabled ? `Notifications muted for ${user.displayName}` : `Notifications enabled for ${user.displayName}`);
              }} 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95"
            >
              {isCreatorNotifEnabled ? <Bell className="w-5 h-5 text-neon-purple shadow-neon-purple drop-shadow" /> : <BellOff className="w-5 h-5 text-gray-500" />}
            </button>
          )}
          <button onClick={() => setShowMoreMenu(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition active:scale-95">
            <MoreVertical className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Cover Profile layout similar to IdentityScreen */}
      <div className="relative w-full h-40 group">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/40 via-blue-500/20 to-skrim-bg opacity-80 mix-blend-screen" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-skrim-bg to-transparent" />
      </div>

      <div className="px-6 relative -top-12">
         {/* Avatar row */}
         <div className="flex justify-between items-end mb-4">
            <div className="relative">
               <AvatarWithRing src={user.avatar} size="xl" className="border-4 border-skrim-bg shrink-0 bg-skrim-surface shadow-[0_0_15px_rgba(0,0,0,0.5)]" showOnlineDot username={user.username} />
            </div>
            
            <div className="flex flex-col items-end gap-2">
               <div className="flex gap-2">
                  <FollowButton username={user.username} initialCount={user.followers} variant="profile" />
                  {(followStatus.following || followStatus.followedBy) && (
                    <button 
                      onClick={handleMessageClick}
                      className="px-4 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition active:scale-95 gap-2 font-bold text-sm"
                    >
                      {followStatus.following && followStatus.followedBy ? (
                         <><MessageCircle className="w-5 h-5 text-white" /> Message</>
                      ) : (
                         requestSent ? "Request Sent" : "📨 Send Request"
                      )}
                    </button>
                  )}
               </div>
               {!followStatus.following && !followStatus.followedBy && (
                  <span className="text-xs text-gray-400">Follow to connect</span>
               )}
            </div>
         </div>

         {/* User Info */}
         <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-black text-white tracking-tight">{user.displayName || user.username?.replace('@','')}</h2>
            </div>
            <p className="text-sm font-medium text-neon-purple/90 mb-3">{user.username.startsWith('@') ? user.username : `@${user.username}`}</p>
            
            <div className="mb-4">
               <BadgeRow stats={stats} />
            </div>

            <p className="text-sm text-gray-300 leading-relaxed max-w-[90%] mb-4">{user.bio || 'Living the dream on SkrimChat. Connect with me!'}</p>
            
            {/* Extended stats container */}
            <div className="flex items-center gap-6 mt-2 mb-6">
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{postsGrid.length}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Posts</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{updatedUserWithCounts.followers >= 1000 ? (updatedUserWithCounts.followers/1000).toFixed(1) + 'K' : updatedUserWithCounts.followers}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Followers</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{user.following}</span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Following</span>
               </div>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
               <button onClick={() => setActiveStatType('pulse')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <Zap className="w-5 h-5 text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all" />
                 <span className="text-[10px] text-gray-400">Score</span>
                 <span className="text-xs font-bold text-white">{(stats.pulseScore >= 1000 ? (stats.pulseScore / 1000).toFixed(1) + 'K' : stats.pulseScore)}</span>
               </button>
               <button onClick={() => setActiveStatType('blaze')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <span className="text-xl group-hover:scale-110 transition-transform">🔥</span>
                 <span className="text-[10px] text-gray-400">Blaze Run</span>
                 <span className="text-xs font-bold text-white">{stats.blazeRun}</span>
               </button>
               <button onClick={() => setActiveStatType('views')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <Eye className="w-5 h-5 text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] transition-all" />
                 <span className="text-[10px] text-gray-400">Views</span>
                 <span className="text-xs font-bold text-white">{(stats.profileViews >= 1000 ? (stats.profileViews / 1000).toFixed(1) + 'K' : stats.profileViews)}</span>
               </button>
               <button onClick={() => setActiveStatType('vibe')} className="bg-skrim-surface border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group w-full">
                 <span className="text-xl group-hover:scale-110 transition-transform">💜</span>
                 <span className="text-[10px] text-gray-400">Rating</span>
                 <span className="text-xs font-bold text-white">{stats.vibeRating}</span>
               </button>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/10 mb-4 bg-skrim-bg sticky top-[72px] z-30">
        {[
          { id: 'posts', label: 'Posts', icon: Zap },
          { id: 'vibes', label: 'Vibes', icon: PlaySquare },
          { id: 'tagged', label: 'Tagged', icon: Sparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition relative ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]' : ''}`} />
            {activeTab === tab.id && (
              <motion.div layoutId="activeProfileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-3 gap-0.5 pb-8">
        {postsGrid.map((p, i) => {
          const post: any = p;
          return (
          <div 
             key={post.id || i} 
             className="aspect-square bg-gray-900 border border-white/5 relative cursor-pointer group"
             onClick={() => setSelectedMedia({ index: i, type: post.type || 'post', urls: selectedMediaUrls })}
          >
            <img src={post.image || selectedMediaUrls[i]} alt="post" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
            {(post.type === 'vibe' || post.type === 'reel') && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                 <PlaySquare className="w-3 h-3 text-white" />
              </div>
            )}
            {/* Hover overlay with minimal stats */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white">
               <div className="flex items-center gap-1"><Zap className="w-4 h-4 fill-white" /><span className="text-xs font-bold font-mono">1.2K</span></div>
               <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" /><span className="text-xs font-bold font-mono">48</span></div>
            </div>
          </div>
        )})}
        {postsGrid.length === 0 && (
          <div className="col-span-3 py-10 flex flex-col items-center justify-center text-gray-500 gap-2">
             <Sparkles className="w-8 h-8 opacity-50" />
             <p className="text-sm">No content yet</p>
          </div>
        )}
      </div>

      {/* Selected Media Immersive Viewer */}
      {selectedMedia && (
        <ImmersivePostViewer
          initialIndex={selectedMedia.index}
          type={selectedMedia.type as any}
          urls={selectedMedia.urls}
          user={user}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Bottom Sheet for More Options */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
               onClick={() => setShowMoreMenu(false)}
            />
            <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="fixed bottom-0 inset-x-0 bg-skrim-surface border-t border-white/10 rounded-t-3xl z-[120] pb-10 px-4 pt-4"
            >
               <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
               <div className="flex flex-col gap-2">
                 <button onClick={() => {
                   setShowMoreMenu(false);
                   setShowShareSheet(true);
                 }} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-white font-medium">
                   <LinkIcon className="w-5 h-5 text-gray-400" /> Share Profile
                 </button>
                 <button onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-red-500 font-medium">
                   <span className="w-5 h-5 flex items-center justify-center text-lg leading-none">🚫</span> Block {user.username}
                 </button>
                 <button onClick={() => setShowMoreMenu(false)} className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 transition text-left text-orange-400 font-medium">
                   <span className="w-5 h-5 flex items-center justify-center text-lg leading-none">⚑</span> Report Profile
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MessageRequestSheet
        isOpen={showRequestSheet}
        onClose={() => setShowRequestSheet(false)}
        targetUser={{ username: user.username, displayName: user.displayName, avatar: user.avatar }}
        currentUser={{ username: currentUser?.username || '', avatar: currentUser?.avatar || '' }}
        onRequestSent={() => {
           setRequestSent(true);
           handleShowToast(`⚡ Request sent to ${user.displayName}!`);
        }}
      />

      <ShareProfileSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        user={{
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          followers: user.followers,
          score: stats.pulseScore,
          posts: userPosts.length
        }}
      />
      
      <StatBreakdownSheet
        isOpen={activeStatType !== null}
        onClose={() => setActiveStatType(null)}
        type={activeStatType}
        stats={{pulse: stats.pulseScore, blaze: stats.blazeRun, views: stats.profileViews, vibe: stats.vibeRating}}
      />

      {/* Basic Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_40px_rgba(176,38,255,0.4)] z-[200] whitespace-nowrap flex items-center gap-2"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
