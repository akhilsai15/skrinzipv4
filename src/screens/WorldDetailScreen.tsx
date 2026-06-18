import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Bell,
  Share2,
  Users,
  MapPin,
  Calendar,
  Check,
  Volume2,
  X,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useWorlds, useWorldMembership } from "../hooks/useWorldMembership";
import { CommunityFeed } from "../components/CommunityFeed";
import { PaymentModal } from "../components/PaymentModal";
import { MOCK_VOICE_ROOM, useVoiceRoomStore } from "../store/voiceRoomStore";

const PRESET_ATMOSPHERES: Record<string, string[]> = {
  nebula: ["#7B2FF7", "#B026FF"],
  solar: ["#FF6B00", "#FFB800"],
  ocean: ["#0891B2", "#06B6D4"],
  forest: ["#059669", "#10B981"],
  crimson: ["#DC2626", "#F87171"],
  midnight: ["#1E1B4B", "#4338CA"],
  rose: ["#BE185D", "#EC4899"],
  slate: ["#334155", "#64748B"],
};

export default function WorldDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ALL_COMMUNITIES = useWorlds();
  const world = ALL_COMMUNITIES.find((c) => c.id === id) || ALL_COMMUNITIES[0];
  const { joined, join, leave, level, daysActive } = useWorldMembership(
    world.id,
  );
  const colors =
    PRESET_ATMOSPHERES[world.atmosphere] || PRESET_ATMOSPHERES.slate;

  const [activeTab, setActiveTab] = useState("world");
  const [bellActive, setBellActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPortalAnimating, setIsPortalAnimating] = useState(true);

  // Flow states
  const [isJoining, setIsJoining] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isRejoin, setIsRejoin] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDisablePaidConfirm, setShowDisablePaidConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; angle: number; speed: number }[]
  >([]);

  useEffect(() => {
    setTimeout(() => {
      setIsPortalAnimating(false);
    }, 400);

    const handleOpenPayment = () => setShowPaymentModal(true);
    window.addEventListener("open_payment_modal", handleOpenPayment);
    return () =>
      window.removeEventListener("open_payment_modal", handleOpenPayment);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 200) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  const fireParticles = () => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      angle: i * 30 * (Math.PI / 180),
      speed: 50 + Math.random() * 50,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 400);
  };

  const handleJoinClick = () => {
    if (joined || isJoining) return;

    if (world.paid) {
      setShowPaymentModal(true);
      return;
    }

    setIsJoining(true);
    fireParticles();

    // Trigger hero pulse animation
    window.dispatchEvent(new Event("world_hero_pulse"));

    // Sequence
    setTimeout(() => {
      // End of phase 1 & 2 -> trigger phase 3 & 4
      const rejoined = join();
      setIsRejoin(rejoined);
      setIsJoining(false);
      setShowWelcome(true);

      // Auto close welcome after 3s
      setTimeout(() => setShowWelcome(false), 3000);
    }, 1400); // Welcome moment at 1400ms
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    const rejoined = join();
    setIsRejoin(rejoined);
    setShowWelcome(true);
    fireParticles();
    window.dispatchEvent(new Event("world_hero_pulse"));
    setTimeout(() => setShowWelcome(false), 3000);
  };

  const handleLeaveConfirm = () => {
    setShowLeaveConfirm(false);
    setIsLeaving(true);

    // Phase 1: Detach
    window.dispatchEvent(new Event("world_hero_shrink"));

    setTimeout(() => {
      // Phase 3 & 4
      fireParticles(); // Reverse burst visually simulation
      leave();
      setIsLeaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1100);
  };

  if (isPortalAnimating) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0A14] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, borderRadius: "50%" }}
          animate={{ scale: 10, opacity: 1, borderRadius: "0%" }}
          transition={{ duration: 0.4, ease: "circIn" }}
          className="w-40 h-40"
          style={{
            background: `linear-gradient(to bottom, ${colors[0]}, ${colors[0]}40)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full bg-[#0A0A14] overflow-y-auto text-white relative pb-[100px]"
      onScroll={handleScroll}
      ref={scrollRef}
    >
      {/* Top Nav */}
      <div
        className={`fixed top-0 inset-x-0 z-50 pt-safe-top transition-all duration-300 ${scrolled ? "bg-[#0A0A14] border-b border-white/5" : "bg-transparent"}`}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <AnimatePresence>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`,
                  }}
                >
                  {world.initials}
                </div>
                <span className="font-bold">{world.name}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md hover:bg-black/40 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-12 right-0 w-48 bg-[#1A1A24] border border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                >
                  <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
                    Share this World
                  </button>
                  {joined && world.paid && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate(`/world/${world.id}/subscription`);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors font-bold"
                    >
                      My Membership
                    </button>
                  )}
                  <button className="w-full text-left px-4 py-3 text-sm text-red-500 border-b border-white/5 hover:bg-white/5 transition-colors">
                    Report Community
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/world/${world.id}/monetize`);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[#D4AF37] hover:bg-white/5 transition-colors font-bold flex items-center justify-between"
                  >
                    Monetize Setup <span>💎</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/world/${world.id}/earnings`);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[#D4AF37] hover:bg-white/5 transition-colors font-bold flex items-center justify-between"
                  >
                    World Earnings <span>📊</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/world/${world.id}/notifications`);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-b border-white/5 flex items-center justify-between"
                  >
                    Notifications <Bell size={14} className="text-[#888899]" />
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-[#9CA3AF] hover:bg-white/5 transition-colors border-b border-white/5">
                    World Settings
                  </button>
                  {world.paid && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDisablePaidConfirm(true);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/5 transition-colors font-bold"
                    >
                      Disable Paid Access
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <HeroSection world={world} colors={colors} />

      {/* Action Bar (Sticky) */}
      <div className="sticky top-[env(safe-area-inset-top,20px)+56px] z-40 bg-[#0A0A14]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3 mt-4">
        <div className="flex-1 relative">
          <AnimatePresence>
            {particles.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-1 h-1 z-0">
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(p.angle) * p.speed,
                      y: Math.sin(p.angle) * p.speed,
                      opacity: 0,
                      scale: 0.2,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ background: colors[0], filter: "blur(1px)" }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() =>
              joined ? setShowLeaveConfirm(true) : handleJoinClick()
            }
            animate={{ scale: isJoining || isLeaving ? 0.95 : 1 }}
            className={`w-full h-12 rounded-full font-bold text-[15px] flex items-center justify-center transition-all relative z-10 ${
              joined
                ? "bg-transparent border border-[rgba(255,255,255,0.2)] text-white hover:bg-white/5"
                : world.paid
                  ? "text-black shadow-[0_4px_20px_rgba(212,175,55,0.4)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] overflow-hidden"
                  : "text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            }`}
            style={
              !joined && !world.paid
                ? {
                    background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                  }
                : {}
            }
            disabled={isJoining || isLeaving}
          >
            {/* Gold shimmer animation */}
            {!joined && world.paid && (
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
              />
            )}
            <span className="relative z-10 flex items-center justify-center pointer-events-none">
              {isJoining ? (
                <span className="flex items-center gap-2 text-current">
                  Joining<span className="animate-pulse">...</span>
                </span>
              ) : joined ? (
                <>
                  <Check className="w-4 h-4 mr-2" /> In this World
                </>
              ) : world.paid ? (
                <>
                  💎 <span className="mx-2">Join · ₹99/mo</span>
                </>
              ) : (
                "Join World"
              )}
            </span>
          </motion.button>
        </div>

        <button
          onClick={() => setBellActive(!bellActive)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
            bellActive || joined
              ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20"
              : "bg-[#151520] text-white/50 border border-white/5 hover:bg-white/5"
          }`}
        >
          <Bell
            className="w-5 h-5"
            fill={bellActive || joined ? "currentColor" : "none"}
          />
        </button>

        <button className="w-12 h-12 rounded-full bg-[#151520] text-white/70 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all shrink-0">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="sticky top-[env(safe-area-inset-top,20px)+128px] z-40 bg-[#0A0A14]/95 backdrop-blur-md px-4 pt-2 border-b border-white/10 flex gap-6">
        {["world", "members", "about"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${activeTab === tab ? "text-white" : "text-[#888899]"}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="world-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                style={{ background: colors[0] }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "world" && (
            <WorldTab key="world" world={world} colors={colors} joined={joined} />
          )}
          {activeTab === "members" && (
            <MembersTab key="members" world={world} colors={colors} joined={joined} />
          )}
          {activeTab === "about" && (
            <AboutTab key="about" world={world} colors={colors} />
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center cursor-pointer"
            onClick={() => setShowWelcome(false)}
          >
            <div
              className="absolute inset-0 z-0 opacity-90 backdrop-blur-xl"
              style={{
                background: `linear-gradient(to bottom, ${colors[0]}80, #0A0A14 80%)`,
              }}
            />

            <motion.div
              initial={{ y: -50, scale: 0 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.1 }}
              className="relative z-10 text-6xl mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              ✦
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10 text-3xl font-black mb-2 uppercase tracking-widest text-shadow-sm"
            >
              {isRejoin ? "Welcome back to" : "Welcome to"}
            </motion.h2>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative z-10 text-5xl font-black mb-6 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, white, ${colors[1]})`,
              }}
            >
              {world.name}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              {isRejoin ? (
                <p className="text-xl text-white/90 font-medium">
                  The world missed you 🌌
                </p>
              ) : (
                <p className="text-xl text-white/90 font-medium tracking-wide">
                  You are now part of <br />
                  <strong
                    className="text-white text-2xl"
                    dangerouslySetInnerHTML={{
                      __html: world.members.toLocaleString(),
                    }}
                  />{" "}
                  members
                </p>
              )}

              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mt-4 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <span className="text-lg">
                  {isRejoin
                    ? level === "legend"
                      ? "🏆"
                      : level === "pioneer"
                        ? "🌟"
                        : "🗺"
                    : "🗺"}
                </span>
                <span className="font-bold text-sm tracking-wide">
                  {isRejoin
                    ? `${level.charAt(0).toUpperCase() + level.slice(1)} status restored`
                    : "You joined as Explorer"}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="relative z-10 mt-16 text-white/60 font-bold uppercase tracking-widest flex flex-col items-center text-sm"
            >
              [Start Exploring →]
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Confirmation Sheet */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLeaveConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[120] bg-[#111115] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-safe-bottom"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Leave {world.name}?</h3>
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  }}
                >
                  {world.initials}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{world.name}</h4>
                  <p className="text-sm text-[#9CA3AF] font-medium flex items-center gap-1.5 mt-0.5">
                    <span>
                      {level === "legend"
                        ? "🏆 Legend"
                        : level === "pioneer"
                          ? "🌟 Pioneer"
                          : "🗺 Explorer"}
                    </span>
                    <span>·</span>
                    <span>{daysActive}d</span>
                  </p>
                </div>
              </div>

              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8 px-2">
                You've been a {level.charAt(0).toUpperCase() + level.slice(1)}{" "}
                here for {daysActive} days. Leaving will remove you from this
                world. Your posts will remain.
              </p>

              <div className="flex flex-col gap-3 pb-4">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  style={{
                    background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                  }}
                >
                  Stay in this World
                </button>
                <button
                  onClick={handleLeaveConfirm}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[#9CA3AF] text-sm bg-transparent hover:bg-white/5"
                >
                  Leave World
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Disable Paid Access Sheet */}
      <AnimatePresence>
        {showDisablePaidConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDisablePaidConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[120] bg-[#111115] rounded-t-3xl border-t border-white/10 px-6 pt-6 pb-safe-bottom"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-red-500">⚠️</span> Disable Paid Access?
                </h3>
                <button
                  onClick={() => setShowDisablePaidConfirm(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#1A1A24] rounded-2xl border border-white/5 p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/60 font-medium">
                    Current paid members:
                  </span>
                  <span className="text-white font-bold text-lg">24</span>
                </div>
                <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4">
                  Their subscriptions will continue until their billing period
                  ends.
                </p>
                <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4">
                  After that, the world becomes free for everyone.
                </p>
                <p className="text-sm text-red-400 font-bold leading-relaxed">
                  You will stop earning revenue.
                </p>
              </div>

              <div className="flex flex-col gap-3 pb-4">
                <button
                  onClick={() => setShowDisablePaidConfirm(false)}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-black text-sm shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]"
                >
                  Keep Paid Access
                </button>
                <button
                  onClick={() => {
                    // Logic to disable paid config goes here
                    setShowDisablePaidConfirm(false);
                    // navigate(-1);
                  }}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500/20 text-sm bg-red-500/10 transition-colors"
                >
                  Disable Paid Access
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Farewell Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-[env(safe-area-inset-bottom,20px)+40px] inset-x-4 z-[150] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ borderLeft: `4px solid ${colors[0]}` }}
          >
            <span className="font-bold text-white mb-1">
              You've left {world.name} 🌌
            </span>
            <span className="text-[#9CA3AF] text-sm">
              Your {level.charAt(0).toUpperCase() + level.slice(1)} journey was
              epic.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentModal
        world={world}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function HeroSection({
  world,
  colors,
  key,
}: {
  world: any;
  colors: string[];
  key?: React.Key;
}) {
  const [membersCount, setMembersCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [shrink, setShrink] = useState(false);
  const { joined } = useWorldMembership(world.id);

  useEffect(() => {
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / 800, 1);
      const easing = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setMembersCount(Math.floor(easing * world.members));
      if (t < 1) requestAnimationFrame(animateCount);
    };
    requestAnimationFrame(animateCount);
  }, [world.members]);

  useEffect(() => {
    const onPulse = () => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    };
    const onShrink = () => {
      setShrink(true);
      setTimeout(() => setShrink(false), 500);
    };
    window.addEventListener("world_hero_pulse", onPulse);
    window.addEventListener("world_hero_shrink", onShrink);

    return () => {
      window.removeEventListener("world_hero_pulse", onPulse);
      window.removeEventListener("world_hero_shrink", onShrink);
    };
  }, []);

  return (
    <div className="relative h-[40vh] min-h-[320px] w-full mt-[-60px] pt-[60px] flex flex-col justify-end overflow-hidden pb-4">
      {/* Background with Atmosphere Colors */}
      <div
        className="absolute inset-0 z-0 opacity-80"
        style={{
          background: `linear-gradient(to bottom, ${colors[0]}40 0%, ${colors[1]}20 60%, #0A0A14 100%)`,
        }}
      />

      {/* Animated Particles */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: pulse ? 60 : 30 }).map((_, i) => (
          <motion.div
            key={i}
            animate={
              pulse
                ? {
                    y: [0, -100],
                    opacity: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    scale: [1, 2, 0.5],
                  }
                : {
                    y: [-10, -50],
                    opacity: [0, 0.5, 0],
                    x: [0, (Math.random() - 0.5) * 20],
                  }
            }
            transition={
              pulse
                ? { duration: 0.8, ease: "easeOut" }
                : {
                    duration: 3 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                  }
            }
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Rotating Atmosphere Blob */}
      <motion.div
        animate={{
          rotate: 360,
          scale: pulse ? [1, 1.5, 1] : shrink ? [1, 0.95, 1] : 1,
          opacity: pulse
            ? [0.25, 0.5, 0.25]
            : shrink
              ? [0.25, 0.15, 0.25]
              : 0.25,
        }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: "linear" },
          scale: { duration: pulse ? 0.8 : shrink ? 0.8 : 0 },
          opacity: { duration: pulse ? 0.8 : shrink ? 0.8 : 0 },
        }}
        className="absolute top-[10%] -right-[20%] w-[80vw] h-[80vw] rounded-full blur-[80px] pointer-events-none origin-center"
        style={{ background: colors[0] }}
      />

      {/* Overlay gradient to blend into background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-transparent to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 px-4">
        <div className="flex items-end gap-4 mb-3">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg border-2 border-[#0A0A14] relative"
            style={{
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
              boxShadow: `0 8px 30px ${colors[0]}60`,
            }}
          >
            {world.initials}
            {world.active && (
              <div className="absolute top-0 right-0 w-4 h-4 bg-[#00FF64] border-2 border-[#0A0A14] rounded-full animate-pulse z-10" />
            )}
          </div>

          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
              {world.name}
            </h1>
            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${colors[0]}30`,
                  borderColor: `${colors[0]}60`,
                }}
              >
                <span className="text-xs">🎮</span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "#fff" }}
                >
                  {world.category}
                </span>
              </div>

              {world.paid && (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[#D4AF37]/40"
                  style={{
                    background:
                      "linear-gradient(45deg, rgba(212,175,55,0.1), rgba(212,175,55,0.2))",
                  }}
                >
                  <span className="text-xs text-[#D4AF37]">💎</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#D4AF37]">
                    PAID WORLD
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Pills */}
        <div className="flex flex-wrap gap-2 mt-4 relative">
          {/* Members Stat */}
          <div className="bg-[#151520]/80 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/5 shadow-inner">
            <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span
              className="text-[13px] font-bold font-mono tracking-tight"
              style={{ color: colors[0] }}
            >
              {membersCount >= 1000
                ? (membersCount / 1000).toFixed(1) + "k"
                : membersCount}
            </span>
            {pulse && (
              <motion.span
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute text-[#00FF64] font-black text-xs pointer-events-none drop-shadow-md"
                style={{ left: 40, top: -5 }}
              >
                +1
              </motion.span>
            )}
            {shrink && (
              <motion.span
                initial={{ opacity: 0, y: 0, scale: 1 }}
                animate={{ opacity: 1, y: -20, scale: 1.5 }}
                transition={{ duration: 0.6 }}
                className="absolute text-[#EF4444] font-black text-xs pointer-events-none drop-shadow-md"
                style={{ left: 40, top: -5 }}
              >
                -1
              </motion.span>
            )}
          </div>

          {/* Active Stat */}
          <div className="bg-[#151520]/80 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/5 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[#00FF64] animate-pulse">
              ● Live
            </span>
            <span className="text-[13px] font-bold text-white">Active</span>
          </div>

          {/* Location Stat */}
          <div className="bg-[#151520]/80 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/5 shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="text-[13px] font-bold text-white">
              {world.location}
            </span>
          </div>

          {/* Established Stat */}
          <div className="bg-[#151520]/80 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/5 shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="text-[13px] font-bold text-[#9CA3AF] whitespace-nowrap">
              Est. {world.established ? world.established.split(" ")[1] : "Now"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorldTab({
  world,
  colors,
  joined,
}: {
  world: any;
  colors: string[];
  joined?: boolean;
  key?: React.Key;
}) {
  const { setActiveRoom, activeRoom } = useVoiceRoomStore();

  const isLive = world.voiceRoomLive || activeRoom?.isLive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      {/* Creator Earnings Widget */}
      {world.paid && (
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] rounded-2xl p-5 border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl pointer-events-none">
            <span className="text-8xl">💎</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5">
              <span className="text-sm">💎</span> Your Earnings
            </h3>
            <ChevronRight className="w-4 h-4 text-white/40" />
          </div>

          <div className="mb-4">
            <p className="text-sm text-white/50 mb-1">This month:</p>
            <p className="text-3xl font-black text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
              <span className="text-[#D4AF37] mr-1">₹</span>2,376
            </p>
          </div>

          <p className="text-sm font-medium text-white/70 mb-5">
            24 paid members
          </p>

          <button className="w-fit text-sm font-bold text-black px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
            View Dashboard
          </button>
        </div>
      )}

      {/* Voice Room Card */}
      {isLive ? (
        <div className="bg-gradient-to-b from-[#1A1A24] to-[#151520] rounded-2xl p-5 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#EF4444] to-transparent opacity-50" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#EF4444]/10 rounded-full blur-[30px]" />

          <div className="flex items-center gap-2 mb-3">
            {activeRoom?.isLocked ? (
              <>
                <Lock className="w-3 h-3 text-[#EF4444]" />
                <span className="text-[10px] font-black text-[#EF4444] tracking-widest uppercase">
                  Locked
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse shadow-[0_0_8px_#EF4444]" />
                <span className="text-[10px] font-black text-[#EF4444] tracking-widest uppercase">
                  Live Now
                </span>
              </>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-4 relative z-10">
            {activeRoom ? activeRoom.title : world.voiceRoomTitle}
          </h3>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="flex -space-x-2">
              {(activeRoom
                ? (activeRoom.speakers?.slice(0, 3).map((s: any) => s.initial) || [])
                : ["R", "P", "A"]
              ).map((init, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-[#202030] border-2 border-[#151520] flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-10 relative"
                >
                  {init}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#9CA3AF] font-medium grow group-hover:text-white transition-colors">
              +
              {activeRoom
                ? activeRoom.totalListeners
                : world.voiceRoomListeners}{" "}
              inside
            </span>

            {/* Simple Audio Wave */}
            {!activeRoom?.isLocked && (!world.paid || joined) && (
              <div className="flex items-center gap-1 h-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["4px", "16px", "4px"] }}
                    transition={{
                      duration: 0.8 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1 rounded-full opacity-80"
                    style={{ backgroundColor: colors[0] }}
                  />
                ))}
              </div>
            )}
          </div>

          {world.paid && !joined ? (
            <div className="flex flex-col gap-2">
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-2 flex items-center gap-2 mb-1">
                <span className="text-base text-[#D4AF37]">🔒</span>
                <span className="text-[11px] font-bold text-[#D4AF37]">
                  Members only room
                </span>
              </div>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("open_payment_modal"))
                }
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.2)] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] active:scale-[0.98] transition-all relative z-10 text-black text-sm"
              >
                Join to Enter 💎
              </button>
            </div>
          ) : (
            !activeRoom?.isLocked && (
              <button
                onClick={() => setActiveRoom(activeRoom || MOCK_VOICE_ROOM)}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all relative z-10 text-sm"
                style={{
                  background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
                }}
              >
                <Volume2 className="w-4 h-4" />
                Join Voice Room →
              </button>
            )
          )}
        </div>
      ) : (
        <div className="bg-[#151520] rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            🎙 Voice Rooms
          </h3>
          <p className="text-xs text-[#9CA3AF] mb-4">
            No active room right now
          </p>
          <button
            onClick={() => {
              setActiveRoom(MOCK_VOICE_ROOM, "starting");
            }}
            className="text-xs font-bold text-white bg-white/5 py-2 px-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            + Start a Voice Room
          </button>
        </div>
      )}

      {/* Community Feed takes over the rest of the tab */}
      <CommunityFeed world={world} colors={colors} joined={joined} />
    </motion.div>
  );
}

function MembersTab({
  world,
  colors,
  joined,
}: {
  world: any;
  colors: string[];
  joined?: boolean;
  key?: React.Key;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Glowing Star Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height =
      canvas.offsetHeight * window.devicePixelRatio);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    const baseStars = Array.from({ length: 25 }).map(() => ({
      x: width / 2 + (Math.random() - 0.5) * (width * 0.8),
      y: height / 2 + (Math.random() - 0.5) * (height * 0.8),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() > 0.8 ? 3 : 1.5,
      role:
        Math.random() > 0.9
          ? "admin"
          : Math.random() > 0.7
            ? "active"
            : "normal",
      pulseState: Math.random() * Math.PI * 2,
      isMe: false,
      glowMultiplier: 1,
    }));

    let stars = [...baseStars];

    // Add user's star sliding in if joined
    if (joined) {
      stars.push({
        x: width, // start from right edge
        y: height / 2,
        vx: -1, // move left fast initially
        vy: (Math.random() - 0.5) * 0.5,
        size: 4,
        role: "me",
        pulseState: 0,
        isMe: true,
        glowMultiplier: 5, // super bright initially
      });
    }

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Don't draw lines to 'me' if still far away
          if (
            dist < 80 &&
            (!stars[i].isMe || stars[i].vx > -0.3) &&
            (!stars[j].isMe || stars[j].vx > -0.3)
          ) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw stars
      stars.forEach((star) => {
        // me star slowing down
        if (star.isMe) {
          star.vx *= 0.95; // decay velocity
          if (star.vx > -0.2) star.vx = (Math.random() - 0.5) * 0.2; // settle into normal movement
          if (star.glowMultiplier > 1) star.glowMultiplier *= 0.98; // dim to normal
        }

        star.x += star.vx;
        star.y += star.vy;

        // Bounce off bounds
        if (star.x < 10 || star.x > width - 10) star.vx *= -1;
        if (star.y < 10 || star.y > height - 10) star.vy *= -1;

        star.pulseState += 0.02;
        const pulse = Math.sin(star.pulseState) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(
          star.x,
          star.y,
          star.size +
            (star.role === "active" || star.role === "me" ? pulse : 0),
          0,
          Math.PI * 2,
        );

        if (star.role === "admin" || star.role === "me") {
          ctx.fillStyle = colors[0];
          ctx.shadowColor = colors[0];
          ctx.shadowBlur = 10 * star.glowMultiplier;
        } else if (star.role === "active") {
          ctx.fillStyle = "#00FF64";
          ctx.shadowColor = "#00FF64";
          ctx.shadowBlur = 8 * pulse;
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw me halo
        if (star.isMe && star.glowMultiplier > 1.2) {
          ctx.beginPath();
          ctx.arc(
            star.x,
            star.y,
            star.size * star.glowMultiplier * 2,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = `${colors[0]}40`;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [colors, joined]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center"
    >
      <div className="text-center mb-8 relative z-10 mt-4">
        <div className="flex items-center justify-center gap-4">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#888899]"
          >
            ✦
          </motion.span>
          <h2
            className="text-4xl font-black tracking-tight"
            style={{
              background: `linear-gradient(to right, white, ${colors[1]})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: `0 0 30px ${colors[0]}40`,
            }}
          >
            {world.members.toLocaleString()}
          </h2>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="text-[#888899]"
          >
            ✦
          </motion.span>
        </div>
        <p className="text-[13px] text-[#9CA3AF] font-bold uppercase tracking-[0.1em] mt-1">
          Members in this World
        </p>
      </div>

      {/* Constellation Area */}
      <div className="w-full h-[300px] bg-gradient-to-b from-[#111115] to-[#0A0A14] rounded-3xl border border-white/5 relative overflow-hidden shadow-inner mb-6 aspect-square max-h-[400px]">
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />
        <motion.canvas
          ref={canvasRef}
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="w-[150%] h-[150%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
        />
        {/* Central black hole / atmosphere core blur to give depth */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full mix-blend-screen opacity-10 blur-[30px]"
          style={{ background: colors[0] }}
        />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-[#9CA3AF] border border-white/10 uppercase tracking-widest shadow-lg">
            Tap stars to view
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full bg-[#151520] rounded-xl p-4 border border-white/5">
        <h3 className="text-[11px] font-bold text-[#888899] uppercase tracking-widest mb-3 text-center">
          Constellation Legend
        </h3>
        <div className="flex items-center justify-center gap-6 text-[12px] text-white">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: colors[0],
                boxShadow: `0 0 10px ${colors[0]}`,
              }}
            />
            <span>Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF64] animate-pulse shadow-[0_0_8px_#00FF64]" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="text-white/60">Member</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AboutTab({
  world,
  colors,
}: {
  world: any;
  colors: string[];
  key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      {/* Description */}
      <div>
        <h3 className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">
          About this World
        </h3>
        <p className="text-[15px] leading-relaxed text-white/90 bg-[#151520] p-4 rounded-2xl border border-white/5">
          {world.description}
        </p>
      </div>

      {/* Rules */}
      <div>
        <div className="bg-[#111115] rounded-2xl border border-white/5 overflow-hidden shadow-sm">
          <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
              World Rules
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {world.rules?.map((rule: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[13px] font-bold text-[#888899] mt-[1px]">
                  {i + 1}.
                </span>
                <p className="text-[14px] text-white/90">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Created By */}
      <div>
        <div className="bg-[#151520] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-2">
              Created By
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A24] border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                SG
              </div>
              <div>
                <span className="text-[14px] font-bold text-white flex items-center gap-1.5">
                  {world.createdBy}{" "}
                  <Check
                    className="w-3.5 h-3.5 text-blue-400"
                    strokeWidth={3}
                  />
                </span>
                <span className="text-[11px] text-[#888899]">
                  Verified Creator
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Worlds Preview */}
      <div>
        <h3 className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] mb-4">
          You might also like
        </h3>
        <div className="flex gap-4 overflow-x-auto snap-x hide-scrollbar -mx-4 px-4 pb-4">
          {/* Mock minimal cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[200px] h-[100px] shrink-0 bg-[#151520] rounded-xl border border-white/5 snap-start p-3 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
              <h4 className="text-[14px] font-bold text-white mb-1">
                FPS Masters
              </h4>
              <p className="text-[11px] text-[#888899] mb-3">
                Shootout community
              </p>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-sm">
                👥 5.2k
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
