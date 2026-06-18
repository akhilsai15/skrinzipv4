import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Edit2,
  MessageCircle,
  Bell,
  Search,
  ChevronRight,
  UserPlus,
  Shield,
  User,
  MoreVertical,
  LogOut,
  Trash2,
  Heart,
  Play,
  Share2,
  X,
} from "lucide-react";
import { CHAT_THEMES } from "../constants/themes";

const MOCK_GROUP = {
  name: "Telugu Squad 🔥",
  avatar: "🔥",
  memberCount: 4,
  createdBy: "rajani",
  description: '"Telugu vibes only! 🌟"',
  members: [
    {
      id: "m1",
      name: "rajani (You)",
      role: "Admin",
      isMe: true,
      isOnline: true,
    },
    {
      id: "m2",
      name: "Priya Sharma",
      role: "Admin",
      isMe: false,
      isOnline: true,
    },
    {
      id: "m3",
      name: "Rahul Verma",
      role: "Member",
      isMe: false,
      isOnline: false,
    },
    {
      id: "m4",
      name: "Kiran Reddy",
      role: "Member",
      isMe: false,
      isOnline: false,
    },
  ],
  isAdmin: true, // because 'me' is Admin
};

const MOCK_MEDIA = [
  { id: "1", emoji: "🏏", color: "#228B22" },
  { id: "2", emoji: "🎉", color: "#feb47b" },
  { id: "3", emoji: "🍛", color: "#D2691E" },
];

const MOCK_VIBES = [
  {
    id: "v1",
    sender: "Priya",
    time: "2h ago",
    text: "This dance! 💃🔥",
    handle: "@dancer_ravi",
    score: "24.5K",
    thumbColor: "purple-500",
  },
  {
    id: "v2",
    sender: "Rahul",
    time: "5h ago",
    text: "Cricket six! 🏏💥",
    handle: "@cricket_vibes",
    score: "31.1K",
    thumbColor: "green-500",
  },
];

