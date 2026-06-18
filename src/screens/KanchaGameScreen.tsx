import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Play, Info, RefreshCw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const COURT_W = 400;
const COURT_H = 600;
const MARBLE_R = 12;

function getLevelConfig(lvl: number) {
  const numTargets = Math.min(4 + Math.floor(lvl * 0.8), 40);
  const maxShots = Math.max(5, Math.ceil(numTargets * 0.7) + Math.floor(lvl * 0.2));
  const powerMultiplier = 12 + (lvl * 0.1);
  const maxPower = 3000 + (lvl * 20);
  return { numTargets, maxShots, powerMultiplier, maxPower };
}

type AppPhase = 'MENU' | 'PLAYING' | 'LEVEL_CLEAR' | 'GAMEOVER';

interface Marble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPlayer: boolean;
  active: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx?: number;
  vy?: number;
  path?: { minX: number, maxX: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

function resolveCollision(m1: Marble, m2: Marble): number {
  const dx = m2.x - m1.x;
  const dy = m2.y - m1.y;
  const dist = Math.hypot(dx, dy);
  
  if (dist === 0 || dist >= m1.radius + m2.radius) return 0;

  // Normal
  const nx = dx / dist;
  const ny = dy / dist;

  // Relative velocity
  const dvx = m2.vx - m1.vx;
  const dvy = m2.vy - m1.vy;

  // Velocity along normal
  const velAlongNormal = dvx * nx + dvy * ny;

  if (velAlongNormal > 0) return 0;

  // Restitution (bounciness)
  const e = 0.8; 

  // Impulse scalar
  const j = -(1 + e) * velAlongNormal;
  // Divide by sum of inverted masses (assume equal mass = 1, so 1/1 + 1/1 = 2)
  const impulse = j / 2;

  // Apply impulse
  m1.vx -= impulse * nx;
  m1.vy -= impulse * ny;
  m2.vx += impulse * nx;
  m2.vy += impulse * ny;

  // Positional correction to prevent sinking
  const percent = 0.8;
  const slop = 0.1;
  const penetration = (m1.radius + m2.radius) - dist;
  const correctionMagnitude = Math.max(penetration - slop, 0) / 2 * percent;
  const cx = nx * correctionMagnitude;
  const cy = ny * correctionMagnitude;

  m1.x -= cx;
  m1.y -= cy;
  m2.x += cx;
  m2.y += cy;

  return impulse;
}

function checkObstacleCollision(m: Marble, obs: Obstacle) {
  // Nearest point on rect to circle center
  let testX = m.x;
  let testY = m.y;

  if (m.x < obs.x) testX = obs.x;
  else if (m.x > obs.x + obs.w) testX = obs.x + obs.w;

  if (m.y < obs.y) testY = obs.y;
  else if (m.y > obs.y + obs.h) testY = obs.y + obs.h;

  const dx = m.x - testX;
  const dy = m.y - testY;
  const dist = Math.hypot(dx, dy);

  if (dist < m.radius) {
    // Collision! Determine normal
    const e = 0.8; // Bounciness against walls
    
    // Penetration depth
    const penetration = m.radius - dist;
    
    if (dist === 0) {
       // Deep inside, push out (fallback)
       m.y = obs.y - m.radius;
       m.vy *= -e;
       return;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    // Positional correction
    m.x += nx * penetration;
    m.y += ny * penetration;

    // Velocity reflection
    const dot = m.vx * nx + m.vy * ny;
    if (dot < 0) {
      m.vx -= (1 + e) * dot * nx;
      m.vy -= (1 + e) * dot * ny;
    }
  }
}

export default function KanchaGameScreen() {
  const navigate = useNavigate();

  const [appPhase, setAppPhase] = useState<AppPhase>('MENU');
  const [level, setLevel] = useState(1);
  const [uiState, setUiState] = useState({
    shotsLeft: 5,
    maxShots: 5,
    targetsLeft: 0,
    score: 0,
    levelTimeElapsed: 0,
    isAiming: false
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const engineRef = useRef({
    marbles: [] as Marble[],
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    shake: { magnitude: 0, decay: 0, tx: 0, ty: 0 },
    shotsLeft: 5,
    maxShots: 5,
    powerMultiplier: 12,
    maxPower: 3000,
    score: 0,
    levelStartTime: 0,
    
    // Drag state
    drag: { active: false, startX: 0, startY: 0, currX: 0, currY: 0 },
    
    // Turn state
    turnState: 'IDLE', // IDLE, AIMING, ROLLING
  });

  const lastTime = useRef(performance.now());
  const rafId = useRef(0);

  // Load progress
  useEffect(() => {
    const savedLevel = localStorage.getItem('kancha_max_level');
    if (savedLevel) {
      // Just keep track of max level unlocked if needed. For now, start.
    }
  }, []);

  const forceUIRender = useCallback(() => {
    const s = engineRef.current;
    const targets = s.marbles.filter(m => !m.isPlayer && m.active).length;
    setUiState({
      shotsLeft: s.shotsLeft,
      maxShots: s.maxShots,
      targetsLeft: targets,
      score: s.score,
      levelTimeElapsed: Math.floor((performance.now() - s.levelStartTime) / 1000) || 0,
      isAiming: s.drag.active
    });
  }, []);

  const loadLevel = useCallback((lvl: number) => {
    const s = engineRef.current;
    s.marbles = [];
    s.obstacles = [];
    
    const { numTargets, maxShots, powerMultiplier, maxPower } = getLevelConfig(lvl);
    s.maxShots = maxShots;
    s.shotsLeft = maxShots;
    s.powerMultiplier = powerMultiplier;
    s.maxPower = maxPower;
    s.turnState = 'IDLE';
    s.levelStartTime = performance.now();

    // Player marble
    s.marbles.push({
      id: 'player', x: COURT_W / 2, y: COURT_H - 100, vx: 0, vy: 0,
      radius: MARBLE_R * 1.2, color: '#3b82f6', isPlayer: true, active: true
    });

    const addMarble = (x: number, y: number, color: string) => {
      s.marbles.push({
        id: `m_${s.marbles.length}`, x, y, vx: 0, vy: 0,
        radius: MARBLE_R, color, isPlayer: false, active: true
      });
    };

    const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    if (lvl === 1) {
      for(let i=0; i<numTargets; i++) {
        addMarble(COURT_W/2 + (i - Math.floor(numTargets/2))*30, 200, colors[i%colors.length]);
      }
    } else if (lvl === 2) {
      for(let i=0; i<numTargets; i++) {
        const angle = (i/numTargets) * Math.PI * 2;
        addMarble(COURT_W/2 + Math.cos(angle)*40, 200 + Math.sin(angle)*40, colors[i%colors.length]);
      }
    } else if (lvl === 3) {
      s.obstacles.push({ x: 50, y: 300, w: 100, h: 20 });
      s.obstacles.push({ x: COURT_W - 150, y: 300, w: 100, h: 20 });
      for(let i=0; i<numTargets; i++) {
        addMarble(COURT_W/2 + (i%4 - 1.5)*35, 150 + Math.floor(i/4)*35, colors[i%colors.length]);
      }
    } else {
      const numObstacles = Math.min(Math.floor(lvl / 4), 6);
      for(let i=0; i<numObstacles; i++) {
         const yPos = 250 + Math.random() * 150;
         const w = 40 + Math.random() * 60;
         const xPos = Math.random() * (COURT_W - w);
         
         const isMoving = lvl > 5 && Math.random() > 0.5;
         if (isMoving) {
            s.obstacles.push({ 
              x: xPos, y: yPos, w: w, h: 20, 
              vx: 50 + Math.random() * 50 * (Math.random() > 0.5 ? 1 : -1), 
              path: { minX: 10, maxX: COURT_W - w - 10 } 
            });
         } else {
            s.obstacles.push({ x: xPos, y: yPos, w: w, h: 20 });
         }
      }
      for(let i=0; i<numTargets; i++) {
        const r = Math.random() * 90;
        const th = Math.random() * Math.PI * 2;
        addMarble(COURT_W/2 + Math.cos(th)*r, 150 + Math.sin(th)*r, colors[i%colors.length]);
      }
    }

    setLevel(lvl);
    setAppPhase('PLAYING');
    forceUIRender();
  }, [forceUIRender]);

  const startGame = () => {
    setAppPhase('PLAYING');
    engineRef.current.score = 0;
    loadLevel(1);
  };

  const spawnCollisionParticles = (s: any, x: number, y: number, color1: string, color2: string, strength: number) => {
    const amount = Math.floor(strength * 5) + 5;
    const speed = strength * 60;
    
    // Sparks
    for (let i = 0; i < amount; i++) {
        const th = Math.random() * Math.PI * 2;
        const v = Math.random() * speed + speed * 0.3;
        const maxL = 0.4 + Math.random() * 0.4;
        s.particles.push({
            x, y,
            vx: Math.cos(th) * v, vy: Math.sin(th) * v,
            life: maxL, maxLife: maxL,
            color: Math.random() > 0.5 ? color1 : color2, 
            size: 1 + Math.random() * 3
        });
    }
    // Shockwave
    s.shockwaves.push({
        x, y, radius: 0, maxRadius: Math.max(20, speed * 0.5), life: 0.25, maxLife: 0.25, color: '#ffffff'
    });
  };

  const spawnParticles = (s: any, x: number, y: number, color: string, amount: number, speed: number) => {
    for (let i = 0; i < amount; i++) {
        const th = Math.random() * Math.PI * 2;
        const v = Math.random() * speed + speed * 0.2;
        const maxL = 0.5 + Math.random() * 0.5;
        s.particles.push({
            x, y,
            vx: Math.cos(th) * v, vy: Math.sin(th) * v,
            life: maxL, maxLife: maxL,
            color: Math.random() > 0.5 ? color : '#ffffff', 
            size: 1 + Math.random() * 4
        });
    }
    s.shockwaves.push({
        x, y, radius: 0, maxRadius: speed * 0.8, life: 0.3, maxLife: 0.3, color
    });
  };

  const updateEngine = useCallback((dt: number) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING') return;

    let anyMoving = false;
    const SEC = dt / 1000;

    // Move obstacles
    s.obstacles.forEach(obs => {
      if (obs.vx && obs.path) {
         obs.x += obs.vx * SEC;
         if (obs.x < obs.path.minX) {
            obs.x = obs.path.minX;
            obs.vx *= -1;
         } else if (obs.x > obs.path.maxX) {
            obs.x = obs.path.maxX;
            obs.vx *= -1;
         }
      }
    });

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * SEC;
      p.y += p.vy * SEC;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= SEC;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // Shockwaves
    for (let i = s.shockwaves.length - 1; i >= 0; i--) {
       const sw = s.shockwaves[i];
       sw.radius += sw.maxRadius * SEC * 3;
       sw.life -= SEC;
       if (sw.life <= 0) s.shockwaves.splice(i, 1);
    }

    // Shake decay
    if (s.shake.magnitude > 0) {
       s.shake.magnitude -= s.shake.decay * SEC;
       if (s.shake.magnitude < 0) s.shake.magnitude = 0;
       s.shake.tx = (Math.random() - 0.5) * s.shake.magnitude * 2;
       s.shake.ty = (Math.random() - 0.5) * s.shake.magnitude * 2;
    } else {
       s.shake.tx = 0;
       s.shake.ty = 0;
    }

    // Physics
    for (let i = 0; i < s.marbles.length; i++) {
      const m = s.marbles[i];
      if (!m.active) continue;

      if (Math.abs(m.vx) > 0.5 || Math.abs(m.vy) > 0.5) {
        anyMoving = true;
        m.x += m.vx * SEC;
        m.y += m.vy * SEC;

        // Friction
        const friction = 0.98; 
        m.vx *= friction;
        m.vy *= friction;

        if (Math.abs(m.vx) < 5 && Math.abs(m.vy) < 5) {
           m.vx = 0; m.vy = 0;
        }

        if (!m.isPlayer) {
          // Target marble is scored if knocked entirely out of the central circle
          const distToCenter = Math.hypot(m.x - COURT_W/2, m.y - 200);
          if (distToCenter > 110 + m.radius) {
             m.active = false;
             s.score += 50;
             spawnParticles(s, m.x, m.y, m.color, 40, 250);
             forceUIRender();
          }
        } else {
          // Player marble bounds checking
          if (m.x < -m.radius || m.x > COURT_W + m.radius || m.y < -m.radius || m.y > COURT_H + m.radius) {
            m.active = false;
            m.vx = 0; m.vy = 0;
          }
        }
      }
    }

    // Collisions (Marble to Marble)
    for (let i = 0; i < s.marbles.length; i++) {
      if (!s.marbles[i].active) continue;
      for (let j = i + 1; j < s.marbles.length; j++) {
        if (!s.marbles[j].active) continue;
        const impulse = resolveCollision(s.marbles[i], s.marbles[j]);
        if (impulse > 100) {
           const strength = Math.min(impulse / 100, 5);
           s.shake.magnitude = Math.max(s.shake.magnitude, strength);
           s.shake.decay = 15;
           const midX = (s.marbles[i].x + s.marbles[j].x)/2;
           const midY = (s.marbles[i].y + s.marbles[j].y)/2;
           spawnCollisionParticles(s, midX, midY, s.marbles[i].color, s.marbles[j].color, strength);
           navigator.vibrate?.(Math.min(impulse / 5, 20));
        }
      }
    }

    // Collisions (Marble to Obstacle)
    for (let i = 0; i < s.marbles.length; i++) {
       if (!s.marbles[i].active) continue;
       for (const obs of s.obstacles) {
           checkObstacleCollision(s.marbles[i], obs);
       }
    }

    // State transitions
    if (s.turnState === 'ROLLING' && !anyMoving) {
      s.turnState = 'IDLE';
      
      const playerMarble = s.marbles.find(m => m.isPlayer);
      if (playerMarble) {
         playerMarble.x = COURT_W / 2;
         playerMarble.y = COURT_H - 100;
         playerMarble.vx = 0;
         playerMarble.vy = 0;
         if (s.shotsLeft > 0) playerMarble.active = true;
      }

      const targets = s.marbles.filter(m => !m.isPlayer && m.active).length;
      forceUIRender();

      if (targets === 0) {
         // Calculate bonus
         const timeTaken = Math.max(1, Math.floor((performance.now() - s.levelStartTime) / 1000));
         const timeBonus = Math.max(0, (60 - timeTaken) * 10);
         const shotsBonus = s.shotsLeft * 100;
         s.score += timeBonus + shotsBonus;
         forceUIRender();

         setAppPhase('LEVEL_CLEAR');
         confetti({ particleCount: 150, zIndex: 100 });
         let maxLvl = parseInt(localStorage.getItem('kancha_max_level') || '1');
         maxLvl = Math.max(maxLvl, level + 1);
         localStorage.setItem('kancha_max_level', maxLvl.toString());
      } else if (s.shotsLeft <= 0) {
         setAppPhase('GAMEOVER');
      }
    }

  }, [appPhase, forceUIRender, level]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const s = engineRef.current;

    ctx.save();
    // Screen shake
    ctx.translate(s.shake.tx, s.shake.ty);

    // BG (Premium Dusty Ground)
    const bgGrad = ctx.createRadialGradient(COURT_W/2, COURT_H/2, 50, COURT_W/2, COURT_H/2, COURT_H);
    bgGrad.addColorStop(0, '#e8c99b');
    bgGrad.addColorStop(1, '#a67d4f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, COURT_W, COURT_H);
    
    // Noise/Dust
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for(let i=0; i<150; i++) {
       ctx.beginPath();
       ctx.arc(Math.random()*COURT_W, Math.random()*COURT_H, Math.random()*2+0.5, 0, Math.PI*2);
       ctx.fill();
    }

    // Play area borders (visual only, open boundaries)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(10, 10, COURT_W-20, COURT_H-20);
    ctx.setLineDash([]);

    // Draw Target Circle (The "Ring")
    ctx.beginPath();
    ctx.arc(COURT_W/2, 200, 110, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw Start Area
    ctx.beginPath();
    ctx.arc(COURT_W/2, COURT_H - 100, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Start text label
    if (s.turnState === 'IDLE' && s.shotsLeft > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STARTING POINT', COURT_W/2, COURT_H - 55);
    }

    // Obstacles
    s.obstacles.forEach(obs => {
      ctx.fillStyle = '#78350f'; // Dark wood
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = '#451a03';
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      
      // Wood grain
      ctx.beginPath();
      ctx.moveTo(obs.x + 10, obs.y + 5);
      ctx.lineTo(obs.x + obs.w - 10, obs.y + 5);
      ctx.moveTo(obs.x + 5, obs.y + 15);
      ctx.lineTo(obs.x + obs.w - 5, obs.y + 15);
      ctx.strokeStyle = '#92400e';
      ctx.stroke();
    });

    // Trajectory Aiming Line
    if (s.drag.active && s.turnState === 'AIMING') {
       const pm = s.marbles.find(m => m.isPlayer);
       if (pm) {
          const dx = s.drag.startX - s.drag.currX;
          const dy = s.drag.startY - s.drag.currY;
          const power = Math.min(Math.hypot(dx, dy) * s.powerMultiplier, s.maxPower);
          const angle = Math.atan2(dy, dx);
          const drawLen = power / 5;
          const numDots = Math.floor(drawLen / 15);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          const timeOffset = (performance.now() / 300) % 1;
          for (let i = 1; i <= numDots; i++) {
             const t = (i + timeOffset) / numDots;
             if (t > 1) continue;
             const dotX = pm.x + Math.cos(angle) * (drawLen * t);
             const dotY = pm.y + Math.sin(angle) * (drawLen * t);
             ctx.beginPath();
             ctx.arc(dotX, dotY, 3 * (1 - t * 0.5), 0, Math.PI * 2);
             ctx.fill();
          }
       }
    }

    // Marbles
    s.marbles.forEach(m => {
      if (!m.active) return;
      
      // Soft drop shadow
      ctx.beginPath();
      ctx.arc(m.x + 4, m.y + 6, m.radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Base color
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      
      // Primary 3D depth and highlight grad
      const grad = ctx.createRadialGradient(
        m.x - m.radius * 0.35, 
        m.y - m.radius * 0.35, 
        m.radius * 0.1, 
        m.x, 
        m.y, 
        m.radius * 1.1
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Core highlight glint
      grad.addColorStop(0.15, 'rgba(255, 255, 255, 0.5)'); // Spread
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0)');   // Transparent middle
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');       // Shadow start
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');        // Deep outer shadow
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Secondary bounce light from opposite side
      const bounceGrad = ctx.createRadialGradient(
        m.x + m.radius * 0.4, 
        m.y + m.radius * 0.4, 
        0, 
        m.x, 
        m.y, 
        m.radius
      );
      bounceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      bounceGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = bounceGrad;
      ctx.fill();
      
      if (m.isPlayer) {
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 2;
         ctx.stroke();
         // A subtle glowing aura for the player marble
         ctx.beginPath();
         ctx.arc(m.x, m.y, m.radius + 3, 0, Math.PI * 2);
         ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
         ctx.lineWidth = 1;
         ctx.stroke();
      }
    });

    // Shockwaves
    ctx.globalCompositeOperation = 'lighter';
    s.shockwaves.forEach(sw => {
       ctx.beginPath();
       ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
       ctx.strokeStyle = sw.color;
       ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife);
       ctx.lineWidth = 4 * Math.max(0, sw.life / sw.maxLife);
       ctx.stroke();
    });
    ctx.globalAlpha = 1.0;

    // Particles
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    s.particles.forEach(p => {
       ctx.beginPath();
       ctx.moveTo(p.x, p.y);
       ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
       ctx.strokeStyle = p.color;
       ctx.lineWidth = p.size * Math.max(0, p.life/p.maxLife);
       ctx.globalAlpha = Math.max(0, p.life/p.maxLife);
       ctx.stroke();
    });
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }, []);

  const gameLoop = useCallback((time: number) => {
    const dt = time - lastTime.current;
    lastTime.current = time;
    
    updateEngine(dt);
    renderCanvas();
    
    const currentElapsed = Math.floor((performance.now() - engineRef.current.levelStartTime) / 1000);
    if (currentElapsed > uiState.levelTimeElapsed && appPhase === 'PLAYING') {
      forceUIRender();
    }
    
    rafId.current = requestAnimationFrame(gameLoop);
  }, [updateEngine, renderCanvas, appPhase, uiState.levelTimeElapsed, forceUIRender]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [gameLoop]);

  // Input Handling
  const handlePointerDown = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (appPhase !== 'PLAYING' || s.turnState !== 'IDLE' || s.shotsLeft <= 0) return;

    const pm = s.marbles.find(m => m.isPlayer);
    if (!pm || !pm.active) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (COURT_W / rect.width);
    const y = (e.clientY - rect.top) * (COURT_H / rect.height);
    
    // Check if clicked near player marble
    if (Math.hypot(x - pm.x, y - pm.y) < pm.radius * 3) {
       s.turnState = 'AIMING';
       s.drag = { active: true, startX: x, startY: y, currX: x, currY: y };
       forceUIRender();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = engineRef.current;
    if (s.turnState === 'AIMING' && s.drag.active) {
      const rect = canvasRef.current!.getBoundingClientRect();
      s.drag.currX = (e.clientX - rect.left) * (COURT_W / rect.width);
      s.drag.currY = (e.clientY - rect.top) * (COURT_H / rect.height);
    }
  };

  const handlePointerUp = () => {
    const s = engineRef.current;
    if (s.turnState === 'AIMING' && s.drag.active) {
      const pm = s.marbles.find(m => m.isPlayer);
      if (pm) {
         const dx = s.drag.startX - s.drag.currX;
         const dy = s.drag.startY - s.drag.currY;
         const dist = Math.hypot(dx, dy);
         
         if (dist > 10) {
            // Shoot
            const power = Math.min(dist * s.powerMultiplier, s.maxPower);
            const angle = Math.atan2(dy, dx);
            pm.vx = Math.cos(angle) * power;
            pm.vy = Math.sin(angle) * power;
            
            s.shotsLeft -= 1;
            s.turnState = 'ROLLING';
            navigator.vibrate?.([20]);
         } else {
            s.turnState = 'IDLE'; // Cancel shot if too short
         }
      }
      s.drag.active = false;
      forceUIRender();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white font-sans overflow-hidden select-none">
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/5 relative z-20 shrink-0">
        <button onClick={() => {
          if (appPhase !== 'MENU') {
            setAppPhase('MENU');
          } else navigate(-1);
        }} className="p-2 -ml-2 text-white/70 hover:text-white transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-black text-xl tracking-widest text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)] uppercase">
          Kancha
        </div>
        <button className="p-2 -mr-2 text-white/70 hover:text-white transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 w-full relative z-10 flex flex-col items-center justify-center p-2">
        
        {/* === MENU === */}
        {appPhase === 'MENU' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full max-w-sm px-6 items-center">
            <div className="w-40 h-40 bg-orange-950 rounded-full border-8 border-orange-800 flex items-center justify-center mb-8 relative shadow-2xl">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-20 rounded-full" />
               <div className="w-16 h-16 rounded-full bg-blue-500 shadow-xl border-2 border-white/50 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-white/60" />
               </div>
            </div>
            
            <h1 className="text-4xl font-black mb-8 tracking-tight text-white/90">Aim & Shoot!</h1>

            <button 
              onClick={startGame}
              className="w-full bg-gradient-to-tr from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white py-5 rounded-3xl font-black text-xl shadow-[0_10px_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Play className="w-6 h-6 fill-current"/> PLAY NOW
            </button>
            
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-white/70 text-sm w-full">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Rules</h4>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong className="text-orange-300">Drag</strong> your blue marble to aim.</li>
                <li><strong className="text-orange-300">Release</strong> to shoot and hit the other marbles.</li>
                <li>Knock target marbles <strong className="text-orange-300">off the board</strong> to score.</li>
                <li>Clear all target marbles before running out of <strong className="text-blue-300">shots</strong>.</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* === PLAYING === */}
        <div className={`flex flex-col w-full h-full max-w-sm ${appPhase === 'PLAYING' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
          <div className="flex justify-between items-center px-4 py-2 bg-black/40 rounded-t-3xl border-t border-x border-white/10 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Level </span>
              <span className="text-lg font-black text-orange-400">{level}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Score </span>
              <span className="text-lg font-black text-yellow-400">{uiState.score}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Time </span>
              <span className="text-lg font-black text-gray-200">{uiState.levelTimeElapsed}s</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Targets</span>
              <span className="text-lg font-black">{uiState.targetsLeft}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Shots</span>
              <span className={`text-lg font-black ${uiState.shotsLeft <= 1 ? 'text-red-400' : 'text-blue-400'}`}>
                {uiState.shotsLeft}/{uiState.maxShots}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden touch-none">
             <canvas 
               ref={canvasRef}
               width={COURT_W}
               height={COURT_H}
               className="w-full h-auto max-h-full rounded-b-3xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border-x border-b border-white/20 touch-none object-contain"
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
               onPointerLeave={handlePointerUp}
             />
             
             {uiState.isAiming && (
                <div className="absolute top-4 left-0 right-0 text-center font-bold text-sm text-white/70 animate-pulse pointer-events-none">
                  Release to Shoot!
                </div>
             )}
          </div>
        </div>

        {/* === LEVEL CLEAR === */}
        <AnimatePresence>
          {appPhase === 'LEVEL_CLEAR' && (
             <motion.div 
               key="level-clear"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
             >
               <div className="bg-gradient-to-b from-orange-900 to-amber-900 border border-orange-500/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                 <Trophy className="w-20 h-20 mx-auto text-amber-400 mb-4" />
                 <h2 className="text-4xl font-black text-white mb-2">Level {level} Cleared!</h2>
                 <p className="text-orange-200 mb-2 font-bold">Awesome aiming.</p>
                 <div className="bg-black/30 rounded-xl p-4 mb-8">
                   <p className="text-sm text-amber-200/70 font-bold uppercase tracking-wider mb-1">Total Score</p>
                   <p className="text-4xl font-black text-yellow-400">{uiState.score}</p>
                 </div>
                 <button 
                   onClick={() => loadLevel(level + 1)}
                   className="w-full bg-white text-orange-900 py-4 rounded-full font-black text-xl active:scale-95 transition-transform shadow-xl"
                 >
                   Next Level
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* === GAME OVER === */}
        <AnimatePresence>
          {appPhase === 'GAMEOVER' && (
             <motion.div 
               key="game-over"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
             >
               <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center">
                 <div className="text-6xl mb-4">💔</div>
                 <h2 className="text-3xl font-black text-white mb-2">Out of Shots!</h2>
                 <p className="text-white/60 mb-2">You couldn't clear all targets.</p>
                 <div className="bg-black/50 rounded-xl p-4 mb-8">
                   <p className="text-sm text-white/50 font-bold uppercase tracking-wider mb-1">Final Score</p>
                   <p className="text-4xl font-black text-white">{uiState.score}</p>
                 </div>
                 <button 
                   onClick={() => loadLevel(level)}
                   className="w-full bg-blue-600 text-white py-4 rounded-full font-black text-lg active:scale-95 transition-transform mb-3 flex justify-center items-center gap-2"
                 >
                   <RefreshCw className="w-5 h-5"/> Retry Level {level}
                 </button>
                 <button 
                   onClick={() => setAppPhase('MENU')}
                   className="w-full bg-transparent border border-white/20 text-white/70 py-4 rounded-full font-bold active:scale-95 transition-colors"
                 >
                   Main Menu
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
