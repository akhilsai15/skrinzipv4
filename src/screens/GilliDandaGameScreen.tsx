import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, Info, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const CANVAS_W = 400;
const CANVAS_H = 600;
const GRAVITY = 800; // pixels per second^2
const GROUND_Y = 480;

type TurnState = 'READY' | 'FLICKED' | 'CHARGING' | 'FLYING' | 'LANDED';

interface GameState {
  gilli: { x: number; y: number; vx: number; vy: number; rotation: number; vrot: number };
  danda: { rotation: number };
  timing: { pos: number; dir: number; speed: number }; // 0 to 1
  power: { val: number; speed: number }; // 0 to 1
  turnState: TurnState;
  distance: number;
  hitRating: 'MISS' | 'GOOD' | 'PERFECT' | '';
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[];
}

export default function GilliDandaGameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  
  const [appPhase, setAppPhase] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [bestDistance, setBestDistance] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [shots, setShots] = useState<number[]>([]);
  
  const [uiState, setUiState] = useState({
    turnState: 'READY' as TurnState,
    power: 0,
    timing: 0,
    distance: 0,
    hitRating: ''
  });

  const engineRef = useRef<GameState>({
    gilli: { x: 150, y: GROUND_Y, vx: 0, vy: 0, rotation: 0, vrot: 0 },
    danda: { rotation: -Math.PI / 4 },
    timing: { pos: 0, dir: 1, speed: 1.5 },
    power: { val: 0, speed: 1.2 },
    turnState: 'READY',
    distance: 0,
    hitRating: '',
    particles: []
  });

  const forceUIRender = useCallback(() => {
    const s = engineRef.current;
    setUiState({
      turnState: s.turnState,
      power: s.power.val,
      timing: s.timing.pos,
      distance: s.distance,
      hitRating: s.hitRating
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('gillidanda_best');
    if (saved) setBestDistance(parseFloat(saved));
  }, []);

  const resetTurn = () => {
    const s = engineRef.current;
    s.gilli = { x: 150, y: GROUND_Y, vx: 0, vy: 0, rotation: 0, vrot: 0 };
    s.danda = { rotation: -Math.PI / 4 };
    s.timing = { pos: 0, dir: 1, speed: 1.5 + Math.random() * 0.5 };
    s.power = { val: 0, speed: 1.5 + Math.random() * 0.5 };
    s.turnState = 'READY';
    s.distance = 0;
    s.hitRating = '';
    s.particles = [];
    forceUIRender();
  };

  const startGame = () => {
    setAppPhase('PLAYING');
    setAttempts(0);
    setShots([]);
    resetTurn();
  };

  const throwParticles = (x: number, y: number, color: string, amount: number) => {
    const s = engineRef.current;
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 50;
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 2
      });
    }
  };

  const updateEngine = (dt: number) => {
    const s = engineRef.current;
    
    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.5;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    if (s.turnState === 'READY') {
      s.gilli.rotation = 0;
    }

    if (s.turnState === 'FLICKED' || s.turnState === 'CHARGING') {
      s.timing.pos += s.timing.dir * s.timing.speed * dt;
      if (s.timing.pos > 1) { s.timing.pos = 1; s.timing.dir = -1; }
      if (s.timing.pos < 0) { s.timing.pos = 0; s.timing.dir = 1; }

      s.gilli.vy += GRAVITY * dt;
      s.gilli.y += s.gilli.vy * dt;
      s.gilli.rotation += s.gilli.vrot * dt;
      
      if (s.turnState === 'CHARGING') {
        s.power.val += s.power.speed * dt;
        if (s.power.val > 1) { 
           s.power.val = 1; 
           s.power.speed = -Math.abs(s.power.speed); 
        } else if (s.power.val < 0) {
           s.power.val = 0;
           s.power.speed = Math.abs(s.power.speed);
        }
      }

      // If lands before hit -> miss
      if (s.gilli.y >= GROUND_Y) {
        s.gilli.y = GROUND_Y;
        s.gilli.vy = 0;
        s.gilli.vrot = 0;
        s.turnState = 'LANDED';
        s.hitRating = 'MISS';
        forceUIRender();
        setTimeout(endAttempt, 1500);
      }
    }

    if (s.turnState === 'FLYING') {
      s.gilli.vy += GRAVITY * dt;
      s.gilli.x += s.gilli.vx * dt;
      s.gilli.y += s.gilli.vy * dt;
      s.gilli.rotation += s.gilli.vrot * dt;

      if (s.gilli.y >= GROUND_Y) {
        s.gilli.y = GROUND_Y;
        s.gilli.vy = -s.gilli.vy * 0.4; // bounce
        s.gilli.vx *= 0.6; // friction
        s.gilli.vrot *= 0.6;
        if (Math.abs(s.gilli.vy) < 40) {
           s.gilli.vy = 0;
           s.gilli.vx = 0;
           s.gilli.vrot = 0;
           s.turnState = 'LANDED';
           forceUIRender();
           setTimeout(endAttempt, 2000);
        }
      }
    }
  };

  const endAttempt = () => {
    const s = engineRef.current;
    const finalDist = s.distance;
    setShots(prev => {
        const newShots = [...prev, finalDist];
        if (newShots.length >= 5) {
            setAppPhase('GAMEOVER');
            const best = Math.max(...newShots);
            const overallBest = Math.max(best, parseFloat(localStorage.getItem('gillidanda_best') || '0'));
            localStorage.setItem('gillidanda_best', overallBest.toString());
            setBestDistance(overallBest);
            if (best > 40) confetti({ particleCount: 150, zIndex: 100 });
        } else {
            resetTurn();
        }
        return newShots;
    });
    setAttempts(a => {
        if(a + 1 < 5) return a + 1;
        return a;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING') return;

    if (s.turnState === 'READY') {
      // Flick up
      s.gilli.vy = -500 - Math.random() * 100;
      s.gilli.vrot = Math.PI * 4 + Math.random() * Math.PI * 4;
      s.turnState = 'FLICKED';
    } else if (s.turnState === 'FLICKED') {
      // Start charging
      s.turnState = 'CHARGING';
      s.power.val = 0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING') return;

    if (s.turnState === 'CHARGING') {
      // Calculate hit
      const timingPos = s.timing.pos;
      // Perfect zone 0.45 to 0.55
      // Good zone 0.35 to 0.65
      let rating: 'MISS' | 'GOOD' | 'PERFECT' = 'MISS';
      if (timingPos >= 0.45 && timingPos <= 0.55) rating = 'PERFECT';
      else if (timingPos >= 0.35 && timingPos <= 0.65) rating = 'GOOD';

      s.hitRating = rating;

      if (rating === 'MISS') {
        s.turnState = 'LANDED';
        s.gilli.vx = 20;
        s.gilli.vy = -100;
        setTimeout(endAttempt, 1500);
      } else {
         s.danda.rotation = Math.PI / 4; // Swing motion
         throwParticles(s.gilli.x, s.gilli.y, '#f59e0b', 20);
         
         const powerMultiplier = rating === 'PERFECT' ? 1.5 : 1.0;
         const baseVX = 300 + (s.power.val * 500);
         const baseVY = -300 - (s.power.val * 400);

         s.gilli.vx = baseVX * powerMultiplier;
         s.gilli.vy = baseVY * (rating === 'PERFECT' ? 1.2 : 1.0);
         s.gilli.vrot = Math.PI * 8;
         s.turnState = 'FLYING';

         // Estimate distance in meters based on horizontal velocity and power
         s.distance = Math.round((s.gilli.vx * 0.05) * (powerMultiplier)); 
      }
      forceUIRender();
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = engineRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    let camX = s.gilli.x - 150;
    if (camX < 0) camX = 0;

    ctx.save();
    ctx.translate(-camX, 0);

    // Sky
    ctx.fillStyle = '#111827';
    ctx.fillRect(camX, 0, CANVAS_W, GROUND_Y);

    // Ground
    ctx.fillStyle = '#1f1610';
    ctx.fillRect(camX, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#322319';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(camX, GROUND_Y);
    ctx.lineTo(camX + CANVAS_W, GROUND_Y);
    ctx.stroke();

    // Distance markers
    const startM = Math.floor(camX / 50);
    for (let i = startM; i < startM + 10; i++) {
       const mx = i * 200;
       ctx.fillStyle = 'rgba(255,255,255,0.2)';
       ctx.fillRect(mx, GROUND_Y, 2, 10);
       ctx.font = '10px Arial';
       ctx.fillStyle = 'rgba(255,255,255,0.4)';
       ctx.fillText(`${i * 10}m`, mx - 10, GROUND_Y + 25);
    }

    // Player Silhouette (only draw if near start)
    if (camX < 300) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(80, GROUND_Y - 120, 30, 120); // body
        ctx.beginPath();
        ctx.arc(95, GROUND_Y - 140, 20, 0, Math.PI * 2); // head
        ctx.fill();

        // Danda (Bat)
        ctx.save();
        ctx.translate(95, GROUND_Y - 80);
        ctx.rotate(s.danda.rotation);
        ctx.fillStyle = '#eab308'; // prominent bat color
        ctx.fillRect(0, -5, 80, 10);
        ctx.restore();
    }

    // Gilli
    ctx.save();
    ctx.translate(s.gilli.x, s.gilli.y);
    ctx.rotate(s.gilli.rotation);
    ctx.fillStyle = '#fbbf24'; 
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(5, -4);
    ctx.lineTo(15, 0);
    ctx.lineTo(5, 4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  };

  const gameLoop = useCallback((time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const dt = Math.min((time - lastTime.current) / 1000, 0.05);
    lastTime.current = time;

    if (appPhase === 'PLAYING') {
      updateEngine(dt);
      const s = engineRef.current;
      if (s.turnState === 'FLICKED' || s.turnState === 'CHARGING') {
         forceUIRender();
      }
    }
    renderCanvas();

    rafId.current = requestAnimationFrame(gameLoop);
  }, [appPhase, forceUIRender]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [gameLoop]);

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden select-none relative">
      <div className="absolute top-4 left-4 z-50">
        <Link to="/games" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
          <X className="w-6 h-6"/>
        </Link>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center min-h-[600px] overflow-hidden"
           onPointerDown={handlePointerDown}
           onPointerUp={handlePointerUp}>
        
        <canvas 
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto max-h-full max-w-sm rounded-3xl shadow-2xl bg-[#111827] border border-white/10 touch-none object-cover"
        />

        {appPhase === 'PLAYING' && (
           <div className="absolute top-0 w-full max-w-sm h-full pointer-events-none p-4 flex flex-col pt-16">
              <div className="flex justify-between items-center mb-8 bg-black/40 p-3 rounded-2xl border border-white/10">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-white/50 uppercase font-black">Attempt</span>
                    <span className="text-xl font-black text-white">{attempts + 1}/5</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-white/50 uppercase font-black">Latest</span>
                    <span className="text-xl font-black text-amber-400">{uiState.distance}m</span>
                 </div>
              </div>

              {(uiState.turnState === 'FLICKED' || uiState.turnState === 'CHARGING') && (
                <div className="w-full mb-8">
                  <div className="text-center text-[10px] uppercase font-bold text-white/60 mb-2">Timing ⚡</div>
                  <div className="bg-white/10 h-6 w-full rounded-full relative border border-white/20 overflow-hidden shadow-inner">
                     <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-blue-500/30"></div>
                     <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-orange-500/60 blur-[2px]"></div>
                     <div className="absolute top-0 bottom-0 left-[48%] right-[48%] bg-orange-400"></div>
                     <div className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]" style={{ left: `${uiState.timing * 100}%`, transform: 'translateX(-50%)' }}></div>
                  </div>
                </div>
              )}

              {uiState.turnState === 'CHARGING' && (
                <div className="w-full">
                  <div className="text-center text-[10px] uppercase font-bold text-orange-400 mb-2">Power 🔋 (Release!)</div>
                  <div className="bg-white/10 h-6 w-full rounded-full relative border border-white/20 overflow-hidden shadow-inner">
                     <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${uiState.power * 100}%` }}></div>
                     {uiState.power > 0.9 && (
                       <div className="absolute top-0 bottom-0 left-0 right-0 bg-red-400/50 animate-pulse"></div>
                     )}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {uiState.hitRating && (
                  <motion.div 
                    key="hit-rating"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-4xl whitespace-nowrap drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] ${
                      uiState.hitRating === 'PERFECT' ? 'text-yellow-400' : 
                      uiState.hitRating === 'GOOD' ? 'text-blue-400' : 'text-red-500'
                    }`}
                  >
                    {uiState.hitRating === 'PERFECT' ? 'PERFECT! 🔥' : 
                     uiState.hitRating === 'GOOD' ? 'GOOD! 👍' : 'MISS! 😅'}
                  </motion.div>
                )}
                
                {uiState.turnState === 'LANDED' && uiState.hitRating !== 'MISS' && (
                   <motion.div 
                      key="distance-rating"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-2/3 left-1/2 -translate-x-1/2 font-black text-3xl text-center bg-black/60 px-6 py-2 rounded-2xl border border-white/10 drop-shadow-lg"
                   >
                     {uiState.distance}m
                     <div className="text-sm font-bold text-amber-400 uppercase mt-1">
                       {uiState.distance >= 55 ? '👑 LEGENDARY!' :
                        uiState.distance >= 40 ? '⚡ Superb!' :
                        uiState.distance >= 25 ? '🔥 Great Shot!' :
                        uiState.distance >= 10 ? '👍 Good Hit!' : '😅 Try Again'}
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>
           </div>
        )}

        <AnimatePresence>
          {appPhase === 'MENU' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-10"
            >
              <div className="max-w-sm w-full">
                <div className="text-center mb-10">
                  <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-orange-600 mb-2 drop-shadow-lg">
                    GILLI DANDA
                  </h1>
                  <p className="text-amber-100/70 font-bold tracking-widest text-[10px] uppercase">Power Timing Challenge</p>
                </div>
                
                <div className="bg-white/5 rounded-3xl p-5 border border-white/10 mb-8 w-full backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-white/60 font-bold uppercase text-xs">Best Distance</span>
                     <span className="text-amber-400 font-black text-xl">{bestDistance}m 👑</span>
                  </div>
                  <div className="text-xs text-white/70 font-bold space-y-4 pt-4 border-t border-white/10">
                     <p className="flex items-start gap-3"><span className="bg-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span> <span><span className="text-white">Tap</span> to softly flick the gilli up into the air.</span></p>
                     <p className="flex items-start gap-3"><span className="bg-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span> <span><span className="text-white">Hold Tap</span> when the timing bar is inside the 🔥 center zone.</span></p>
                     <p className="flex items-start gap-3"><span className="bg-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span> <span>Let power fill up, then <span className="text-white">Release</span> to hit for maximum distance!</span></p>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xl py-5 rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="fill-current w-6 h-6"/> STRIKE NOW
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appPhase === 'GAMEOVER' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 bottom-0 bg-gray-900 rounded-t-[40px] border-t border-x border-white/10 p-8 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-12"
            >
              <div className="text-center mb-6">
                 <h2 className="text-4xl font-black text-white mb-2">Game Over</h2>
                 <p className="text-amber-500/80 font-bold uppercase tracking-widest text-[10px]">5 Attempts Completed</p>
              </div>

              <div className="space-y-2 mb-8 max-w-sm mx-auto">
                {shots.map((dist, i) => (
                   <div key={i} className="flex justify-between items-center bg-black/40 rounded-xl p-3 border border-white/5">
                      <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Shot {i+1}</span>
                      <span className="text-white font-black text-lg">{dist}m</span>
                   </div>
                ))}
              </div>

              <div className="bg-amber-500/10 rounded-3xl p-5 border border-amber-500/20 text-center mb-8 max-w-sm mx-auto">
                 <span className="block text-amber-200/50 text-[10px] font-bold uppercase tracking-widest mb-1">Round Best</span>
                 <span className="text-amber-400 font-black text-5xl">{Math.max(...shots)}m</span>
              </div>

              <button 
                onClick={startGame}
                className="w-full max-w-sm mx-auto bg-white hover:bg-gray-200 text-gray-900 font-black text-xl py-4 rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <RefreshCw className="w-5 h-5"/> PLAY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
