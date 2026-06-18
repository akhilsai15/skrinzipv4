import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarWithRing } from '../components/ui';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Zap,
  SmilePlus, RefreshCw, X, Play, ChevronLeft, ChevronRight,
  Music, MapPin, Repeat2, Quote, Flame,
} from 'lucide-react';
import { likePost } from '../lib/mock/mockServices';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { motion, AnimatePresence } from 'motion/react';
import { SKRIM_REACTIONS } from '../lib/mock/mockData';
import { BadgeRow } from '../components/BadgeComponents';
import { ReactionRow } from '../components/ReactionRow';
import { triggerReactionAnimation } from '../lib/animations/reactionAnimations';
import { PulseCommentsSheet, PulseShareSheet } from '../components/PulseSheets';
import { generateMockStatsForBadge } from '../lib/mock/mockBadges';
import { incrementStat } from '../lib/mock/achievementEngine';
import { getSparks } from '../lib/mock/mockServices';
import { assembleFeed, getDefaultMood, MOODS, VELOCITY_MAP } from '../lib/mock/skrimAlgorithm';
import { SparkRow } from '../components/SparkRow';
import { SparkViewer } from '../components/SparkViewer';
import { SparkCreator } from '../components/SparkCreator';
import { StoryBehindSheet } from '../components/StoryBehindSheet';

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function LiveCounter({ count }: { count: number }) {
  return (
    <motion.span
      key={count}
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xs font-bold text-[#B026FF] whitespace-nowrap"
    >
      {fmt(count)}
    </motion.span>
  );
}

// ─── Text-only Tweet card ─────────────────────────────────────
function TextPost({ post, onLike, onComment, onShare, onSave, navigate }: any) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const gradients = [
    'from-[#1a0030] to-[#0d001a]',
    'from-[#001a30] to-[#00060d]',
    'from-[#1a1a00] to-[#0d0d00]',
    'from-[#001a0d] to-[#000d06]',
    'from-[#1a000d] to-[#0d0006]',
  ];
  const gradient = gradients[post.id.charCodeAt(post.id.length - 1) % gradients.length];

  const doLike = () => {
    setLiked((l: boolean) => !l);
    setLikes((c: number) => liked ? c - 1 : c + 1);
    onLike(post.id);
  };

  return (
    <div className={`mx-4 mb-6 rounded-3xl bg-gradient-to-br ${gradient} border border-white/8 overflow-hidden shadow-xl`}>
      {/* User row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory={false} showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-white/40 text-xs">{post.handle} · {post.time}</span>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-white/30" />
      </div>

      {/* Text body */}
      <div className="px-4 pb-3">
        <p className="text-white text-[15px] leading-relaxed font-medium">
          {post.text.split(' ').map((w: string, i: number) =>
            w.startsWith('#') || w.startsWith('@')
              ? <span key={i} className={`${w.startsWith('#') ? 'text-[#00F0FF]' : 'text-[#B026FF]'} font-semibold`}>{w} </span>
              : w + ' '
          )}
        </p>
      </div>

      {/* Mood tag */}
      <div className="px-4 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {MOODS.find(m => m.id === post.mood)?.emoji} {post.mood}
        </span>
      </div>

      {/* Actions */}
      <div className="border-t border-white/5 px-4 py-3 flex items-center gap-5">
        <button onClick={doLike} className="flex items-center gap-1.5 group">
          <Zap className={`w-5 h-5 transition-all ${liked ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white/50 group-hover:text-[#B026FF]'}`} />
          <LiveCounter count={likes} />
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-5 h-5 text-white/50 group-hover:text-[#B026FF]" />
          <span className="text-xs text-white/50">{fmt(post.comments)}</span>
        </button>
        <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 group">
          <Repeat2 className="w-5 h-5 text-white/50 group-hover:text-[#00F0FF]" />
          <span className="text-xs text-white/50">{fmt(post.shares)}</span>
        </button>
        <button onClick={() => onSave(post.id)} className="ml-auto">
          <Bookmark className={`w-5 h-5 ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white/30'}`} />
        </button>
      </div>
    </div>
  );
}

// ─── Multi-image carousel ─────────────────────────────────────
function MultiImagePost({ post, onLike, onComment, onShare, onSave, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = post.images || [post.image];

  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.temperature && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
              {post.temperature.label}
            </div>
          )}
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full aspect-square overflow-hidden"
        id={`pulse-image-${post.id}`}
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp}
        onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIdx}
            src={images[imgIdx]}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_: any, i: number) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/40'}`} />
          ))}
        </div>

        {/* Nav arrows */}
        {imgIdx > 0 && (
          <button onClick={() => setImgIdx(i => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        )}
        {imgIdx < images.length - 1 && (
          <button onClick={() => setImgIdx(i => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Reaction picker */}
        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4"
            >
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white font-bold z-10">
          {imgIdx + 1}/{images.length}
        </div>
      </div>

      {/* Actions + caption */}
      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} />
    </div>
  );
}

// ─── Shared post actions row ──────────────────────────────────
function PostActions({ post, onLike, onComment, onShare, onSave }: any) {
  return (
    <div className="flex flex-col gap-2 px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group">
          <Zap className={`w-6 h-6 transition-all ${post.isLiked ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white group-hover:text-[#B026FF]'}`} />
          <LiveCounter count={post.likes} />
        </button>
        <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-6 h-6 text-white group-hover:text-[#B026FF]" />
          <span className="text-xs text-gray-300">{fmt(post.comments)}</span>
        </button>
        <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 group">
          <Share2 className="w-6 h-6 text-white group-hover:text-[#B026FF]" />
          <span className="text-xs text-gray-300">{fmt(post.shares)}</span>
        </button>
        <button onClick={() => onSave(post.id)} className="ml-auto">
          <Bookmark className={`w-6 h-6 transition-all ${post.isSaved ? 'text-[#B026FF] fill-[#B026FF]' : 'text-white'}`} />
        </button>
      </div>
      {post.reactions && <ReactionRow initialReactions={post.reactions} onReact={() => {}} />}
      {post.caption && (
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-white mr-2">{post.user}</span>
          {post.caption.split(' ').map((w: string, i: number) =>
            w.startsWith('#') ? <span key={i} className="text-[#00F0FF]">{w} </span> : w + ' '
          )}
        </p>
      )}
    </div>
  );
}

// ─── Video-thumb post ─────────────────────────────────────────
function VideoThumbPost({ post, onLike, onComment, onShare, onSave, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction }: any) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        {post.temperature && (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
            {post.temperature.label}
          </div>
        )}
      </div>

      <div className="relative w-full aspect-[4/5] overflow-hidden group"
        id={`pulse-image-${post.id}`}
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp} onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
      >
        <img src={post.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 cursor-pointer shadow-2xl">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </motion.div>
        </div>
        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/70 rounded px-1.5 py-0.5 text-xs text-white font-bold">{post.duration}</div>
        {/* Audio */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
          <Music className="w-3 h-3 text-[#B026FF]" />
          <span className="text-[10px] text-white/80 truncate max-w-[120px]">{post.audioContext}</span>
        </div>
        {/* Reaction picker */}
        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4">
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} />
    </div>
  );
}

// ─── Standard image post ──────────────────────────────────────
function ImagePost({ post, onLike, onComment, onShare, onSave, navigate, onPickerDown, onPickerUp, pickerPostId, triggerReaction, onStoryBehind }: any) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${post.handle.replace('@', '')}`)}>
          <AvatarWithRing src={post.avatar} size="sm" isStory showOnlineDot username={post.handle} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold group-hover:underline text-white">{post.user}</span>
              <BadgeRow stats={generateMockStatsForBadge(post.handle)} isSmall />
            </div>
            <span className="text-xs text-gray-500">{post.handle} · {post.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.temperature && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border relative overflow-hidden"
              style={{ borderColor: post.temperature.color, color: post.temperature.color, backgroundColor: post.temperature.bgColor }}>
              {(post.temperature.id === 'HOT' || post.temperature.id === 'NOVA') && (
                <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              )}
              {post.temperature.label}
            </div>
          )}
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Image */}
      <div
        id={`pulse-image-${post.id}`}
        className="w-full overflow-hidden aspect-square relative group select-none"
        onPointerDown={() => onPickerDown(post.id)}
        onPointerUp={onPickerUp} onPointerLeave={onPickerUp}
        onDoubleClick={() => onLike(post.id)}
        onContextMenu={e => e.preventDefault()}
      >
        <img src={post.image} alt="" loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" />
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5">
          <Music className="w-3 h-3 text-[#B026FF]" />
          <span className="text-[10px] text-white/90 truncate max-w-[120px]">{post.audioContext}</span>
        </div>

        <AnimatePresence>
          {pickerPostId === post.id && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className="absolute z-50 flex gap-2 bg-black/60 backdrop-blur-xl px-3 py-2 rounded-full border border-white/20 shadow-2xl left-1/2 -translate-x-1/2 bottom-1/4">
              {SKRIM_REACTIONS.map(r => (
                <motion.div key={r.id} whileHover={{ scale: 1.4 }} className="px-1 cursor-pointer"
                  onClick={e => { e.stopPropagation(); triggerReaction(post.id, r); }}>
                  <span className="text-2xl">{r.emoji}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Story behind */}
      {post.hasStory && (
        <div onClick={() => onStoryBehind(post.id)}
          className="mx-4 bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between group">
          <span className="text-xs text-gray-300 group-hover:text-[#B026FF] font-medium">📖 Story behind this</span>
          <span className="text-xs text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      )}

      <PostActions post={post} onLike={onLike} onComment={onComment} onShare={onShare} onSave={onSave} />
    </div>
  );
}

// ─── Pulse Battle ─────────────────────────────────────────────
function PulseBattleCard({ post, onVote }: any) {
  const [voted, setVoted] = useState<string | null>(
    () => localStorage.getItem(`vote_${post.id}`)
  );
  const [vA, setVA] = useState(post.votesA);
  const [vB, setVB] = useState(post.votesB);
  const [total, setTotal] = useState(post.totalVotes);

  const vote = (side: 'A' | 'B') => {
    if (voted) return;
    setVoted(side);
    localStorage.setItem(`vote_${post.id}`, side);
    const inc = Math.floor(Math.random() * 50) + 10;
    setTotal(t => t + inc);
    if (side === 'A') setVA((v: number) => Math.min(99, v + 3));
    else setVB((v: number) => Math.min(99, v + 3));
  };

  return (
    <div className="mx-4 mb-6 border border-white/10 bg-[#0d0d0d] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Flame className="w-4 h-4 text-[#B026FF]" />
        <span className="text-xs font-black text-[#B026FF] uppercase tracking-widest">Pulse Battle</span>
        {voted && <span className="ml-auto text-xs text-white/30">You voted ✓</span>}
      </div>
      <h4 className="px-4 text-white font-bold text-base pb-3">{post.title}</h4>
      <div className="flex relative">
        <div className="w-1/2 relative">
          <img src={post.image1} alt="A" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-bold">{post.user1.handle}</div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-white/20 rounded-full w-9 h-9 flex items-center justify-center text-white font-black text-xs z-10">VS</div>
        <div className="w-1/2 relative">
          <img src={post.image2} alt="B" className="w-full aspect-[4/5] object-cover" />
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 text-xs text-white font-bold">{post.user2.handle}</div>
        </div>
      </div>
      {/* Vote bars */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex justify-between text-sm font-bold mb-1.5">
          <span className={voted === 'A' ? 'text-[#B026FF]' : 'text-white'}>{vA}%</span>
          <span className={voted === 'B' ? 'text-[#B026FF]' : 'text-white'}>{vB}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 flex overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-[#B026FF] to-blue-500" animate={{ width: `${vA}%` }} transition={{ duration: 0.5 }} />
          <motion.div className="h-full bg-gradient-to-r from-orange-500 to-[#FF2D87]" animate={{ width: `${vB}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      {/* Vote buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => vote('A')}
          className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${voted === 'A' ? 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/30' : 'bg-white/8 text-white/80 hover:bg-white/15 border border-white/10'}`}>
          ⚡ Vote A
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => vote('B')}
          className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${voted === 'B' ? 'bg-[#FF2D87] text-white shadow-lg shadow-[#FF2D87]/30' : 'bg-white/8 text-white/80 hover:bg-white/15 border border-white/10'}`}>
          ⚡ Vote B
        </motion.button>
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-4 pb-3">
        <span>⏱ Ends in 24h</span>
        <span>{fmt(total)} votes</span>
      </div>
    </div>
  );
}

// ─── Suggested User ───────────────────────────────────────────
function SuggestedUserCard({ post }: any) {
  const [followed, setFollowed] = useState(false);
  return (
    <div className="mx-4 mb-6 border border-white/10 bg-white/3 rounded-3xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <SmilePlus className="w-3.5 h-3.5" /> Suggested for you
      </div>
      <div className="flex items-center gap-4">
        <img src={post.user?.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[#B026FF]/30" />
        <div className="flex-1">
          <span className="text-white font-bold block">{post.user?.user}</span>
          <span className="text-gray-400 text-sm">{post.user?.handle}</span>
          <span className="text-[#FF6B00] text-xs font-bold mt-1 flex items-center gap-1">🔥 FLAME CREATOR</span>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFollowed(f => !f)}
          className={`flex-1 font-bold rounded-full py-2.5 flex items-center justify-center gap-2 transition-all ${
            followed
              ? 'bg-white/10 border border-white/20 text-white'
              : 'bg-[#B026FF] text-white shadow-lg shadow-[#B026FF]/30'
          }`}>
          <Zap className="w-4 h-4 fill-current" />
          {followed ? 'Following' : 'Follow'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          className="flex-1 bg-transparent border border-white/15 text-white font-bold rounded-full py-2.5 flex items-center justify-center gap-1.5 hover:bg-white/5">
          <X className="w-4 h-4" /> Dismiss
        </motion.button>
      </div>
    </div>
  );
}

// ─── Collab Post ──────────────────────────────────────────────
function CollabPost({ post, onLike }: any) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5">
      <div className="flex items-center gap-3 px-4">
        <div className="flex -space-x-3">
          <img src={post.user1.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-10 object-cover" alt="" />
          <img src={post.user2.avatar} className="w-10 h-10 rounded-full border-2 border-[#121212] z-0 object-cover" alt="" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm">{post.user1.handle} & {post.user2.handle}</span>
          <div className="text-xs text-[#B026FF] font-bold flex items-center gap-1">🤝 COLLAB POST</div>
        </div>
      </div>
      <div className="w-full relative aspect-square flex border-y border-white/10 overflow-hidden">
        <img src={post.image1} alt="" className="w-1/2 object-cover" />
        <div className="w-px h-full bg-gradient-to-b from-[#B026FF] via-[#B026FF]/50 to-transparent absolute left-1/2 z-10" />
        <img src={post.image2} alt="" className="w-1/2 object-cover" />
      </div>
      <div className="px-4 text-sm">
        <span className="font-bold text-white mr-2">Collab:</span>
        <span className="text-gray-300">{post.caption}</span>
      </div>
      <div className="flex gap-4 px-4">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5">
          <Zap className="w-6 h-6 text-white" />
          <LiveCounter count={post.likes} />
        </button>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="text-xs text-gray-300">{fmt(post.comments)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-white/5 animate-pulse">
      <div className="flex items-center gap-3 px-4">
        <div className="w-10 h-10 rounded-full bg-white/8" />
        <div className="w-28 h-3 bg-white/8 rounded" />
      </div>
      <div className="w-full aspect-square bg-white/5" />
      <div className="px-4 flex flex-col gap-2">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-2/3 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ─── MAIN PULSE SCREEN ────────────────────────────────────────
export default function PulseScreen() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [sparks, setSparks] = useState<any[]>([]);
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [isSparkCreatorOpen, setIsSparkCreatorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('skrimchat_mood') || getDefaultMood());
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [pickerPostId, setPickerPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [storyBehindPostId, setStoryBehindPostId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);
  const pageRef = useRef(0);

  // Get viewed sparks
  const [viewedSparks, setViewedSparks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('skrimchat_viewed_sparks') || '[]')); } catch { return new Set(); }
  });

  const handleSparkViewed = React.useCallback((sparkId: string) => {
    setViewedSparks(prev => {
      const next = new Set(prev);
      next.add(sparkId);
      // Persist
      try { localStorage.setItem('skrimchat_viewed_sparks', JSON.stringify([...next])); } catch (e) {}
      return next;
    });
    // Also mark on the spark objects so SparkRow ring turns grey immediately
    setSparks(prev => prev.map(s => s.id === sparkId ? { ...s, hasViewed: true } : s));
  }, []);

  const groupedSparks = React.useMemo(() => {
    const groups: Record<string, any> = {};
    sparks.forEach(spark => {
      if (spark.expiresAt && spark.expiresAt <= Date.now()) return;
      const userId = spark.user?.id || spark.user?.username || 'unknown';
      if (!groups[userId]) {
        groups[userId] = { id: userId, userId, user: spark.user, isOwn: spark.isOwn, sparks: [], maxEnergy: 0, hasViewed: false, energy: 'COLD', expiresAt: 0 };
      }
      if (!groups[userId].sparks.find((s: any) => s.id === spark.id)) groups[userId].sparks.push(spark);
    });
    return Object.values(groups).sort((a, b) => {
      if (a.isOwn && !b.isOwn) return -1;
      if (!a.isOwn && b.isOwn) return 1;
      if (!a.hasViewed && b.hasViewed) return -1;
      if (a.hasViewed && !b.hasViewed) return 1;
      return 0;
    });
  }, [sparks, viewedSparks]);

  const toast = useCallback((msg: string, ms = 2500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), ms);
  }, []);

  const loadPage = useCallback((page: number, append: boolean, mood: string, tab: 'foryou' | 'following') => {
    if (isLoadingMore && append) return;
    if (append) setIsLoadingMore(true);

    setTimeout(() => {
      const newPosts = assembleFeed(mood, page * 10, 10, [], tab);
      const savedList: string[] = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
      const likedList: string[] = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
      const likeCounts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
      const commentCounts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
      const shareCounts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_share_counts') || '{}');
      const synced = newPosts.map(p => ({
        ...p,
        isSaved: savedList.includes(p.id),
        isLiked: likedList.includes(p.id),
        likes: likeCounts[p.id] ?? p.likes,
        comments: commentCounts[p.id] ?? p.comments,
        shares: shareCounts[p.id] ?? p.shares,
      }));

      if (append) {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const fresh = synced.filter(p => !ids.has(p.id));
          return [...prev, ...fresh];
        });
        setIsLoadingMore(false);
      } else {
        setPosts(synced);
        setLoading(false);
      }
    }, append ? 700 : 900);
  }, [isLoadingMore]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    pageRef.current = 0;
    loadPage(0, false, selectedMood, activeTab);
    getSparks().then(s => setSparks(s));
  }, [selectedMood, activeTab]);

  // Infinite scroll sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !isLoadingMore) {
        pageRef.current += 1;
        loadPage(pageRef.current, true, selectedMood, activeTab);
      }
    }, { rootMargin: '300px' });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, isLoadingMore, selectedMood, activeTab, loadPage]);

  // Simulated live pulse ticks
  useEffect(() => {
    const t = setInterval(() => {
      setPosts(prev => prev.map(post => {
        if (post.type !== 'image' && post.type !== 'multi_image' && post.type !== 'video_thumb' && post.type !== 'text') return post;
        const vm = VELOCITY_MAP[post.temperature?.id || 'COLD'] || 0.1;
        const inc = Math.floor(Math.random() * vm * 8);
        return inc > 0 ? { ...post, likes: post.likes + inc } : post;
      }));
      setNewPostsCount(c => c + 1);
    }, 25000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    pageRef.current = 0;
    setTimeout(() => {
      const fresh = assembleFeed(selectedMood, 0, 10, [], activeTab);
      const saved: string[] = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
      const liked: string[] = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
      const counts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
      const cc: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_comment_counts') || '{}');
      const sc: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_share_counts') || '{}');
      setPosts(fresh.map(p => ({
        ...p,
        isSaved: saved.includes(p.id),
        isLiked: liked.includes(p.id),
        likes: counts[p.id] ?? p.likes,
        comments: cc[p.id] ?? p.comments,
        shares: sc[p.id] ?? p.shares,
      })));
      setNewPostsCount(0);
      setRefreshing(false);
    }, 1200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0)
      touchMoveY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    if (touchMoveY.current - touchStartY.current > 80 && !refreshing) handleRefresh();
    touchStartY.current = 0; touchMoveY.current = 0;
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nowLiked = !p.isLiked;
      const newCount = nowLiked ? p.likes + 1 : p.likes - 1;
      // Persist liked state
      try {
        const likedList: string[] = JSON.parse(localStorage.getItem('skrimchat_liked_posts') || '[]');
        const counts: Record<string,number> = JSON.parse(localStorage.getItem('skrimchat_like_counts') || '{}');
        const updated = nowLiked ? [...likedList.filter(id => id !== postId), postId] : likedList.filter(id => id !== postId);
        counts[postId] = newCount;
        localStorage.setItem('skrimchat_liked_posts', JSON.stringify(updated));
        localStorage.setItem('skrimchat_like_counts', JSON.stringify(counts));
      } catch (e) {}
      if (nowLiked) { incrementStat('reactionsSent', 1); incrementStat('pulseScore', 2); }
      return { ...p, isLiked: nowLiked, likes: newCount };
    }));
    likePost(postId);
  };

  const handleSave = (postId: string) => {
    const saved: string[] = JSON.parse(localStorage.getItem('skrimchat_saved_posts') || '[]');
    const isSaving = !saved.includes(postId);
    const updated = isSaving ? [...saved, postId] : saved.filter(id => id !== postId);
    localStorage.setItem('skrimchat_saved_posts', JSON.stringify(updated));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: isSaving } : p));
    toast(isSaving ? '✅ Saved!' : 'Removed from saved');
  };

  const triggerReaction = (postId: string, r: any) => {
    setPickerPostId(null);
    incrementStat('reactionsSent', 1); incrementStat('pulseScore', 2);
    const el = document.getElementById(`pulse-image-${postId}`);
    if (el) triggerReactionAnimation(el, r.id, r.emoji);
  };

  const handlePickerDown = (postId: string) => {
    pressTimer.current = setTimeout(() => setPickerPostId(postId), 500);
  };
  const handlePickerUp = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const updatePostCount = (postId: string, type: 'comments' | 'shares', delta: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const next = { ...p, [type]: p[type] + delta };
      try {
        const key = type === 'comments' ? 'skrimchat_comment_counts' : 'skrimchat_share_counts';
        const store: Record<string,number> = JSON.parse(localStorage.getItem(key) || '{}');
        store[postId] = next[type];
        localStorage.setItem(key, JSON.stringify(store));
      } catch (e) {}
      return next;
    }));
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar pb-24 relative bg-skrim-bg"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* New posts toast */}
      <AnimatePresence>
        {newPostsCount > 0 && !refreshing && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 72, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[60] cursor-pointer"
            onClick={() => { containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); handleRefresh(); }}
          >
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.3)] px-5 py-2 rounded-full flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B026FF] fill-[#B026FF]" />
              <span className="text-white text-sm font-bold">{newPostsCount} new post{newPostsCount > 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
            <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-md border border-[#B026FF] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-skrim-bg/90 backdrop-blur-md border-b border-white/5">
        {/* App name + search */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#B026FF] to-[#00F0FF] bg-clip-text text-transparent">Pulse</h1>
            <p className="text-[10px] text-white/30 font-medium">What's happening right now ⚡</p>
          </div>
          {refreshing && <RefreshCw className="w-5 h-5 text-[#B026FF] animate-spin" />}
        </div>

        {/* For You / Following tabs */}
        <div className="flex px-4 pb-1 gap-1">
          {(['foryou', 'following'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setLoading(true); pageRef.current = 0; }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-[#B026FF]/15 text-[#B026FF] border border-[#B026FF]/30'
                  : 'text-white/40 hover:text-white/60'
              }`}>
              {tab === 'foryou' ? '⚡ For You' : '💜 Following'}
            </button>
          ))}
        </div>

        {/* Mood selector */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {MOODS.map(mood => (
            <button key={mood.id} onClick={() => {
              setSelectedMood(mood.id);
              localStorage.setItem('skrimchat_mood', mood.id);
              setLoading(true); pageRef.current = 0;
              toast(`${mood.emoji} ${mood.label} mode!`);
            }}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 ${
                selectedMood === mood.id
                  ? 'border-[#B026FF] bg-[#B026FF]/15 text-[#B026FF] scale-105 shadow-[0_0_10px_rgba(176,38,255,0.2)]'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}>
              <span className="text-base">{mood.emoji}</span> {mood.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── SPARKS ───────────────────────────────────── */}
      <div className="border-b border-white/5">
        {loading ? (
          <div className="px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[72px] animate-pulse opacity-40">
                <div className="w-16 h-16 rounded-full bg-white/10" />
                <div className="w-10 h-2 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <SparkRow
            sparks={groupedSparks}
            onSparkClick={g => setActiveUserIndex(groupedSparks.findIndex(x => x.userId === g.userId))}
            onAddSpark={() => setIsSparkCreatorOpen(true)}
            currentUser={currentUser}
            activeUserId={activeUserIndex !== null ? groupedSparks[activeUserIndex]?.userId : undefined}
          />
        )}
      </div>

      {activeUserIndex !== null && (
        <SparkViewer groupedSparks={groupedSparks} initialUserIndex={activeUserIndex}
          onClose={() => setActiveUserIndex(null)} currentUser={currentUser}
          onSparkViewed={handleSparkViewed}
          onDelete={(id: string) => setSparks(prev => prev.filter(s => s.id !== id))} />
      )}
      <SparkCreator isOpen={isSparkCreatorOpen} onClose={() => setIsSparkCreatorOpen(false)}
        onPost={(data: any) => {
          const spark = { ...data, id: data.id || `spark_${Date.now()}`, user: currentUser, isOwn: true, createdAt: Date.now(), expiresAt: Date.now() + 86400000 };
          setSparks(prev => [spark, ...prev]);
          setIsSparkCreatorOpen(false);
          toast('⚡ Spark posted!');
        }} />

      {/* ── FEED ─────────────────────────────────────── */}
      <div className="flex flex-col pt-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
        ) : posts.map(post => {
          if (post.type === 'suggested_user') return <SuggestedUserCard key={post.id} post={post} />;
          if (post.type === 'pulse_battle')   return <PulseBattleCard   key={post.id} post={post} onVote={() => {}} />;
          if (post.type === 'collab_post')    return <CollabPost         key={post.id} post={post} onLike={handleLike} />;
          if (post.type === 'text')           return (
            <TextPost key={post.id} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={setActiveSharePostId}
              onSave={handleSave} navigate={navigate} />
          );
          if (post.type === 'multi_image')    return (
            <MultiImagePost key={post.id} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={setActiveSharePostId}
              onSave={handleSave} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction} />
          );
          if (post.type === 'video_thumb')    return (
            <VideoThumbPost key={post.id} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={setActiveSharePostId}
              onSave={handleSave} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction} />
          );
          return (
            <ImagePost key={post.id} post={post} onLike={handleLike}
              onComment={setActiveCommentsPostId} onShare={setActiveSharePostId}
              onSave={handleSave} navigate={navigate}
              onPickerDown={handlePickerDown} onPickerUp={handlePickerUp}
              pickerPostId={pickerPostId} triggerReaction={triggerReaction}
              onStoryBehind={setStoryBehindPostId} />
          );
        })}

        {isLoadingMore && (
          <div className="flex flex-col gap-4 pt-2">
            {[0, 1, 2].map(i => <PostSkeleton key={`sk${i}`} />)}
          </div>
        )}
        <div ref={sentinelRef} className="h-4" />
      </div>

      {/* Sheets */}
      <PulseCommentsSheet isOpen={!!activeCommentsPostId} onClose={() => setActiveCommentsPostId(null)}
        currentUser={currentUser} postId={activeCommentsPostId || ''}
        postCommentCount={posts.find(p => p.id === activeCommentsPostId)?.comments || 0}
        onCommentAdded={() => updatePostCount(activeCommentsPostId || '', 'comments', 1)} />
      <PulseShareSheet isOpen={!!activeSharePostId} onClose={() => setActiveSharePostId(null)}
        onShareComplete={(_: any, msg: string) => { toast(msg); updatePostCount(activeSharePostId || '', 'shares', 1); }} />
      <StoryBehindSheet isOpen={!!storyBehindPostId} onClose={() => setStoryBehindPostId(null)}
        post={posts.find(p => p.id === storyBehindPostId)} />

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes livePulse { 0%,100% { opacity:1;transform:scale(1); } 50% { opacity:0.5;transform:scale(1.3); } }
      `}</style>
    </div>
  );
}