export default function GroupInfoScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "info" | "members" | "polls" | "vibes" | "announcements"
  >("info");
  const [members, setMembers] = useState(MOCK_GROUP.members);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState<null | {
    type: string;
    member: any;
  }>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteLinkCode, setInviteLinkCode] = useState("skrim.link/t-squad");

  const [showMuteSheet, setShowMuteSheet] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Tab Content Renders
  const renderInfoTab = () => (
    <div className="flex flex-col">
      {/* Media & Files */}
      <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Media & Files
          </span>
          <button className="text-[#00F0FF] text-xs font-medium flex items-center">
            See All <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
        <div className="flex gap-3">
          {MOCK_MEDIA.map((media) => (
            <div
              key={media.id}
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: media.color }}
            >
              {media.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Members Preview */}
      <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Members ({members.length})
          </span>
          <button
            onClick={() => setActiveTab("members")}
            className="text-[#00F0FF] text-xs font-medium flex items-center gap-1"
          >
            <UserPlus size={14} /> Add
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {members.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 relative">
                {m.name.charAt(0)}
                {m.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#141414] rounded-full" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-white text-sm font-medium flex items-center gap-1">
                  {m.name}{" "}
                  {m.role === "Admin" && (
                    <Shield size={12} className="text-yellow-500 ml-1" />
                  )}
                </span>
                <span className="text-white/40 text-[11px]">{m.role}</span>
              </div>
            </div>
          ))}
          {members.length > 3 && (
            <button
              onClick={() => setActiveTab("members")}
              className="text-white/40 text-sm mt-1 hover:text-white transition-colors text-left pl-1"
            >
              View all {members.length} members...
            </button>
          )}
        </div>
      </div>

      {/* Invite Link */}
      {MOCK_GROUP.isAdmin && (
        <div className="bg-[#141414] border-y border-white/5 py-4 px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
              Invite Link
            </span>
          </div>
          <div className="w-full flex items-center justify-between bg-black rounded-lg p-3 border border-white/5">
            <span className="text-[#00F0FF] font-mono text-sm">
              {inviteLinkCode}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Share dialog opened")}
                className="p-1.5 bg-white/5 rounded-md text-white/80 hover:bg-white/10 transition-colors"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => {
                  setInviteLinkCopied(true);
                  setTimeout(() => setInviteLinkCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-white/10 rounded-md text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                {inviteLinkCopied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() =>
                  setInviteLinkCode(
                    `skrim.link/${Math.random().toString(36).substring(2, 8)}`,
                  )
                }
                className="px-3 py-1.5 bg-white/5 rounded-md text-xs font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-[#141414] border-y border-white/5 py-2 mb-8">
        <button className="w-full flex items-center px-4 py-3 text-white hover:bg-white/5 transition-colors">
          <span className="w-6 opacity-60">⚙️</span>
          <span className="text-sm font-medium">Group Settings</span>
        </button>
        <button
          onClick={() => setShowMuteSheet(true)}
          className="w-full flex justify-between items-center px-4 py-3 text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center">
            <span className="w-6 opacity-60">🔔</span>
            <span className="text-sm font-medium">Notifications</span>
          </div>
          {isMuted && (
            <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
              Muted
            </span>
          )}
        </button>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-white/5 transition-colors"
        >
          <span className="w-6 opacity-60">🚪</span>
          <span className="text-sm font-medium">Exit Group</span>
        </button>
        {MOCK_GROUP.isAdmin && (
          <button className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-white/5 transition-colors mt-2">
            <span className="w-6 opacity-60">🗑️</span>
            <span className="text-sm font-medium">Delete Group</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="flex flex-col h-full bg-black mt-[1px]">
      <div className="p-4 flex justify-between items-center border-b border-white/5">
        <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">
          Members ({members.length})
        </h4>
        <button className="text-[#00F0FF] text-xs font-bold px-3 py-1.5 rounded-full bg-[#00F0FF]/10 flex items-center gap-1">
          <UserPlus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto pb-20">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 relative">
                {m.name.charAt(0)}
                {m.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium flex items-center gap-1.5 text-[15px]">
                  {m.name}{" "}
                  {m.role === "Admin" && (
                    <span className="bg-yellow-500/20 text-yellow-500 text-[9px] px-1.5 rounded uppercase font-bold tracking-wider pt-[1px] ml-1">
                      Admin
                    </span>
                  )}
                </span>
                <span
                  className={`text-[12px] ${m.isOnline ? "text-green-400" : "text-white/40"}`}
                >
                  {m.isOnline ? "Online now" : "Offline"}
                </span>
              </div>
            </div>
            {!m.isMe && (
              <button
                onClick={() => {
                  setSelectedMember(m);
                  setShowMemberActions(true);
                }}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPollsTab = () => (
    <div className="flex flex-col p-4 gap-4">
      <div className="bg-[#1A1A24] border border-[#B026FF]/30 p-4 rounded-xl relative">
        <div className="text-[10px] uppercase font-bold text-[#B026FF] mb-2 flex items-center gap-1.5 tracking-wider">
          <span>📊</span> POLL
        </div>
        <div className="text-white font-bold mb-4">
          "Which game should we play tonight?"
        </div>

        <div className="space-y-3 mb-4 text-sm font-medium">
          <div className="w-full">
            <div className="flex justify-between text-white/80 mb-1">
              <span>🎮 Snake</span> <span>2 votes (50%)</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full">
              <div
                className="h-full bg-neon-purple rounded-full"
                style={{ width: "50%" }}
              />
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-white/80 mb-1">
              <span>🎯 Emoji Guess</span> <span>1 vote (25%)</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full">
              <div
                className="h-full bg-neon-purple/60 rounded-full"
                style={{ width: "25%" }}
              />
            </div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-white/80 mb-1">
              <span>🏏 Kabaddi</span> <span>1 vote (25%)</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full">
              <div
                className="h-full bg-neon-purple/60 rounded-full"
                style={{ width: "25%" }}
              />
            </div>
          </div>
        </div>
        <div className="text-[11px] text-white/50 font-mono pt-3 border-t border-white/10 flex justify-between">
          <span>4 total votes</span>
          <span>Ends 24h</span>
        </div>
      </div>
    </div>
  );

  const renderVibesTab = () => (
    <div className="flex flex-col p-4 gap-4">
      <h3 className="text-white font-bold ml-1 mb-2">🔥 Group Vibes</h3>
      {MOCK_VIBES.map((vibe) => (
        <div
          key={vibe.id}
          className="flex flex-col bg-[#1A1A24] border border-white/5 rounded-xl overflow-hidden p-3 gap-3"
        >
          <div className="text-xs text-white/50 flex items-center font-medium px-1">
            Shared by <span className="text-white mx-1">{vibe.sender}</span> ·{" "}
            {vibe.time}
          </div>
          <div className="flex gap-3 bg-black/40 rounded-lg p-2 border border-white/5">
            <div
              className={`w-16 h-20 rounded bg-${vibe.thumbColor} shrink-0`}
            />
            <div className="flex flex-col pt-1">
              <p className="text-white text-sm font-medium">{vibe.text}</p>
              <p className="text-white/40 text-xs mt-1">
                {vibe.handle} · ⚡{vibe.score}
              </p>
              <div className="flex gap-2 mt-auto pb-1">
                <button className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-white/20">
                  <Play size={10} fill="currentColor" /> Watch
                </button>
                <button className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 px-3 py-1.5 rounded flex items-center gap-1">
                  ⚡ Pulse
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="flex flex-col p-4 gap-4">
      <div className="bg-[#1A1A2A] border-t-[3px] border-[#B026FF] rounded-xl overflow-hidden shadow-lg p-4 mb-2">
        <div className="text-[#B026FF] text-[11px] font-black tracking-widest flex items-center gap-1.5 uppercase mb-3">
          <span>📢</span> ANNOUNCEMENT
        </div>
        <div className="text-white font-bold text-[15px] whitespace-pre-wrap leading-relaxed mb-4">
          Guys, remember the tournament starts at 8 PM tonight! Be online
          please.
        </div>
        <div className="w-full h-px bg-white/10 mb-3" />
        <div className="flex flex-col gap-1 text-[11px] text-white/50">
          <div className="font-bold flex items-center gap-1 text-white/80">
            👑 rajani · Admin
          </div>
          <div>Today, 10:45 AM · 4 members</div>
        </div>
      </div>

      <div className="bg-[#1A1A2A] border-t-[3px] border-white/20 rounded-xl overflow-hidden p-4 opacity-80">
        <div className="text-white/50 text-[11px] font-black tracking-widest flex items-center gap-1.5 uppercase mb-3">
          <span>📢</span> ANNOUNCEMENT
        </div>
        <div className="text-white font-bold text-[15px] whitespace-pre-wrap leading-relaxed mb-4">
          Welcome to the Telugu Squad! Let's keep the vibes high.
        </div>
        <div className="w-full h-px bg-white/10 mb-3" />
        <div className="flex flex-col gap-1 text-[11px] text-white/50">
          <div className="font-bold flex items-center gap-1 text-white/80">
            👑 rajani · Admin
          </div>
          <div>Yesterday, 1:00 PM · 4 members</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-black relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[rgba(10,10,18,0.95)] backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white font-bold text-lg">Group Info</h1>
        </div>
        <button className="text-[#00F0FF] text-sm font-bold flex items-center gap-1">
          <Edit2 size={14} /> Edit
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Identity Section */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-[#0A0A0C]">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border border-white/10 flex items-center justify-center text-5xl mb-4 shadow-lg shadow-orange-500/20">
            {MOCK_GROUP.avatar}
          </div>
          <h2 className="text-white text-xl font-bold text-center flex items-center justify-center gap-2 mb-1">
            {MOCK_GROUP.name}
          </h2>
          <div className="text-white/50 text-sm mb-2">
            Group · {MOCK_GROUP.memberCount} members
          </div>
          <div className="text-white/40 text-xs mb-4">
            Created by {MOCK_GROUP.createdBy}
          </div>
          <p className="text-white/90 text-sm px-8 text-center italic">
            {MOCK_GROUP.description}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 py-5 bg-[#0A0A0C] border-t border-white/5">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <MessageCircle size={20} className="text-[#00F0FF]" />
            </div>
            <span className="text-xs text-[#00F0FF] font-medium">Message</span>
          </button>
          <button
            onClick={() => setShowMuteSheet(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-white" />
              {isMuted && (
                <div className="absolute w-5 h-[1.5px] bg-white rotate-45" />
              )}
            </div>
            <span className="text-xs text-white/70 font-medium">Mute</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Search size={20} className="text-white" />
            </div>
            <span className="text-xs text-white/70 font-medium">Search</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-y border-white/5 bg-[#0A0A0C] sticky top-0 z-10">
          {[
            { id: "info", icon: "ℹ️", label: "Info" },
            { id: "members", icon: "👥", label: "Members" },
            { id: "announcements", icon: "📢", label: "News" },
            { id: "polls", icon: "📊", label: "Polls" },
            { id: "vibes", icon: "🔥", label: "Vibes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider relative flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              <span className="text-[14px] leading-none mb-[1px]">
                {tab.icon}
              </span>{" "}
              {tab.label.substring(0, 4)}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 inset-x-0 mx-auto w-1/2 h-0.5 bg-[#00F0FF] rounded-t-full shadow-[0_-2px_10px_rgba(0,240,255,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-black">
          {activeTab === "info" && renderInfoTab()}
          {activeTab === "members" && renderMembersTab()}
          {activeTab === "announcements" && renderAnnouncementsTab()}
          {activeTab === "polls" && renderPollsTab()}
          {activeTab === "vibes" && renderVibesTab()}
        </div>
      </div>

      {/* Admin Action Sheet */}
      <AnimatePresence>
        {showMemberActions && selectedMember && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMemberActions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-50 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl pt-2 pb-8 flex flex-col items-center"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-2">
                  {selectedMember.name.charAt(0)}
                </div>
                <div className="text-white text-lg font-bold">
                  {selectedMember.name}
                </div>
              </div>

              <div className="w-full px-4 space-y-2">
                <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition">
                  <MessageCircle size={18} className="text-blue-400" /> Message{" "}
                  {selectedMember.name.split(" ")[0]}
                </button>
                <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition">
                  <User size={18} className="text-gray-400" /> View Profile
                </button>

                {MOCK_GROUP.isAdmin && (
                  <>
                    <div className="h-px w-full bg-white/5 my-2" />
                    {selectedMember.role !== "Admin" && (
                      <button
                        onClick={() => {
                          setShowMemberActions(false);
                          setShowConfirmAction({
                            type: "promote",
                            member: selectedMember,
                          });
                        }}
                        className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition"
                      >
                        <Shield size={18} className="text-yellow-500" /> Make
                        Admin
                      </button>
                    )}
                    <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-white flex items-center gap-3 hover:bg-white/10 transition">
                      <Bell size={18} className="text-orange-400" /> Mute in
                      Group
                    </button>
                    <button
                      onClick={() => {
                        setShowMemberActions(false);
                        setShowConfirmAction({
                          type: "remove",
                          member: selectedMember,
                        });
                      }}
                      className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-red-500 flex items-center gap-3 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/30"
                    >
                      <LogOut size={18} /> Remove from Group
                    </button>
                  </>
                )}

                {!MOCK_GROUP.isAdmin && (
                  <button className="w-full bg-white/5 rounded-xl px-4 py-3.5 text-red-500 flex items-center gap-3 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/30">
                    <Shield size={18} /> Block
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {showConfirmAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirmAction(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-[#1A1A24] border border-white/10 w-full max-w-[320px] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl"
            >
              {showConfirmAction.type === "promote" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-4">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Make {showConfirmAction.member.name.split(" ")[0]} an admin?
                  </h3>
                  <p className="text-white/60 text-sm mb-6">
                    Admins can manage members and settings.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === showConfirmAction.member.id
                              ? { ...m, role: "Admin" }
                              : m,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
                    >
                      Make Admin
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                    <LogOut size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    Remove {showConfirmAction.member.name.split(" ")[0]} from{" "}
                    {MOCK_GROUP.name}?
                  </h3>
                  <div className="flex w-full gap-3 mt-4">
                    <button
                      onClick={() => setShowConfirmAction(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setMembers((prev) =>
                          prev.filter(
                            (m) => m.id !== showConfirmAction.member.id,
                          ),
                        );
                        setShowConfirmAction(null);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirm Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-[#1A1A24] border border-white/10 w-full max-w-[320px] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Leave {MOCK_GROUP.name}?
              </h3>
              <p className="text-white/60 text-sm mb-6">
                You won't receive messages anymore.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    navigate("/");
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mute Sheet */}
      <AnimatePresence>
        {showMuteSheet && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowMuteSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-50 bg-[#1A1A24] border-t border-white/10 rounded-t-3xl pt-6 pb-8 px-6 flex flex-col rounded-2xl shadow-2xl pb-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">
                  Mute notifications
                </h3>
                <button
                  onClick={() => setShowMuteSheet(false)}
                  className="text-white/50 bg-white/10 rounded-full p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                >
                  8 hours
                </button>
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                >
                  1 week
                </button>
                <button
                  onClick={() => {
                    setIsMuted(true);
                    setShowMuteSheet(false);
                  }}
                  className="w-full text-left py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium text-red-400"
                >
                  Always
                </button>
              </div>
              {isMuted && (
                <button
                  onClick={() => {
                    setIsMuted(false);
                    setShowMuteSheet(false);
                  }}
                  className="w-full bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-bold py-4 rounded-xl transition"
                >
                  Unmute Notifications
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
