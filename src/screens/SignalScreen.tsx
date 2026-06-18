import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, UserPlus, CheckCircle, Zap } from 'lucide-react';
import { getNotifications } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { AvatarWithRing } from '../components/ui';
import { Link } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';
import { SparkViewer } from '../components/SparkViewer';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function SignalScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeSpark, setActiveSpark] = useState<any>(null);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const currentUser = useCurrentUser();

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      let loadedNotifs: any[] = [];
      if (FEATURE_FLAGS.MOCK_MODE) {
        const baseNotifs = await getNotifications();
        // Inject FOMO notifications
        const fomoNotifs = [
           { id: 'fomo1', user: 'NeonSamurai', avatar: 'https://i.pravatar.cc/150?img=2', type: 'fomo', text: 'just became a BLAZE CREATOR! 🔥', isRead: false, time: '2m' },
           { id: 'fomo2', user: 'CyberGhost', avatar: 'https://i.pravatar.cc/150?img=1', type: 'fomo', text: 'unlocked the FLAME CREATOR badge! ☄️', isRead: true, time: '1h' }
        ];
        
        let sparkExpiryNotifs: any[] = [];
        const mySparksStr = localStorage.getItem('skrimchat_sparks');
        if (mySparksStr) {
          try {
            const mySparks = JSON.parse(mySparksStr);
            const now = Date.now();
            mySparks.forEach((s: any) => {
              if (s.expiresAt && s.expiresAt > now && s.expiresAt - now <= 60 * 60 * 1000) {
                const mins = Math.floor((s.expiresAt - now) / 60000);
                sparkExpiryNotifs.push({
                   id: 'expiry_' + s.id,
                   user: 'System',
                   avatar: '',
                   type: 'alert',
                   text: `⏰ Your Spark expires in ${mins} minute${mins !== 1 ? 's' : ''}! Save it to Highlights to keep it forever! ✨`,
                   isRead: false,
                   time: 'Just now',
                   sparkId: s.id
                });
              }
            });
          } catch(e) {}
        }

        let collabInvitesNotifs: any[] = [];
        const savedInvitesStr = localStorage.getItem('skrimchat_collab_invites');
        if (savedInvitesStr) {
          try {
            const invites = JSON.parse(savedInvitesStr);
            invites.forEach((invite: any) => {
              if (invite.status === 'pending' && invite.spark.collabPartner) {
                collabInvitesNotifs.push({
                   id: invite.id,
                   user: invite.spark.creator?.username || invite.spark.creator?.displayName || "User",
                   avatar: invite.spark.creator?.avatar || '',
                   type: 'collab_invite',
                   text: `invited you to collab on a spark! ✨`,
                   isRead: false,
                   time: 'Just now',
                   spark: invite.spark
                });
              }
            });
          } catch(e) {}
        }
        
        let mentionNotifs: any[] = [];
        const savedMentionsStr = localStorage.getItem('skrimchat_mention_notifs');
        if (savedMentionsStr) {
          try {
             mentionNotifs = JSON.parse(savedMentionsStr);
          } catch(e) {}
        }
        
        let inAppNotifs: any[] = [];
        const inApp = JSON.parse(localStorage.getItem('skrimchat_inapp_notifs') || '[]');
        if (inApp && inApp.length > 0) {
           inAppNotifs = inApp.map((n: any) => ({
             id: n.id,
             user: n.creatorName,
             avatar: n.creatorAvatar,
             type: n.type,
             text: n.body,
             isRead: n.read || false,
             time: 'Just now',
             vibeId: n.vibeId,
             thumbnail: n.thumbnail
           }));
        }
        
        // randomly insert them
        loadedNotifs = [...inAppNotifs, ...mentionNotifs, ...collabInvitesNotifs, ...sparkExpiryNotifs, ...fomoNotifs, ...baseNotifs];
      }
      setNotifications(loadedNotifs);
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  const markAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
          <button onClick={markAsRead} className="text-xs text-neon-purple font-medium flex items-center gap-1">
             <CheckCircle className="w-3 h-3" /> Mark Read
          </button>
        </div>
        <div className="flex gap-4">
          {['all', 'unread', 'mentions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === tab ? 'border-neon-purple text-white' : 'border-transparent text-gray-500'}`}>
               {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col flex-1 px-4 py-2">
        {loading ? (
             <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 text-center p-8 opacity-50">
             <Bell className="w-8 h-8 mb-2" />
             <p className="text-sm">No notifications here.</p>
           </div>
        ) : filtered.map(notif => (
           <div key={notif.id} className={`flex items-center gap-4 py-4 border-b border-white/5 ${!notif.isRead ? 'bg-neon-purple/5 -mx-4 px-4' : ''}`}>
              <div 
                 className="relative cursor-pointer hover:opacity-80 transition"
                 onClick={() => navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`)}
              >
                 <AvatarWithRing src={notif.avatar} size="md" />
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-skrim-surface flex items-center justify-center border-2 border-black">
                   {notif.type === 'pulse' && <Zap className="w-2.5 h-2.5 text-[#B026FF] fill-[#B026FF]" />}
                   {notif.type === 'comment' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'mention' && <span className="text-[10px] text-neon-purple font-black">@</span>}
                   {notif.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-green-400" />}
                   {notif.type === 'fomo' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'collab_invite' && <span className="text-[10px]">👥</span>}
                   {notif.type === 'new_vibe' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'vibe_like' && <Zap className="w-2.5 h-2.5 text-yellow-400" />}
                   {notif.type === 'vibe_comment' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'vibe_reply' && <MessageCircle className="w-2.5 h-2.5 text-blue-400" />}
                   {notif.type === 'streak_reminder' && <span className="text-[10px]">🔥</span>}
                   {notif.type === 'lang_match' && <span className="text-[10px]">🌍</span>}
                 </div>
              </div>
              <div className="flex-1" onClick={() => {
                 if (notif.type === 'streak_reminder') {
                   navigate('/vibes');
                 } else if (notif.type === 'lang_match') {
                   if (notif.languages && notif.languages.length > 0) {
                     navigate(`/vibes?lang=${notif.languages[0]}`);
                   } else {
                     navigate('/vibes');
                   }
                 } else if (notif.type === 'new_vibe' || notif.type === 'vibe_like') {
                   navigate(`/vibes?id=${notif.vibeId}`);
                 } else if (notif.type === 'vibe_comment' || notif.type === 'vibe_reply') {
                   navigate(`/vibes?id=${notif.vibeId}&comment=${notif.commentId}`);
                 } else if (notif.type === 'alert' && notif.sparkId) {
                   const mySparksStr = localStorage.getItem('skrimchat_sparks');
                   if (mySparksStr) {
                     const mySparks = JSON.parse(mySparksStr);
                     const spark = mySparks.find((s: any) => s.id === notif.sparkId);
                     if (spark) setActiveSpark(spark);
                   }
                 } else if (notif.type === 'collab_invite' && notif.spark) {
                   setActiveSpark(notif.spark);
                 }
              }}>
                 <p className="text-sm">
                    <span 
                       className="font-semibold text-white cursor-pointer hover:underline"
                       onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/profile/${notif.user.replace(/\s+/g, '_').toLowerCase()}`);
                       }}
                    >{notif.user}</span>{' '}
                    <span className="text-gray-400">{notif.text}</span>
                 </p>
                 <span className="text-[10px] text-neon-purple font-medium">{notif.time}</span>
              </div>
              {notif.thumbnail && (
                <img src={notif.thumbnail} alt="vibe-thumb" className="w-12 h-16 rounded-md object-cover shadow-md ml-2 border border-white/10" />
              )}
           </div>
        ))}
      </div>
      {activeSpark && currentUser && (
        <SparkViewer
          groupedSparks={[{
            userId: activeSpark.user?.username || currentUser.username || currentUser.id || 'me',
            user: activeSpark.user || { ...currentUser, avatar: currentUser.avatar || currentUser.avatarUrl },
            isOwn: activeSpark.userId === currentUser.username,
            sparks: [activeSpark],
            maxEnergy: 50
          }]}
          initialUserIndex={0}
          onClose={() => setActiveSpark(null)}
          currentUser={currentUser}
          initialActiveSheet="highlight"
          onDelete={() => setActiveSpark(null)}
        />
      )}
      {activeGroup && currentUser && (
        <SparkViewer
          groupedSparks={[activeGroup]}
          initialUserIndex={0}
          onClose={() => setActiveGroup(null)}
          currentUser={currentUser}
          initialActiveSheet="highlight"
          onDelete={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}
