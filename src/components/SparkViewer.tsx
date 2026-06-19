import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  MessageCircle,
  Share2,
  Bookmark,
  Target,
  X,
  Send,
  Copy,
  ExternalLink,
  MessageSquare,
  Twitter,
  Facebook,
  Camera,
  Video,
  Sparkles,
  Search,
  Check,
  CheckCircle,
  Repeat,
  Trash2,
  Edit2,
  AlertTriangle,
  Ban,
  BarChart2,
  Plus,
} from "lucide-react";
import { SKRIM_REACTIONS, mockUsers } from "../lib/mock/mockData";

import { SparkEnergyMeter } from "./SparkEnergyMeter";
import { HighlightAvatar } from "./HighlightAvatar";

interface SparkViewerProps {
  groupedSparks: any[];
  initialUserIndex: number;
  onClose: () => void;
  currentUser: any;
  onSparkViewed?: (sparkId: string) => void;
  isHighlightMode?: boolean;
  highlightName?: string;
  onDelete?: (sparkId: string) => void;
  initialActiveSheet?:
    | "reply"
    | "challenge"
    | "share"
    | "connect"
    | "highlight"
    | "create-highlight"
    | null;
}

export function SparkViewer({
  groupedSparks,
  initialUserIndex,
  onClose,
  currentUser,
  onSparkViewed,
  isHighlightMode,
  highlightName,
  onDelete,
  initialActiveSheet,
}: SparkViewerProps) {
  const navigate = useNavigate();

  const renderTextWithTags = (t: string) => {
    if (!t) return null;
    const parts = t.split(/(@[\w_]+|#[\w_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span 
            key={i} 
            style={{ color: '#B026FF', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={(e) => { 
                e.stopPropagation(); 
                onClose(); 
                navigate(`/profile/${username}`); 
            }}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span 
            key={i} 
            style={{ color: '#3B82F6', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={(e) => { 
                e.stopPropagation(); 
                onClose(); 
                navigate(`/discover?tag=${tag}`); 
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getInitialSparkIndex = (uIndex: number) => {
    const group = groupedSparks[uIndex];
    if (!group) return 0;
    const firstUnviewed = group.sparks.findIndex((s: any) => !s.hasViewed);
    return firstUnviewed === -1 ? 0 : firstUnviewed;
  };

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [sparkIndex, setSparkIndex] = useState(() =>
    getInitialSparkIndex(initialUserIndex),
  );
  const [direction, setDirection] = useState(1);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [activeSheet, setActiveSheet] = useState<string | null>(
    initialActiveSheet || null,
  );
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [radialMenuCenter, setRadialMenuCenter] = useState({ x: 0, y: 0 });
  const radialHoldTimer = useRef<any>(null);
  const [showRadialHint, setShowRadialHint] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isBounceSave, setIsBounceSave] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; x: number }[]
  >([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [newHighlightName, setNewHighlightName] = useState("");
  const [newHighlightEmoji, setNewHighlightEmoji] = useState("✨");
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (activeSheet === "highlight") {
      try {
        const raw = localStorage.getItem("skrimchat_highlights");
        console.log("highlights in storage:", raw);
        const parsed = raw ? JSON.parse(raw) : [];
        setHighlights(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setHighlights([]);
      }
    }
  }, [activeSheet]);

  const group = groupedSparks[userIndex];
  const spark = group?.sparks[sparkIndex];

  const isOwnSpark = group && (group.userId === currentUser?.id || group.isOwn);

  useEffect(() => {
    if (!spark?.expiresAt) {
      setTimeRemaining(0);
      return;
    }
    
    setTimeRemaining(spark.expiresAt - Date.now());
    
    const interval = setInterval(() => {
      setTimeRemaining(spark.expiresAt - Date.now());
    }, 60000); // update every 60 seconds
    
    return () => clearInterval(interval);
  }, [spark?.expiresAt]);

  useEffect(() => {
    if (isOwnSpark) {
      try {
        const hintSeen = localStorage.getItem("skrimchat_radial_hint_seen");
        if (!hintSeen) {
          setShowRadialHint(true);
          const t = setTimeout(() => {
            setShowRadialHint(false);
            localStorage.setItem("skrimchat_radial_hint_seen", "true");
          }, 3000);
          return () => clearTimeout(t);
        }
      } catch (e) {}
    } else {
      setShowRadialHint(false);
    }
  }, [isOwnSpark, sparkIndex, userIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && radialMenuOpen) {
        setRadialMenuOpen(false);
        setIsPaused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [radialMenuOpen]);

  const DURATION = spark?.type === "video" ? 15000 : 5000;
  const progressInterval = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || showInsights || activeSheet || radialMenuOpen) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, showInsights, activeSheet, radialMenuOpen, sparkIndex, userIndex]);

  useEffect(() => {
    setProgress(0);
    setFloatingEmojis([]);
    setShowInsights(false);
    setActiveSheet(null);
    setReplyText("");
    if (spark) {
      let savedList = JSON.parse(
        localStorage.getItem("skrimchat_saved_sparks") || "[]",
      );
      if (!Array.isArray(savedList)) savedList = [];
      setIsSaved(savedList.includes(spark.id));
      if (onSparkViewed) onSparkViewed(spark.id);
      // Increment view count in localStorage
      try {
        const key = 'skrimchat_spark_views';
        const views: Record<string, number> = JSON.parse(localStorage.getItem(key) || '{}');
        views[spark.id] = (views[spark.id] || spark.views || 0) + 1;
        localStorage.setItem(key, JSON.stringify(views));
        // mutate so the displayed number updates this session
        spark.views = views[spark.id];
      } catch (e) {}
    }
  }, [userIndex, sparkIndex, spark?.id, onSparkViewed]);

  useEffect(() => {
    if (isPaused || showInsights || activeSheet || radialMenuOpen || !spark) return;

    progressInterval.current = setInterval(() => {
      setProgress((p) => {
        const nextP = p + 100 / (DURATION / 50);
        if (nextP >= 100) {
          clearInterval(progressInterval.current);
          return 100;
        }
        return nextP;
      });
    }, 50);

    return () => clearInterval(progressInterval.current);
  }, [
    userIndex,
    sparkIndex,
    isPaused,
    showInsights,
    activeSheet,
    radialMenuOpen,
    DURATION,
  ]);

  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress]);

  const handleNextUser = () => {
    setProgress(0);
    setDirection(1);
    if (userIndex < groupedSparks.length - 1) {
      const nextU = userIndex + 1;
      setUserIndex(nextU);
      setSparkIndex(getInitialSparkIndex(nextU));
    } else {
      onClose();
    }
  };

  const handlePrevUser = () => {
    setProgress(0);
    setDirection(-1);
    if (userIndex > 0) {
      const prevU = userIndex - 1;
      setUserIndex(prevU);
      setSparkIndex(groupedSparks[prevU].sparks.length - 1);
    }
  };

  const handleNext = () => {
    setProgress(0);
    const g = groupedSparks[userIndex];
    if (sparkIndex < g.sparks.length - 1) {
      setSparkIndex((s) => s + 1);
    } else {
      handleNextUser();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (sparkIndex > 0) {
      setSparkIndex((s) => s - 1);
    } else {
      if (userIndex > 0) {
        setDirection(-1);
        const prevU = userIndex - 1;
        setUserIndex(prevU);
        setSparkIndex(groupedSparks[prevU].sparks.length - 1);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userIndex, sparkIndex, groupedSparks.length]);

  const pointerStartX = useRef(0);
  const pointerDownTime = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (radialMenuOpen) return;
    setIsPaused(true);
    pointerStartX.current = e.clientX;
    pointerDownTime.current = Date.now();

    if (isHighlightMode) {
      radialHoldTimer.current = setTimeout(() => {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
        setActiveSheet("highlight-options");
      }, 400);
    } else if (isOwnSpark) {
      const rect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      radialHoldTimer.current = setTimeout(() => {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }

        setRadialMenuCenter({ x: startX, y: startY });
        setRadialMenuOpen(true);
        try {
          localStorage.setItem("skrimchat_radial_hint_seen", "true");
        } catch (err) {}
        setShowRadialHint(false);
      }, 400);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (radialHoldTimer.current) {
      clearTimeout(radialHoldTimer.current);
      radialHoldTimer.current = null;
    }

    if (radialMenuOpen || activeSheet || showInsights) return;

    setIsPaused(false);
    const diff = pointerStartX.current - e.clientX;
    const timeDiff = Date.now() - pointerDownTime.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextUser();
      else handlePrevUser();
    } else if (timeDiff < 200) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      if (ratio < 0.3) handlePrev();
      else if (ratio > 0.7) handleNext();
      else setShowUI((prev) => !prev);
    }
  };

  const handlePointerLeave = () => {
    if (radialHoldTimer.current) {
      clearTimeout(radialHoldTimer.current);
      radialHoldTimer.current = null;
    }
    // Only unpause if we didn't open the radial menu or any other overlay
    if (!radialMenuOpen && !activeSheet && !showInsights) {
      setIsPaused(false);
    }
  };

  const handleReaction = (emoji: string) => {
    const id = Date.now().toString() + Math.random();
    const x = Math.random() * 60 + 20;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);

    // Persist reaction count
    try {
      const key = `skrimchat_spark_reactions_${spark.id}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      stored[emoji] = (stored[emoji] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(stored));
      if (spark.reactions) spark.reactions[emoji] = (spark.reactions[emoji] || 0) + 1;
    } catch (e) {}

    if (spark.isCollab && spark.status === 'accepted') {
      const theirName = (spark.creator?.username === currentUser?.username ? spark.collabPartner?.username : spark.creator?.username)?.replace('@', '') || "partner";
      showToast(`⚡ Energy boosted on collab with @${theirName}!`);
    } else {
      showToast(`${emoji} reaction sent!`);
    }

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleOpenHighlightPicker = () => {
    let storedH = localStorage.getItem("skrimchat_highlights");
    let hlList = storedH ? JSON.parse(storedH) : [];
    if (!Array.isArray(hlList)) hlList = [];
    setHighlights(hlList);
    setIsPaused(true);
    setActiveSheet("highlight");
  };

  const handleSave = () => {
    let savedList = JSON.parse(
      localStorage.getItem("skrimchat_saved_sparks") || "[]",
    );
    if (!Array.isArray(savedList)) savedList = [];
    let newList;
    if (isSaved) {
      newList = savedList.filter((id: string) => id !== spark.id);
      showToast("Removed from saved");
      setIsSaved(false);
      localStorage.setItem("skrimchat_saved_sparks", JSON.stringify(newList));
    } else {
      newList = [...savedList, spark.id];
      setIsSaved(true);
      setIsBounceSave(true);
      localStorage.setItem("skrimchat_saved_sparks", JSON.stringify(newList));
      setTimeout(() => setIsBounceSave(false), 500);

      if (isOwnSpark) {
        handleOpenHighlightPicker();
      } else {
        showToast("✅ Spark saved to your collection!");
      }
    }
  };

  const handleAddToHighlight = (hlId: string) => {
    const hlIndex = highlights.findIndex((h) => h.id === hlId);
    if (hlIndex >= 0) {
      const updatedHl = { ...highlights[hlIndex] };
      if (!updatedHl.sparks) updatedHl.sparks = [];
      
      const alreadyExists = updatedHl.sparks.some((s: any) => s.originalSparkId === spark.id || s === spark.id);
      if (!alreadyExists) {
        const highlightCopy = {
            ...spark,
            highlightId: `highlight_${Date.now()}`,
            savedAt: Date.now(),
            isHighlight: true,
            originalSparkId: spark.id,
            expiresAt: null,
        };
        updatedHl.sparks = [...updatedHl.sparks, highlightCopy];
        updatedHl.cover =
          spark.type === "text"
            ? spark.backgroundTheme || spark.background
            : spark.image ||
              spark.videoImageHover ||
              spark.videoImage ||
              updatedHl.cover;
      }

      const newList = [...highlights];
      newList[hlIndex] = updatedHl;
      localStorage.setItem("skrimchat_highlights", JSON.stringify(newList));
      setHighlights(newList);
      window.dispatchEvent(new Event("highlightSaved"));

      showToast("✅ Added to Highlight!");
      setActiveSheet(null);
    }
  };

  const handleCreateHighlight = () => {
    if (!newHighlightName.trim()) return;
    const highlightCopy = {
        ...spark,
        highlightId: `highlight_${Date.now()}`,
        savedAt: Date.now(),
        isHighlight: true,
        originalSparkId: spark.id,
        expiresAt: null,
    };
    const newHl = {
      id: "h_" + Date.now(),
      title: newHighlightName,
      emoji: newHighlightEmoji,
      cover:
        spark.type === "text"
          ? spark.backgroundTheme || spark.background
          : spark.image ||
            spark.videoImageHover ||
            spark.videoImage ||
            "purple",
      sparks: [highlightCopy],
    };
    const newList = [...highlights, newHl];
    localStorage.setItem("skrimchat_highlights", JSON.stringify(newList));
    setHighlights(newList);
    window.dispatchEvent(new Event("highlightSaved"));
    showToast("✅ New Highlight created!");
    setNewHighlightName("");
    setNewHighlightEmoji("✨");
    setActiveSheet(null);
  };

  const handleReplySend = () => {
    if (!replyText.trim()) return;
    // Persist reply as a real Connect DM
    try {
      const username = (group.user.username || group.user.handle || '').replace('@', '');
      const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
      const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
      if (!customChats[username]) customChats[username] = [];
      customChats[username].push({
        id: Date.now().toString() + Math.random(),
        type: 'text',
        text: `💬 (Spark reply) ${replyText}`,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        timestamp: Date.now(),
      });
      localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
    } catch (e) {}
    showToast(`Reply sent to @${group.user.username || group.user.handle?.replace("@", "")}! ⚡`);
    setActiveSheet(null);
    setReplyText("");
  };

  const handleChallengeAccept = () => {
    // Persist accepted challenge so SparkCreator can link response
    try {
      const pending = JSON.parse(localStorage.getItem('skrimchat_pending_challenge') || 'null');
      const challengeData = {
        sparkId: spark.id,
        challengeText: spark.challengeText || '',
        challengerHandle: group.user.handle || group.user.username || '',
        acceptedAt: Date.now(),
      };
      localStorage.setItem('skrimchat_pending_challenge', JSON.stringify(challengeData));
    } catch (e) {}
    showToast("Challenge accepted! Create your response ⚡");
    setActiveSheet(null);
    // Navigate to Identity to create a response spark
    setTimeout(() => { try { (window as any).__skrimNavigate?.('/identity?challenge=1'); } catch(e){} }, 400);
  };

  const handleShareOption = (platform: string) => {
    const sparkUrl = `https://skrim.chat/spark/${spark.id}`;
    const sparkText = encodeURIComponent(`⚡ Check out this Spark on Skrim! ${sparkUrl}`);

    if (platform === "Connect") {
      setActiveSheet("connect");
      setContactSearch("");
      setSelectedContacts([]);
      return;
    }

    if (platform === "your story") {
      // Repost spark to own sparks list
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
        const alreadyReposted = stored.some(s => s.id === `repost_${spark.id}`);
        if (!alreadyReposted) {
          const repost = {
            ...spark,
            id: `repost_${spark.id}`,
            user: currentUser,
            isRepost: true,
            repostedFrom: group.user.handle || group.user.username,
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            isOwn: true,
            hasViewed: false,
            views: 0,
            reactions: { pulse: 0, blaze: 0, vibe: 0 },
          };
          stored.unshift(repost);
          localStorage.setItem('skrimchat_sparks', JSON.stringify(stored));
          showToast("✅ Added to your Spark! It's live on your profile.");
        } else {
          showToast('Already reposted to your Spark!');
        }
      } catch (e) {
        showToast('✅ Added to your Spark!');
      }
      setActiveSheet(null);
      return;
    }

    if (platform === "Arattai") {
      // Share in Arattai feed (internal share)
      try {
        const arattaiPosts: any[] = JSON.parse(localStorage.getItem('skrimchat_arattai_shares') || '[]');
        arattaiPosts.unshift({
          id: `arattai_${Date.now()}`,
          sparkId: spark.id,
          sparkUrl,
          sharedBy: currentUser?.username || 'me',
          sharedAt: Date.now(),
          caption: `Sharing this Spark ⚡`,
        });
        localStorage.setItem('skrimchat_arattai_shares', JSON.stringify(arattaiPosts.slice(0, 50)));
      } catch (e) {}
      // Also copy the link
      navigator.clipboard?.writeText(sparkUrl).catch(() => {});
      showToast('⚡ Shared in Arattai + link copied!');
      setActiveSheet(null);
      return;
    }

    const shareCaption = `⚡ Check out this Spark on Skrim! ${sparkUrl}`;

    // Platforms with real web share-intent URLs (pre-fills content directly)
    const intentUrls: Record<string, string> = {
      WhatsApp:   `https://api.whatsapp.com/send?text=${sparkText}`,
      Telegram:   `https://t.me/share/url?url=${encodeURIComponent(sparkUrl)}&text=${encodeURIComponent('⚡ Check out this Spark on Skrim!')}`,
      Twitter:    `https://twitter.com/intent/tweet?text=${sparkText}`,
      Facebook:   `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sparkUrl)}`,
      Reddit:     `https://www.reddit.com/submit?url=${encodeURIComponent(sparkUrl)}&title=${encodeURIComponent('Check out this Spark on Skrim ⚡')}`,
      LinkedIn:   `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sparkUrl)}`,
    };

    // Platforms with NO public web "create post" intent — their apps require native camera/share-sheet.
    // Best real-world UX: copy the caption, open the app, user pastes into their own post/story.
    const appOnlyPlatforms: Record<string, string> = {
      Instagram: 'https://www.instagram.com/',
      Snapchat:  'https://www.snapchat.com/',
      Discord:   'https://discord.com/channels/@me',
    };

    if (intentUrls[platform]) {
      window.open(intentUrls[platform], '_blank');
      setActiveSheet(null);
      return;
    }

    if (appOnlyPlatforms[platform]) {
      navigator.clipboard?.writeText(shareCaption).catch(() => {});
      showToast(`📋 Caption copied! Opening ${platform} — paste it into your post.`);
      setTimeout(() => window.open(appOnlyPlatforms[platform], '_blank'), 600);
      setActiveSheet(null);
      return;
    }

    navigator.clipboard?.writeText(sparkUrl).catch(() => {});
    showToast(`Link copied for ${platform}!`);
    setActiveSheet(null);
  };

  const handleConnectSend = () => {
    if (selectedContacts.length === 0) return;

    // Add to mock chat as a rich Spark share card
    const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
    const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};

    selectedContacts.forEach(id => {
      const user = mockUsers.find(u => u.id === id);
      if (user && user.username) {
        const username = user.username.replace('@', '');
        if (!customChats[username]) customChats[username] = [];

        customChats[username].push({
          id: Date.now().toString() + Math.random(),
          type: 'spark_share',
          sparkId: spark.id,
          sparkThumbnail: spark.image || spark.thumbnail || group.user?.avatar,
          sparkCaption: spark.caption || spark.text || '',
          sparkUser: {
            user: group.user?.displayName || group.user?.user || group.user?.username || 'Unknown',
            handle: group.user?.handle || group.user?.username || '',
            avatar: group.user?.avatar || group.user?.avatarUrl || '',
          },
          sparkMood: spark.mood,
          isRepost: false,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          timestamp: Date.now()
        });
      }
    });

    localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));

    const names = selectedContacts
      .map((id) => mockUsers.find((u) => u.id === id)?.displayName)
      .filter(Boolean);
    const recipients = selectedContacts
      .map((id) => mockUsers.find((u) => u.id === id))
      .filter(Boolean);

    const msg =
      names.length === 1
        ? `✅ Spark sent to ${names[0]}!`
        : `✅ Spark sent to ${names[0]} & ${names.length - 1} other${names.length > 2 ? "s" : ""}!`;
    showToast(msg);
    setActiveSheet(null);

    // Navigate directly to the chat thread of the first recipient
    if (recipients.length === 1) {
      const username = (recipients[0] as any).username?.replace('@', '') || (recipients[0] as any).id;
      setTimeout(() => navigate(`/chat/${username}`), 400);
    } else if (recipients.length > 1) {
      // Multiple — go to connect list
      setTimeout(() => navigate('/connect'), 400);
    }
  };

  const handleCopyLink = () => {
    const sparkUrl = `https://skrim.chat/spark/${spark.id}`;
    navigator.clipboard?.writeText(sparkUrl).catch(() => {});
    showToast('🔗 Link copied: skrim.chat/spark/' + spark.id);
    setActiveSheet(null);
  };

  const getSparkTimeAgo = (s: any) => {
    if (s.isHighlight && s.savedAt) {
      const ms = Date.now() - s.savedAt;
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      if (days === 0) return "Saved today";
      if (days === 1) return "Saved 1 day ago";
      return `Saved ${days} days ago`;
    }
    if (s.expiresAt) {
      const createdAt = s.expiresAt - 24 * 60 * 60 * 1000;
      const diffStr = Date.now() - createdAt;
      if (diffStr < 60000) return "Just now";
      if (diffStr < 3600000) return Math.floor(diffStr / 60000) + "m";
      return Math.floor(diffStr / 3600000) + "h";
    }
    return s.timeAgo || "1h";
  };

  if (!spark) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl overflow-hidden">
        {/* Global Blurred Background (Desktop) */}
        <div
          className="hidden sm:block absolute inset-0 z-0 opacity-40 blur-[100px] scale-110 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: spark.backgroundTheme
              ? spark.backgroundTheme
              : spark.image
                ? `url(${spark.image})`
                : spark.background === "fire"
                  ? "linear-gradient(to right, #f12711, #f5af19)"
                  : "linear-gradient(to right, #bc4e9c, #f80759)",
          }}
        />

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Desktop Navigation Hints */}
        <div
          className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md cursor-pointer"
          onClick={handlePrev}
        >
          <ArrowLeft className="w-8 h-8 text-white" />
        </div>
        <div
          className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center transition-colors z-[210] border border-white/10 backdrop-blur-md cursor-pointer"
          onClick={handleNext}
        >
          <ArrowLeft className="w-8 h-8 text-white rotate-180" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={group.userId}
            initial={{ x: direction === 1 ? "100%" : "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? "-100%" : "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || (offset.y > 50 && velocity.y > 500)) {
                onClose();
              }
            }}
            className="relative w-full h-full sm:w-[400px] sm:h-[90vh] sm:max-h-[850px] sm:rounded-[32px] bg-black sm:overflow-hidden flex flex-col shadow-2xl sm:border sm:border-white/20 z-10"
          >
            {!spark ? (
              <div className="flex-1 flex flex-col pt-safe-top pb-safe-bottom relative bg-[#121212] items-center justify-center p-8 text-center h-full">
                <button
                  onClick={onClose}
                  className="absolute top-6 left-6 p-2 rounded-full bg-white/10 text-white z-[100]"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center justify-center">
                  <HighlightAvatar emoji={group.emoji || "✨"} theme={group.user?.avatar?.includes('gradient') || group.user?.avatar?.startsWith('#') ? group.user.avatar : "linear-gradient(135deg, #8B5CF6, #3B82F6)"} size={80} />
                  <h3 className="text-white font-bold text-xl mb-2 mt-6">
                    No sparks yet
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Save a spark to add it to this highlight
                  </p>
                </div>
              </div>
            ) : (spark.expiresAt && spark.expiresAt <= Date.now() && !isHighlightMode) ? (
              <div className="flex-1 flex items-center justify-center bg-black/90 p-8 text-center flex-col z-[100] h-full relative">
                <button
                  onClick={onClose}
                  className="absolute top-6 left-6 p-2 rounded-full bg-white/10 text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <span className="text-3xl">⏰</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">
                  This Spark has expired
                </h3>
                <p className="text-gray-400 text-sm mb-8">
                  Sparks last only 24 hours
                </p>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 border border-white/10"
                >
                  View their Profile {">"}
                </button>
              </div>
            ) : (
              <>
                {/* Blurred Background (for text sparks or padding) */}
                <div
                  className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: spark.backgroundTheme
                      ? spark.backgroundTheme
                      : spark.image
                        ? `url(${spark.image})`
                        : spark.background === "fire"
                          ? "linear-gradient(to right, #f12711, #f5af19)"
                          : "linear-gradient(to right, #bc4e9c, #f80759)",
                  }}
                />

                {/* Spark Media - Absolutely positioned to fill entire container */}
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={spark.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {spark.type === "text" ? (
                        <div
                          className="w-full h-full flex items-center justify-center p-8 text-center transition-all duration-500"
                          style={{
                            background:
                              spark.backgroundTheme ||
                              (spark.background === "fire"
                                ? "linear-gradient(to bottom, #FF416C, #FF4B2B)"
                                : spark.background === "purple"
                                  ? "linear-gradient(to bottom right, #B026FF, #00F0FF)"
                                  : "#121212"),
                          }}
                        >
                          <h1 className="text-3xl font-bold text-white whitespace-pre-wrap leading-relaxed drop-shadow-lg">
                            {renderTextWithTags(spark.text)}
                          </h1>
                        </div>
                      ) : spark.type === "video" ? (
                        <>
                          <video
                            ref={videoRef}
                            src={spark.video || "https://www.w3schools.com/html/mov_bbb.mp4"}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted={isMuted}
                            controls={false}
                            loop
                            playsInline
                            onError={() => console.log('Spark video play error')}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMuted(!isMuted);
                              if (videoRef.current) {
                                videoRef.current.muted = !isMuted;
                              }
                            }}
                            style={{
                              position: "absolute",
                              top: 64, // Pushed down slightly to clear progress bar
                              left: 16,
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              borderRadius: "50%",
                              width: 36,
                              height: 36,
                              color: "white",
                              fontSize: 16,
                              zIndex: 10,
                              cursor: "pointer"
                            }}
                          >
                            {isMuted ? "🔇" : "🔊"}
                          </button>
                        </>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={spark.image}
                            alt="spark"
                            className="w-full h-full object-cover"
                          />
                          {spark.textOverlay && (
                            <div 
                              className={`absolute bg-transparent text-center font-bold text-2xl outline-none drop-shadow-lg ${spark.textOverlay.color === 'white' ? 'text-white' : spark.textOverlay.color === 'black' ? 'text-black' : 'text-[#B026FF]'}`}
                              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            >
                              {spark.textOverlay.text}
                            </div>
                          )}
                          {spark.taggedUsersPositions?.map((u: any, i: number) => (
                            <div 
                              key={i}
                              className="absolute bg-white/20 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded-full text-xs font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform drop-shadow"
                              style={{ left: u.position.x + '%', top: u.position.y + '%' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${u.username.replace('@', '')}`); }}
                            >
                              👤 {u.username}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Top/Bottom Gradient Overlays for readability */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

                {/* UI Layer */}
                <div className="relative z-20 flex-1 flex flex-col w-full h-full pt-safe-top">
                  {/* Progress Bars */}
                  <div
                    className="flex gap-1 px-3 pt-3 transition-opacity duration-300"
                    style={{ opacity: showUI ? 1 : 0 }}
                  >
                    {group.sparks.map((s: any, i: number) => (
                      <div
                        key={s.highlightId || s.id || i}
                        className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden shrink-0"
                      >
                        <div
                          className="h-full bg-white transition-all duration-75 ease-linear"
                          style={{
                            width:
                              i === sparkIndex
                                ? `${progress}%`
                                : i < sparkIndex
                                  ? "100%"
                                  : "0%",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Top Bar */}
                  <div
                    className="flex items-center justify-between p-4 transition-opacity duration-300"
                    style={{ opacity: showUI ? 1 : 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors sm:hidden"
                      >
                        <ArrowLeft className="w-6 h-6 text-white" />
                      </button>
                      {isHighlightMode ? (
                        <HighlightAvatar 
                          size={52} 
                          emoji={group.emoji || "✨"} 
                          theme={group.sparks?.[0]?.backgroundTheme || group.sparks?.[0]?.background} 
                        />
                      ) : spark.isCollab ? (
                        <div className="relative w-[52px] h-[36px] flex items-center shrink-0">
                          <img src={spark.creator?.avatar || group.user?.avatar} alt="Creator" className="absolute left-0 w-[36px] h-[36px] rounded-full object-cover border-2 border-[#121212] z-10" />
                          <img src={spark.collabPartner?.avatar} alt="Partner" className="absolute left-[16px] w-[36px] h-[36px] rounded-full object-cover border-2 border-[#121212] z-20" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#121212] shrink-0 shadow-lg bg-[#B026FF] flex items-center justify-center text-white font-bold text-sm">
                          <img
                            src={group.user?.avatar || group.user?.avatarUrl}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {(!group.user?.avatar && !group.user?.avatarUrl) && (group.user?.displayName?.charAt(0)?.toUpperCase() || "U")}
                        </div>
                      )}
                      <div className="flex flex-col drop-shadow-md">
                        {isHighlightMode ? (
                          <>
                            <motion.span
                              key={group.userId}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-semibold text-[15px] leading-tight text-white mb-0.5"
                            >
                              ✨ {highlightName || group.user.displayName || "Highlight"}
                            </motion.span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              Saved today
                            </span>
                          </>
                        ) : spark.isCollab ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <motion.span
                                key={group.userId}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-[15px] leading-tight text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                              >
                                {(spark.creator?.displayName || spark.creator?.username || group.user?.displayName || group.user?.username)?.split(' ')[0]} 
                                &amp; 
                                {(spark.collabPartner?.displayName || spark.collabPartner?.username)?.split(' ')[0]}
                              </motion.span>
                              <div className="bg-white/20 rounded px-1 py-0.5 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white tracking-wider">COLLAB</span>
                              </div>
                            </div>
                            <span className="text-[12px] font-medium text-gray-300 leading-tight">
                              @{((spark.creator?.username || group.user?.username) || '').replace('@', '')} &amp; @{(spark.collabPartner?.username || '').replace('@', '')}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              {getSparkTimeAgo(spark)}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <motion.span
                                key={group.userId}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-[15px] leading-tight text-white mb-0.5"
                              >
                                {group.user.displayName ||
                                  group.user.user ||
                                  group.user.username}
                              </motion.span>
                            </div>
                            <span className="text-[12px] font-medium text-gray-300 leading-tight">
                              @
                              {group.user.username ||
                                group.user.handle?.replace("@", "")}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                              {getSparkTimeAgo(spark)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(!isHighlightMode && !group.isExpired) && (
                        <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#B026FF]">
                            ⚡ {spark.energy}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setActiveSheet(isHighlightMode ? "highlight-options" : "options")}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors drop-shadow-md"
                      >
                        <MoreVertical className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Tap Area (Takes remaining space to push bottom actions down) */}
                  <div className="flex-1 w-full relative touch-pan-y shadow-inner rounded-[32px] overflow-hidden">
                    {/* Interaction layer */}
                    <div
                      className="absolute inset-0 z-20 touch-none"
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerLeave}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    {/* Optional UI elements that should sit above the bottom bar */}
                    <div
                      className="absolute inset-x-4 bottom-4 flex flex-col gap-4 pointer-events-none transition-opacity duration-300"
                      style={{ opacity: showUI ? 1 : 0 }}
                    >
                      {spark.isChallenge && (
                        <div className="bg-black/40 backdrop-blur-md border border-[#B026FF]/50 p-3.5 rounded-xl flex items-center gap-3 w-max max-w-full">
                          <div className="w-10 h-10 rounded-full bg-[#B026FF]/20 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-[#B026FF]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[#B026FF] font-bold tracking-wider">
                              SPARK CHALLENGE 🎯
                            </p>
                            <p className="text-sm text-white font-medium whitespace-pre-wrap leading-tight mt-0.5 drop-shadow-md">
                              {spark.challengeText}
                            </p>
                          </div>
                        </div>
                      )}
                      {spark.caption && (
                        <p className="font-medium text-[15px] leading-snug drop-shadow-lg text-white max-w-[85%] pointer-events-auto">
                          {renderTextWithTags(spark.caption)}
                        </p>
                      )}
                      {spark.type === 'video' && spark.taggedUsers && spark.taggedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1 pointer-events-auto">
                          {spark.taggedUsers.map((u: string) => (
                            <button 
                              key={u}
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${u.replace('@', '')}`); }}
                              className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-sm"
                            >
                              👤 {u}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Energy Meter (Right side) */}
                  {!isHighlightMode && (
                    <div
                      style={{ opacity: showUI ? 1 : 0 }}
                      className="transition-opacity duration-300"
                    >
                      <SparkEnergyMeter
                        spark={spark}
                        currentUser={currentUser}
                        onShowToast={showToast}
                      />
                    </div>
                  )}

                  {/* Bottom Actions Bar */}
                  {!isHighlightMode && (
                    <div
                      className="w-full pb-safe-bottom z-30 transition-all duration-300 pointer-events-none"
                      style={{
                        opacity: showUI ? 1 : 0,
                        transform: showUI ? "translateY(0)" : "translateY(20px)",
                      }}
                    >
                      <div className="px-4 pb-4 pointer-events-auto">
                        {/* Quick Reactions / Collab Actions */}
                        {spark.isCollab && spark.status === 'pending' && !isOwnSpark ? (
                          <div className="flex gap-2 w-full mt-4">
                             <button
                               onClick={() => {
                                  // Use state-driven update instead of direct mutation
                                  try {
                                    const invites = JSON.parse(localStorage.getItem('skrimchat_collab_invites') || '[]');
                                    const inviteIdx = invites.findIndex((i: any) => i.spark.id === spark.id);
                                    if (inviteIdx >= 0) {
                                      invites[inviteIdx].status = 'accepted';
                                      invites[inviteIdx].spark.status = 'accepted';
                                      localStorage.setItem('skrimchat_collab_invites', JSON.stringify(invites));
                                    }
                                    const sparks = JSON.parse(localStorage.getItem('skrimchat_sparks') || '[]');
                                    const sidx = sparks.findIndex((s: any) => s.id === spark.id);
                                    if (sidx >= 0) { sparks[sidx].status = 'accepted'; }
                                    else { sparks.push({...spark, status: 'accepted'}); }
                                    localStorage.setItem('skrimchat_sparks', JSON.stringify(sparks));
                                  } catch (e) {}
                                  // Trigger re-render by navigating to next spark
                                  showToast("✅ Collab accepted! Now live on both profiles.");
                                  // Force remount by closing and reopening
                                  onDelete('__collab_accepted__' + spark.id);
                               }}
                               className="flex-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] hover:opacity-90 transition-opacity rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg"
                             >
                               <CheckCircle className="w-5 h-5 text-white" />
                               <span className="text-white text-sm font-bold">Accept Collab</span>
                             </button>
                             <button
                               onClick={() => {
                                  try {
                                    const invites = JSON.parse(localStorage.getItem('skrimchat_collab_invites') || '[]');
                                    const inviteIdx = invites.findIndex((i: any) => i.spark.id === spark.id);
                                    if (inviteIdx >= 0) {
                                      invites[inviteIdx].status = 'declined';
                                      invites[inviteIdx].spark.status = 'declined';
                                      localStorage.setItem('skrimchat_collab_invites', JSON.stringify(invites));
                                    }
                                  } catch (e) {}
                                  onDelete(spark.id);
                                  onClose();
                               }}
                               className="w-14 h-14 bg-red-500/80 hover:bg-red-500 transition-colors backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-lg"
                             >
                               <X className="w-6 h-6 text-white" />
                             </button>
                          </div>
                        ) : !isOwnSpark ? (
                          <>
                            <div className="flex justify-between items-center mb-4 px-1 drop-shadow-lg">
                              {SKRIM_REACTIONS.slice(0, 6).map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => handleReaction(r.emoji)}
                                  className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-xl filter"
                                >
                                  {r.emoji}
                                </button>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 w-full">
                              <button
                                onClick={() => setActiveSheet("reply")}
                                className="flex-1 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-full py-3.5 px-4 flex items-center justify-center gap-2 border border-white/10"
                              >
                                <MessageCircle className="w-5 h-5 text-white" />
                                <span className="text-white text-sm font-semibold">
                                  Reply
                                </span>
                              </button>
                              {spark.isChallenge && (
                                <button
                                  onClick={() => setActiveSheet("challenge")}
                                  className="flex-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] hover:opacity-90 transition-opacity rounded-full py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg"
                                >
                                  <Target className="w-5 h-5 text-white" />
                                  <span className="text-white text-sm font-bold">
                                    Challenge
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => setActiveSheet("share")}
                                className="w-12 h-12 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shrink-0"
                              >
                                <Share2 className="w-5 h-5 text-white" />
                              </button>
                              {isOwnSpark && (
                                <button
                                  onClick={handleSave}
                                  className="w-12 h-12 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shrink-0 relative overflow-hidden group"
                                >
                                  {isSaved && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute inset-0 bg-[#B026FF] z-0"
                                    />
                                  )}
                                  <motion.div
                                    animate={
                                      isBounceSave ? { scale: [1, 1.3, 1] } : {}
                                    }
                                    transition={{ duration: 0.3 }}
                                    className="z-10"
                                  >
                                    <Bookmark
                                      className={`w-5 h-5 ${isSaved ? "text-white fill-white" : "text-white"}`}
                                    />
                                  </motion.div>
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2 relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-3">
                            <div
                              className="flex items-center justify-between px-1"
                              onClick={() => {
                                setActiveSheet("insights");
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                  <span className="text-sm">👁️</span>
                                  <span className="text-sm font-bold text-white">
                                    {(spark.views || 0).toLocaleString()}
                                  </span>
                                </div>
                                <span className="text-[11px] text-[#B026FF] font-bold tracking-wider flex items-center gap-1.5 bg-[#B026FF]/10 px-2.5 py-1 rounded-full">
                                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#B026FF]"></span>{" "}
                                  LIVE
                                </span>
                              </div>
                              <div className="text-[12px] font-semibold text-white/60 flex items-center gap-1 hover:text-white transition-colors uppercase tracking-wider">
                                Insights{" "}
                                <span className="transition-transform">↑</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Radial Menu Hint */}
                  <AnimatePresence>
                    {showRadialHint && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
                      >
                        <div className="bg-black/60 backdrop-blur-md rounded-full px-5 py-2.5 border border-white/20 text-white text-sm font-semibold shadow-2xl flex items-center gap-2 whitespace-nowrap">
                          💡 Hold anywhere to access spark options
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Radial Menu Overlay */}
                  <AnimatePresence>
                    {radialMenuOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          backdropFilter: "blur(0px)",
                          backgroundColor: "rgba(0,0,0,0)",
                        }}
                        animate={{
                          opacity: 1,
                          backdropFilter: "blur(3px)",
                          backgroundColor: "rgba(0,0,0,0.4)",
                        }}
                        exit={{
                          opacity: 0,
                          backdropFilter: "blur(0px)",
                          backgroundColor: "rgba(0,0,0,0)",
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-[200] overflow-hidden"
                        onClick={() => {
                          setRadialMenuOpen(false);
                          setIsPaused(false);
                        }}
                      >
                        {/* Center Pulse */}
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute rounded-full border border-[#B026FF] shadow-[0_0_15px_#B026FF]"
                          style={{
                            width: 60,
                            height: 60,
                            left: radialMenuCenter.x - 30,
                            top: radialMenuCenter.y - 30,
                          }}
                        />
                        <div
                          className="absolute bg-[#B026FF]/20 rounded-full blur-xl pointer-events-none"
                          style={{
                            width: 80,
                            height: 80,
                            left: radialMenuCenter.x - 40,
                            top: radialMenuCenter.y - 40,
                          }}
                        />

                        {/* Menu items */}
                        {[
                          {
                            id: "save",
                            icon: "🔖",
                            label: "Save",
                            angle: -90,
                            action: () => {
                              setRadialMenuOpen(false);
                              handleOpenHighlightPicker();
                            },
                          },
                          {
                            id: "copy",
                            icon: "🔗",
                            label: "Copy",
                            angle: -18,
                            action: () => {
                              setRadialMenuOpen(false);
                              navigator.clipboard.writeText(
                                window.location.origin + "/spark/" + spark.id,
                              );
                              showToast("🔗 Link copied!");
                            },
                          },
                          {
                            id: "delete",
                            icon: "🗑️",
                            label: "Delete",
                            angle: 54,
                            action: () => {
                              setRadialMenuOpen(false);
                              setActiveSheet("delete-confirm");
                            },
                          },
                          {
                            id: "insights",
                            icon: "📊",
                            label: "Insights",
                            angle: 126,
                            action: () => {
                              setRadialMenuOpen(false);
                              setActiveSheet("insights");
                            },
                          },
                          {
                            id: "highlight",
                            icon: "💜",
                            label: "Highlight",
                            angle: 198,
                            action: () => {
                              setRadialMenuOpen(false);
                              handleOpenHighlightPicker();
                            },
                          },
                        ].map((item, index) => {
                          const radius = 90;
                          // Convert angle to radians
                          const rad = item.angle * (Math.PI / 180);
                          const x =
                            radialMenuCenter.x +
                            Math.round(radius * Math.cos(rad));
                          const y =
                            radialMenuCenter.y +
                            Math.round(radius * Math.sin(rad));

                          return (
                            <motion.button
                              key={item.id}
                              initial={{
                                left: radialMenuCenter.x,
                                top: radialMenuCenter.y,
                                opacity: 0,
                                scale: 0,
                                x: "-50%",
                                y: "-50%",
                              }}
                              animate={{
                                left: x,
                                top: y,
                                opacity: 1,
                                scale: 1,
                                x: "-50%",
                                y: "-50%",
                              }}
                              exit={{
                                left: radialMenuCenter.x,
                                top: radialMenuCenter.y,
                                opacity: 0,
                                scale: 0,
                                x: "-50%",
                                y: "-50%",
                              }}
                              transition={{
                                type: "tween",
                                ease: [0.34, 1.56, 0.64, 1],
                                delay: index * 0.03,
                                duration: 0.3,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                item.action();
                              }}
                              className="absolute flex flex-col items-center justify-center bg-black/70 backdrop-blur-md rounded-full border-2 border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                              style={{ width: 56, height: 56 }}
                            >
                              <span className="text-xl mb-0.5">
                                {item.icon}
                              </span>
                              <span className="text-[8px] text-white font-bold tracking-tight uppercase leading-none">
                                {item.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Floating Emojis Overlay */}
                  {floatingEmojis.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        y: -400,
                        opacity: 0,
                        scale: 1.5,
                        x: (Math.random() - 0.5) * 80,
                      }}
                      transition={{ duration: 1.8, ease: "easeOut" }}
                      className="absolute bottom-40 text-5xl pointer-events-none z-[100] drop-shadow-2xl"
                      style={{ left: `${f.x}%` }}
                    >
                      {f.emoji}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 48, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-safe px-4 z-[250] w-full max-w-[400px]"
            >
              <div className="bg-black/80 backdrop-blur-md border border-[#B026FF] shadow-[0_4px_12px_rgba(176,38,255,0.2)] rounded-full px-5 py-3 text-center">
                <p className="text-white text-sm font-semibold">
                  {toastMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Sheets Overlay */}
        <AnimatePresence>
          {activeSheet && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveSheet(null)}
                className="absolute inset-0 bg-black/60 z-[220] backdrop-blur-sm sm:w-[400px] sm:left-1/2 sm:-translate-x-1/2"
              />

              {/* Sheet Container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 inset-x-0 sm:w-[400px] sm:left-1/2 sm:-translate-x-1/2 z-[230] bg-[#121212]/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-hidden pb-safe-bottom"
              >
                <div
                  className="w-full flex justify-center py-3"
                  onClick={() => setActiveSheet(null)}
                >
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                {/* Reply Sheet */}
                {activeSheet === "reply" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white text-lg">
                        Reply to{" "}
                        {group.user.displayName ||
                          `@${group.user.handle?.replace("@", "")}`}
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Mini Preview */}
                    <div className="flex gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-12 h-16 rounded bg-black/50 overflow-hidden shrink-0">
                        {spark.type === "video" ? (
                          <video
                            src={spark.video || "https://www.w3schools.com/html/mov_bbb.mp4"}
                            className="w-full h-full object-cover"
                            muted
                            title="preview"
                            onError={() => console.log('Spark video preview error')}
                          />
                        ) : spark.type === "image" ? (
                          <img
                            src={spark.image}
                            className="w-full h-full object-cover"
                            alt="preview"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col justify-center bg-gradient-to-br from-[#B026FF] to-[#00F0FF]">
                            <p className="text-[6px] text-white font-bold p-1 overflow-hidden leading-tight">
                              {renderTextWithTags(spark.text)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate font-medium">
                          {renderTextWithTags(spark.caption || spark.text) || "Spark"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {getSparkTimeAgo(spark)} • {spark.views || 0} views
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                        Quick Replies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "🔥 Fire!",
                          "💜 Loved it!",
                          "😂 Haha!",
                          "🚀 Wow!",
                          "💀 Dead 😂",
                          "⚡ Pulsed!",
                        ].map((qr) => (
                          <button
                            key={qr}
                            onClick={() => setReplyText(qr)}
                            className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full text-sm text-white border border-white/5"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 items-end mt-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-2">
                        <img
                          src={
                            currentUser?.avatar ||
                            "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                          }
                          alt="me"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-white/10 rounded-2xl p-2 pr-1.5 flex items-end border border-white/10 focus-within:border-[#B026FF]/50 transition-colors">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type a reply..."
                          className="w-full bg-transparent text-white px-2 py-1.5 text-sm resize-none outline-none max-h-24 min-h-[40px] no-scrollbar placeholder:text-gray-400"
                          rows={1}
                        />
                        <button
                          onClick={handleReplySend}
                          disabled={!replyText.trim()}
                          className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${
                            replyText.trim()
                              ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-100 hover:scale-105 shadow-[0_0_10px_rgba(176,38,255,0.4)]"
                              : "bg-white/10 opacity-50"
                          }`}
                        >
                          <Send
                            className="w-4 h-4 text-white"
                            strokeWidth={3}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Challenge Sheet */}
                {activeSheet === "challenge" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-[#B026FF]" /> Accept
                        Challenge
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#B026FF]/20 blur-2xl rounded-full" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-14 h-20 rounded bg-black/50 overflow-hidden shrink-0 border border-white/10 shadow-lg">
                          {spark.type === "video" ? (
                            <video
                              src={spark.video}
                              className="w-full h-full object-cover"
                              muted
                              title="preview"
                            />
                          ) : spark.type === "image" ? (
                            <img
                              src={spark.image}
                              className="w-full h-full object-cover"
                              alt="preview"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col justify-center bg-gradient-to-br from-[#B026FF] to-[#00F0FF]"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-xs text-[#B026FF] font-bold mb-1">
                            @{group.user.handle?.replace("@", "")} challenges
                            you:
                          </p>
                          <p className="text-white text-base font-semibold leading-tight">
                            {spark.challengeText}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">
                      How to respond
                    </p>
                    <div className="flex flex-col gap-2.5 mb-6">
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Post a Photo
                        </div>
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                          <Video className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Record a Vibe
                        </div>
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3.5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="text-left font-medium text-white flex-1">
                          Create a text Spark
                        </div>
                      </button>
                    </div>

                    <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center border border-white/5 mb-5">
                      <span className="text-sm font-medium text-gray-300">
                        ⏰ Ends in:{" "}
                        <span className="text-white font-bold tracking-widest">
                          23:45:12
                        </span>
                      </span>
                      <span className="text-sm font-medium text-red-400">
                        🔥 142 accepted
                      </span>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex-1"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleChallengeAccept}
                        className="py-3.5 px-6 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] rounded-full text-white font-bold flex-[2] shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:opacity-90"
                      >
                        Accept & Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Share Sheet */}
                {activeSheet === "share" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-[#B026FF]" /> Share Spark ⚡
                      </h3>
                      <button onClick={() => setActiveSheet(null)} className="p-1.5 bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* Primary actions */}
                    <div className="flex flex-col gap-2 mb-5">
                      {/* Share to your Spark — real repost */}
                      <button
                        onClick={() => handleShareOption("your story")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#B026FF]/10 border border-[#B026FF]/30 hover:bg-[#B026FF]/20 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#B026FF]/30 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#B026FF]" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-bold">Add to your Spark</div>
                          <div className="text-[#B026FF]/70 text-xs mt-0.5">Reposts this to your story — live for 24h</div>
                        </div>
                      </button>

                      {/* Send in Connect — to a specific user */}
                      <button
                        onClick={() => handleShareOption("Connect")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-bold">Send in Connect</div>
                          <div className="text-blue-400/70 text-xs mt-0.5">Pick a contact — opens their chat directly</div>
                        </div>
                      </button>

                      {/* Share in Arattai + copy link */}
                      <button
                        onClick={() => handleShareOption("Arattai")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shrink-0 text-xl">
                          💬
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-white font-bold">Share in Arattai</div>
                          <div className="text-green-400/70 text-xs mt-0.5">Posts to Arattai feed + copies link</div>
                        </div>
                        <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                          <Copy className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] text-green-400 font-bold">+ Copy</span>
                        </div>
                      </button>
                    </div>

                    {/* Copy link standalone */}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-5"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm font-medium flex-1 text-left truncate">
                        skrim.chat/spark/{spark.id}
                      </span>
                      <span className="text-[#B026FF] text-xs font-bold">Copy</span>
                    </button>

                    <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider px-1">
                      Share to Social Media
                    </p>

                    {/* Social grid — 4 cols */}
                    <div className="grid grid-cols-4 gap-3 px-1">
                      {/* WhatsApp */}
                      <button onClick={() => handleShareOption("WhatsApp")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.555 4.107 1.523 5.83L.057 23.75a.5.5 0 0 0 .62.62l5.896-1.467A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.092-1.395l-.363-.215-3.758.935.936-3.643-.237-.376A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">WhatsApp</span>
                      </button>

                      {/* Instagram */}
                      <button onClick={() => handleShareOption("Instagram")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Instagram</span>
                      </button>

                      {/* Snapchat */}
                      <button onClick={() => handleShareOption("Snapchat")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#FFFC00] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#000]"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Snapchat</span>
                      </button>

                      {/* X / Twitter */}
                      <button onClick={() => handleShareOption("Twitter")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">X (Twitter)</span>
                      </button>

                      {/* Facebook */}
                      <button onClick={() => handleShareOption("Facebook")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Facebook</span>
                      </button>

                      {/* Reddit */}
                      <button onClick={() => handleShareOption("Reddit")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF4500] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Reddit</span>
                      </button>

                      {/* Discord */}
                      <button onClick={() => handleShareOption("Discord")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Discord</span>
                      </button>

                      {/* Telegram */}
                      <button onClick={() => handleShareOption("Telegram")} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-2xl bg-[#0088cc] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium">Telegram</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Connect Share Sheet */}
                {activeSheet === "connect" && (
                  <div className="px-4 pb-6 flex flex-col max-h-[70vh]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="font-bold text-white text-lg">
                        Send to...
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="relative mb-4 shrink-0">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#B026FF]/50 transition-colors"
                      />
                    </div>

                    <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider shrink-0 px-1">
                      Recent Chats
                    </p>

                    <div className="overflow-y-auto no-scrollbar flex-1 mb-4 flex flex-col gap-1 min-h-0">
                      {mockUsers
                        .filter(
                          (u) =>
                            u.id !== currentUser?.id &&
                            (u.displayName
                              ?.toLowerCase()
                              .includes(contactSearch.toLowerCase()) ||
                              u.username
                                ?.toLowerCase()
                                .includes(contactSearch.toLowerCase())),
                        )
                        .map((u) => {
                          const isSelected = selectedContacts.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedContacts((prev) =>
                                  prev.includes(u.id)
                                    ? prev.filter((id) => id !== u.id)
                                    : [...prev, u.id],
                                );
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left ${isSelected ? "bg-white/10" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10">
                                  <img
                                    src={u.avatar}
                                    alt={u.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="text-white font-semibold flex items-center gap-1.5">
                                    {u.displayName}
                                    {u.isVerified && (
                                      <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    @{u.username}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#B026FF] border-[#B026FF]" : "border-white/20"}`}
                              >
                                {isSelected && (
                                  <Check
                                    className="w-3.5 h-3.5 text-white"
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    <button
                      onClick={handleConnectSend}
                      disabled={selectedContacts.length === 0}
                      className={`w-full py-3.5 rounded-full font-bold shadow-lg transition-all shrink-0 ${selectedContacts.length > 0 ? "bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white hover:opacity-90" : "bg-white/10 text-white/40 cursor-not-allowed"}`}
                    >
                      {selectedContacts.length > 0
                        ? `Send to ${selectedContacts.length} ⚡`
                        : "Send ⚡"}
                    </button>
                  </div>
                )}

                {/* Highlight Sheet */}
                {activeSheet === "highlight" && (
                  <div className="px-5 pb-6">
                    <div className="flex flex-col mb-6">
                      <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
                      <h3 className="font-bold text-white text-xl flex items-center justify-center gap-2 mb-2">
                        ✨ Add to Highlight
                      </h3>
                      <div className="h-px w-full bg-white/10 mt-3 mb-5" />
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-start px-2">
                      {highlights.map((hl) => {
                        const cover = hl.cover;
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
                          <button
                            key={hl.id}
                            onClick={() => handleAddToHighlight(hl.id)}
                            className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
                          >
                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#B026FF] to-[#00F0FF] shadow-[0_0_8px_rgba(176,38,255,0.3)] transition-transform group-active:scale-95">
                              <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#121212]" style={bgStyle}>
                                {isImage && <img src={cover} alt={hl.title} className="w-full h-full object-cover" />}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-300 w-16 truncate text-center group-active:text-white transition-colors">{hl.title}</span>
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setActiveSheet("create-highlight")}
                        className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
                      >
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border-2 border-dashed border-[#B026FF]/60 hover:bg-white/10 transition-colors group-active:scale-95">
                          <Plus className="w-6 h-6 text-[#B026FF]" />
                        </div>
                        <span className="text-xs font-semibold text-gray-300 group-active:text-white transition-colors">New</span>
                      </button>
                    </div>

                    <div className="h-px w-full bg-white/10 mt-2 mb-5" />

                    <button
                      onClick={() => setActiveSheet(null)}
                      className="w-full py-3.5 rounded-full font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors active:scale-95 text-center"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {/* Create Highlight Sheet */}
                {activeSheet === "create-highlight" && (
                  <div className="px-5 pb-6">
                    <div className="flex flex-col mb-4">
                      <h3 className="font-bold text-white text-xl text-center mb-3">
                        Create New Highlight
                      </h3>
                      <div className="h-px w-full bg-white/10 mb-5" />
                    </div>

                    <div className="mb-6">
                      <input
                        type="text"
                        placeholder="Enter highlight name..."
                        value={newHighlightName}
                        onChange={(e) => setNewHighlightName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#B026FF]/50 transition-colors font-medium placeholder:text-white/40 mb-4"
                        autoFocus
                      />
                      
                      <div className="text-white/70 text-sm font-medium mb-3">
                        Pick an emoji for your highlight
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {["🔥", "⚡", "💜", "🌙", "🎮", "🏆", "✨", "💫", "🎯", "🌊", "🎵", "💎", "❤️", "🚀", "👑", "🌟", "🎪", "🦋"].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setNewHighlightEmoji(emoji)}
                            className={`h-12 w-12 flex items-center justify-center text-2xl rounded-full transition-all ${
                              newHighlightEmoji === emoji ? "border-2 border-[#B026FF] bg-[#B026FF]/20" : "bg-white/5 border border-transparent hover:bg-white/10"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setActiveSheet("highlight")}
                        className="flex-1 py-3.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white/70 transition-colors active:scale-95 text-center"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateHighlight}
                        disabled={!newHighlightName.trim()}
                        className={`flex-1 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                          newHighlightName.trim()
                            ? "bg-[#B026FF] text-white hover:opacity-90"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Insights Sheet */}
                {activeSheet === "insights" && spark && (
                  <div className="px-6 pb-6 pt-2">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-[#B026FF]/20 p-2.5 rounded-full">
                        <BarChart2 className="w-5 h-5 text-[#B026FF]" />
                      </div>
                      <h2 className="text-white text-xl font-bold tracking-tight">
                        SPARK INSIGHTS
                      </h2>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="text-xl">👁️</span>
                          <span className="font-semibold text-[15px]">
                            Views
                          </span>
                        </div>
                        <span className="text-white font-bold text-lg">
                          {(spark.views || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="text-xl">🔄</span>
                          <span className="font-semibold text-[15px]">
                            Shares
                          </span>
                        </div>
                        <span className="text-white font-bold text-lg">
                          {(spark.reactions?.share || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="text-xl">⚡</span>
                          <span className="font-semibold text-[15px]">
                            Total Energy
                          </span>
                        </div>
                        <span className="text-[#00F0FF] font-bold text-lg">
                          {Object.values(spark.reactions || {})
                            .reduce((a: any, b: any) => a + b, 0)
                            .toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white/80">
                          <span className="text-xl">👤</span>
                          <span className="font-semibold text-[15px]">
                            Profile Visits
                          </span>
                        </div>
                        <span className="text-white font-bold text-lg">
                          {Math.floor((spark.views || 0) * 0.15).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!group.isExpired && (
                      <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center px-2">
                        <span className="text-white/40 text-sm font-medium">
                          Expires in
                        </span>
                        {(() => {
                          const hoursLeft = Math.floor(Math.max(0, timeRemaining) / (1000 * 60 * 60));
                          const minutesLeft = Math.floor((Math.max(0, timeRemaining) % (1000 * 60 * 60)) / (1000 * 60));
                          
                          let colorClass = "text-[#B026FF]";
                          let animationClass = "";
                          
                          if (hoursLeft < 1 && minutesLeft < 10) {
                            colorClass = "text-[#EF4444]";
                            animationClass = "animate-pulse";
                          } else if (hoursLeft < 1) {
                            colorClass = "text-[#F97316]";
                          }

                          return (
                            <span className={`font-bold text-sm ${colorClass} ${animationClass}`.trim()}>
                              {hoursLeft}h {minutesLeft}m
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Highlight Options Sheet */}
                {activeSheet === "highlight-options" && (
                  <div className="px-0 pb-0">
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/spark/${spark.id}`;
                          navigator.clipboard.writeText(url);
                          showToast("🔗 Link copied!");
                          setActiveSheet(null);
                        }}
                        className="w-full flex items-center gap-3 px-6 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                      >
                        <Copy className="w-5 h-5 text-gray-300" />
                        <span className="font-semibold text-base">
                          Copy Link
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveSheet("remove-highlight-confirm")}
                        className="w-full flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-500/10 transition-colors active:bg-red-500/20"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-base flex-1 text-left">
                          Remove from Highlight
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Remove from Highlight Confirm Sheet */}
                {activeSheet === "remove-highlight-confirm" && (
                  <div className="px-5 pb-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">
                       Remove from Highlight?
                    </h3>
                    <p className="text-white/60 text-sm mb-6 max-w-[260px] mx-auto">
                       This spark will be removed from this highlight.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          let hlList = JSON.parse(localStorage.getItem("skrimchat_highlights") || "[]");
                          const activeHId = group.id; // From IdentityScreen originalId passed via group.id
                          const updatedHighlights = hlList.map((h: any) => {
                            if (h.id === activeHId || h.id === spark.highlightId) {
                              return {
                                ...h,
                                sparks: h.sparks ? h.sparks.filter((s: any) => s.id !== spark.id) : []
                              };
                            }
                            return h;
                          });
                          
                          const finalHighlights = updatedHighlights.filter((h: any) => h.sparks && h.sparks.length > 0);
                          localStorage.setItem("skrimchat_highlights", JSON.stringify(finalHighlights));
                          
                          // Dispatch event so IdentityScreen updates
                          window.dispatchEvent(new Event("highlightSaved"));
                          showToast("🗑️ Removed from Highlight");
                          
                          // Let the parent IdentityScreen handle close
                          if (onDelete) {
                              onDelete(spark.id);
                          }
                          setActiveSheet(null);
                          if (group.sparks.length <= 1) {
                              onClose();
                          }
                        }}
                        className="w-full py-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors pointer-events-auto shadow-lg shadow-red-500/20"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setActiveSheet("highlight-options")}
                        className="w-full py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/5 transition-colors pointer-events-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Options Sheet */}
                {activeSheet === "options" && (
                  <div className="px-0 pb-0">
                    {isOwnSpark ? (
                      <div className="flex flex-col">
                        <button
                          onClick={() => setActiveSheet("highlight")}
                          className="w-full flex items-center gap-3 px-6 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                        >
                          <Bookmark className="w-5 h-5 text-gray-300" />
                          <span className="font-semibold text-base">
                            Save to Highlight
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveSheet("insights")}
                          className="w-full flex items-center gap-3 px-6 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                        >
                          <BarChart2 className="w-5 h-5 text-gray-300" />
                          <span className="font-semibold text-base">
                            View Insights
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              window.location.origin + "/spark/" + spark.id,
                            );
                            showToast("🔗 Link copied!");
                            setActiveSheet(null);
                          }}
                          className="w-full flex items-center gap-3 px-6 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/5 active:bg-white/20"
                        >
                          <Copy className="w-5 h-5 text-gray-300" />
                          <span className="font-semibold text-base">
                            Copy Link
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveSheet("delete-confirm")}
                          className="w-full flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-500/10 transition-colors active:bg-red-500/20"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-base">
                            Delete Spark
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <button
                          onClick={() => setActiveSheet("report")}
                          className="w-full flex items-center gap-3 px-6 py-4 text-yellow-500 hover:bg-yellow-500/10 transition-colors border-b border-white/5 active:bg-yellow-500/20"
                        >
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold text-base">
                            Report Spark
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveSheet("block-confirm")}
                          className="w-full flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-500/10 transition-colors active:bg-red-500/20"
                        >
                          <Ban className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-base">
                            Block @
                            {group.user.username ||
                              group.user.handle?.replace("@", "")}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Report Sheet */}
                {activeSheet === "report" && (
                  <div className="px-5 pb-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-white text-lg">
                        Report Spark
                      </h3>
                      <button
                        onClick={() => setActiveSheet(null)}
                        className="p-1.5 bg-white/10 rounded-full"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 mb-6">
                      {[
                        "Inappropriate content",
                        "Spam or fake",
                        "Harassment or bullying",
                        "Misinformation",
                        "Other",
                      ].map((reason) => (
                        <button
                          key={reason}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-left text-white text-sm font-medium"
                        >
                          <div className="w-4 h-4 rounded-full border border-white/30" />
                          {reason}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        showToast(
                          "⚠️ Spark reported. We'll review it shortly.",
                        );
                        setActiveSheet(null);
                      }}
                      className="w-full py-3.5 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                      Submit Report
                    </button>
                  </div>
                )}

                {/* Block Confirm Sheet */}
                {activeSheet === "block-confirm" && (
                  <div className="px-5 pb-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <Ban className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">
                      Block @
                      {group.user.username ||
                        group.user.handle?.replace("@", "")}
                      ?
                    </h3>
                    <p className="text-gray-400 text-sm mb-8 px-4">
                      They won't be able to see your profile or contact you.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          try {
                            const blockedStr = localStorage.getItem(
                              "skrimchat_blocked_users",
                            );
                            let blocked = blockedStr
                              ? JSON.parse(blockedStr)
                              : [];
                            if (!Array.isArray(blocked)) blocked = [];
                            blocked.push(
                              group.user.username ||
                                group.user.handle?.replace("@", ""),
                            );
                            localStorage.setItem(
                              "skrimchat_blocked_users",
                              JSON.stringify(blocked),
                            );
                          } catch (e) {}
                          showToast(
                            `🚷 @${group.user.username || group.user.handle?.replace("@", "")} has been blocked.`,
                          );
                          setActiveSheet(null);
                          onClose();
                        }}
                        className="w-full py-3.5 rounded-full font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Block
                      </button>
                      <button
                        onClick={() => setActiveSheet("options")}
                        className="w-full py-3.5 rounded-full font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Confirm Sheet */}
                {activeSheet === "delete-confirm" && (
                  <div className="px-5 pb-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white text-xl mb-2">
                      Delete this Spark?
                    </h3>
                    <p className="text-gray-400 text-sm mb-8">
                      This cannot be undone.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          try {
                            const str =
                              localStorage.getItem("skrimchat_sparks");
                            if (str) {
                              const arr = JSON.parse(str);
                              const newArr = arr.filter(
                                (s: any) => s.id !== spark.id,
                              );
                              localStorage.setItem(
                                "skrimchat_sparks",
                                JSON.stringify(newArr),
                              );
                            }
                          } catch (e) {}
                          if (onDelete) {
                            onDelete(spark.id);
                          }
                          showToast("🗑️ Spark deleted");
                          setActiveSheet(null);
                          onClose();
                        }}
                        className="w-full py-3.5 rounded-full font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setActiveSheet("options")}
                        className="w-full py-3.5 rounded-full font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {showEndScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {highlightName}
            </h2>
            <p className="text-gray-400 mb-8">End of Highlight</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowEndScreen(false);
                  setIsPaused(false);
                  setUserIndex(0);
                  setSparkIndex(0);
                  setProgress(0);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Repeat className="w-5 h-5" /> Replay
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" /> Close
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
