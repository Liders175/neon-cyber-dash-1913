
import React, { useEffect, useRef, useCallback } from 'react';
import { Player, Obstacle, Particle, GameStatus, Difficulty } from '../types';
import { GRAVITY, JUMP_FORCE, DOUBLE_JUMP_FORCE, SPRING_FORCE, LEVEL_UP_THRESHOLD, COLORS, DIFFICULTY_CONFIG, LEVEL_THEMES } from '../constants';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onLifeLost: () => void;
  onBonus: (type: 'LIFE' | 'SCORE') => void;
  onLevelUp: (lvl: number) => void;
  onScoreChange?: (score: number) => void;
  status: GameStatus;
  difficulty: Difficulty;
  level: number;
}

interface Star { x: number; y: number; size: number; speed: number; opacity: number; }
interface SpeedLine { x: number; y: number; length: number; speed: number; opacity: number; }

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onLifeLost, onBonus, onLevelUp, onScoreChange, status, difficulty, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastStatusRef = useRef<GameStatus>(status);
  
  const scoreRef = useRef(0);
  const speedRef = useRef(DIFFICULTY_CONFIG[difficulty].speed);
  const slowDownTimerRef = useRef(0);
  
  const playerRef = useRef<Player>({
    x: 100, y: 0, width: 48, height: 48, dy: 0, jumpForce: JUMP_FORCE, grounded: false, onBlock: false, extraJumps: 1, hasShield: false
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>([]);
  const frameCountRef = useRef(0);
  const invulnFrames = useRef(0);
  const rollRotationRef = useRef(0); 
  
  const themeRef = useRef(LEVEL_THEMES[0]);

  useEffect(() => {
    themeRef.current = LEVEL_THEMES[level % LEVEL_THEMES.length];
  }, [level]);

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    starsRef.current = stars;

    const lines: SpeedLine[] = [];
    for (let i = 0; i < 30; i++) {
      lines.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 15 + 10,
        opacity: Math.random() * 0.3 + 0.1
      });
    }
    speedLinesRef.current = lines;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 15, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y, dx: (Math.random() - 0.5) * 14 * speedMult, dy: (Math.random() - 0.5) * 14 * speedMult,
        size: Math.random() * 4 + 1, color, life: 40
      });
    }
  };

  const performJump = useCallback(() => {
    const p = playerRef.current;
    if (status !== GameStatus.PLAYING) return;

    if (p.grounded || p.onBlock) {
      p.dy = JUMP_FORCE;
      p.grounded = false;
      p.onBlock = false;
      p.extraJumps = 1;
      audioService.playJump();
      spawnParticles(p.x + p.width / 2, p.y + p.height, themeRef.current.player, 15);
    } else if (p.extraJumps > 0) {
      p.dy = DOUBLE_JUMP_FORCE;
      p.extraJumps = 0;
      audioService.playJump();
      spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ffffff', 25);
    }
  }, [status]);

  const resetToSafeState = useCallback((hitLives = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = playerRef.current;
    const groundY = canvas.height - 100;

    if (hitLives) {
      p.y = groundY - p.height;
      p.dy = 0;
      p.grounded = true;
      p.onBlock = false;
      p.extraJumps = 1;
      invulnFrames.current = 120;
      spawnParticles(p.x + p.width/2, p.y + p.height/2, themeRef.current.player, 40);
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => 
      obs.x < p.x - 50 || obs.x > p.x + 800 || ['COLLECTIBLE', 'PLATFORM', 'SHIELD_BONUS'].includes(obs.type)
    );
  }, []);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    speedRef.current = DIFFICULTY_CONFIG[difficulty].speed;
    slowDownTimerRef.current = 0;
    obstaclesRef.current = [];
    particlesRef.current = [];
    frameCountRef.current = 0;
    invulnFrames.current = 0;
    rollRotationRef.current = 0;
    
    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current = {
        x: 100, y: canvas.height - 48 - 100, width: 48, height: 48,
        dy: 0, jumpForce: JUMP_FORCE, grounded: true, onBlock: false, extraJumps: 1, hasShield: false
      };
    }
    if (onScoreChange) onScoreChange(0);
  }, [difficulty, onScoreChange]);

  const update = useCallback((canvas: HTMLCanvasElement) => {
    if (status !== GameStatus.PLAYING) return;

    const p = playerRef.current;
    const config = DIFFICULTY_CONFIG[difficulty];
    const groundY = canvas.height - 100;

    let baseSpeed = config.speed + (level * 0.8);
    let targetSpeed = baseSpeed + (scoreRef.current % LEVEL_UP_THRESHOLD) * 0.0001;
    
    if (slowDownTimerRef.current > 0) {
      targetSpeed *= 0.55;
      slowDownTimerRef.current--;
    }
    
    speedRef.current = speedRef.current * 0.85 + targetSpeed * 0.15;
    scoreRef.current += Math.floor(speedRef.current / 3);
    
    rollRotationRef.current += speedRef.current * 0.07;
    
    if (frameCountRef.current % 10 === 0 && onScoreChange) onScoreChange(scoreRef.current);
    
    const newLvl = Math.floor(scoreRef.current / LEVEL_UP_THRESHOLD);
    if (newLvl > level) onLevelUp(newLvl);

    p.dy += GRAVITY * config.gravityMult;
    p.y += p.dy;

    starsRef.current.forEach(s => { 
      s.x -= speedRef.current * 0.3 * s.speed; 
      s.y += s.speed * 0.5;
      if (s.x < 0) s.x = canvas.width; 
      if (s.y > canvas.height) s.y = 0;
    });

    speedLinesRef.current.forEach(l => { 
      l.x -= (speedRef.current * 1.8 + l.speed); 
      if (l.x + l.length + 100 < 0) { 
        l.x = canvas.width + Math.random() * 800; 
        l.y = Math.random() * canvas.height; 
      } 
    });

    if (invulnFrames.current > 0) invulnFrames.current--;

    frameCountRef.current++;
    if (frameCountRef.current % 45 === 0 && Math.random() < (config.spawnChance + level * 0.005) * 15) {
      const roll = Math.random();
      let type: Obstacle['type'] = 'SPIKE';
      let subType: Obstacle['subType'];
      let y = groundY - 48;
      let h = 48; let w = 48;

      if (roll > 0.96) { // Рідкісний бонус щита
        type = 'SHIELD_BONUS'; subType = Math.random() > 0.5 ? 'TREE' : 'SNOWMAN'; w = 44; h = 55; y = groundY - 55;
      } else if (roll > 0.88) { // Кучугури
        type = 'SNOW_PILE'; w = 100; h = 35; y = groundY - 35;
      } else if (roll > 0.83) { // Пружина
        type = 'SPRING'; w = 60; h = 25; y = groundY - 25;
      } else if (roll > 0.73) { // Прірва
        type = 'HOLE'; w = 240 + (level * 20); y = groundY; h = 100;
      } else if (roll > 0.60) { // Платформа
        type = 'PLATFORM'; w = 400; h = 24; y = groundY - 180 - Math.random() * 80;
      } else if (roll > 0.45) { // Колекційні предмети
        type = 'COLLECTIBLE'; 
        // ЖИТТЯ тепер дуже рідкісне (10% від усіх бонусів)
        const isLife = Math.random() < 0.12; 
        subType = isLife ? 'LIFE' : 'CORE'; 
        w = 36; h = 36; 
        // ЖИТТЯ з'являється ВИЩЕ (важче дістати)
        y = isLife ? groundY - 320 : groundY - 200;
      } else if (roll > 0.32) { // Блок
        type = 'BLOCK'; w = 70; h = 130; y = groundY - 130;
      } else { 
        type = 'SPIKE'; subType = Math.random() > 0.6 ? 'DOUBLE_SPIKE' : undefined; w = subType ? 96 : 48; h = 48; y = groundY - 48;
      }

      const newObs: Obstacle = { id: Date.now() + Math.random(), x: canvas.width, y, width: w, height: h, type, subType };
      
      // Спеціальний кейс для ЖИТТЯ над прірвою
      if (type === 'COLLECTIBLE' && subType === 'LIFE' && Math.random() > 0.5) {
          // Ставимо життя прямо над останньою прірвою або майбутньою (імітація)
          newObs.y = groundY - 180;
      }

      obstaclesRef.current.push(newObs);
    }

    let isTouchingSomething = false;
    let isOverHole = false;

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= speedRef.current;
      const overlapX = (p.x + p.width - 10) > obs.x + 10 && p.x + 10 < obs.x + obs.width - 10;
      const pBottom = p.y + p.height;
      const pTop = p.y;

      if (obs.type === 'HOLE' && (p.x + p.width/2 > obs.x && p.x + p.width/2 < obs.x + obs.width)) isOverHole = true;

      if (obs.type === 'SNOW_PILE' && overlapX && pBottom > obs.y + 5) {
        slowDownTimerRef.current = 40;
        if (frameCountRef.current % 10 === 0) spawnParticles(p.x + p.width/2, pBottom, '#ffffff', 1, 0.4);
      }

      if (obs.type === 'SHIELD_BONUS' && overlapX && pBottom > obs.y && pTop < obs.y + obs.height) {
        p.hasShield = true;
        audioService.playJump();
        spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, COLORS.SHIELD, 25);
        obstaclesRef.current.splice(i, 1);
        continue;
      }

      if (obs.type === 'SPRING' && overlapX && pBottom > obs.y - 15 && p.dy >= 0) {
        p.y = obs.y - p.height; p.dy = SPRING_FORCE; p.extraJumps = 1; p.grounded = false;
        audioService.playJump(); spawnParticles(obs.x + obs.width/2, obs.y, COLORS.SPRING, 30);
        continue;
      }

      if (obs.type === 'COLLECTIBLE' && overlapX && pBottom > obs.y && pTop < obs.y + obs.height) {
        onBonus(obs.subType === 'LIFE' ? 'LIFE' : 'SCORE');
        if (obs.subType === 'CORE') scoreRef.current += 5000;
        audioService.playJump(); spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, obs.subType === 'LIFE' ? COLORS.HEART : COLORS.CRYSTAL, 35);
        obstaclesRef.current.splice(i, 1);
        continue;
      }

      if (obs.type === 'BLOCK' || obs.type === 'PLATFORM') {
        if (p.dy >= 0 && pBottom <= obs.y + 35 && pBottom + p.dy >= obs.y && overlapX) {
          p.y = obs.y - p.height; p.dy = 0; p.grounded = true; p.onBlock = true; p.extraJumps = 1; isTouchingSomething = true;
          continue;
        }
      }

      if (overlapX && (pBottom > obs.y + 15 && pTop < obs.y + obs.height - 15) && invulnFrames.current === 0 && !['HOLE', 'COLLECTIBLE', 'SPRING', 'SHIELD_BONUS', 'SNOW_PILE'].includes(obs.type)) {
        if (p.hasShield) {
          p.hasShield = false;
          invulnFrames.current = 100;
          audioService.playHit();
          spawnParticles(p.x + p.width/2, p.y + p.height/2, COLORS.SHIELD, 50, 2);
          resetToSafeState(false);
        } else {
          audioService.playHit(); onLifeLost(); resetToSafeState(true);
        }
        obstaclesRef.current.splice(i, 1);
        continue;
      }

      if (obs.x + obs.width < -400) obstaclesRef.current.splice(i, 1);
    }

    if (!isTouchingSomething) {
      if (p.y >= groundY - p.height) {
        if (isOverHole) {
          if (p.y > canvas.height + 250) { onLifeLost(); resetToSafeState(true); }
        } else {
          p.y = groundY - p.height; p.dy = 0; p.grounded = true; p.onBlock = false; p.extraJumps = 1;
        }
      } else { p.grounded = false; }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const part = particlesRef.current[i];
      part.x += part.dx; part.y += part.dy; part.life--;
      if (part.life <= 0) particlesRef.current.splice(i, 1);
    }
  }, [status, difficulty, onLifeLost, onBonus, level, onLevelUp, resetToSafeState, onScoreChange]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const currentTheme = themeRef.current;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#020617'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    starsRef.current.forEach(s => { 
      ctx.globalAlpha = s.opacity; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); 
    });
    ctx.globalAlpha = 1.0;

    speedLinesRef.current.forEach(l => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${l.opacity})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.length + speedRef.current * 4, l.y); ctx.stroke();
    });

    const groundY = canvas.height - 100;
    ctx.fillStyle = currentTheme.ground; ctx.fillRect(0, groundY, canvas.width, 100);
    ctx.strokeStyle = currentTheme.player; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

    obstaclesRef.current.forEach(obs => {
      if (obs.type === 'HOLE') { ctx.fillStyle = '#020617'; ctx.fillRect(obs.x, groundY, obs.width, 100); return; }
      ctx.save();
      
      if (obs.type === 'SNOW_PILE') {
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff';
        ctx.beginPath(); ctx.moveTo(obs.x, groundY); ctx.quadraticCurveTo(obs.x + obs.width/2, groundY - obs.height*2, obs.x + obs.width, groundY); ctx.fill();
      } else if (obs.type === 'SHIELD_BONUS') {
        const cx = obs.x + obs.width/2; const cy = obs.y + obs.height/2;
        ctx.shadowBlur = 20; ctx.shadowColor = obs.subType === 'TREE' ? '#16a34a' : '#ffffff';
        if (obs.subType === 'TREE') {
          ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.moveTo(cx, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.lineTo(obs.x, obs.y + obs.height); ctx.fill();
          ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(cx, obs.y, 5, 0, Math.PI*2); ctx.fill();
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath(); ctx.arc(cx, obs.y + 38, 16, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx, obs.y + 18, 11, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(cx, obs.y + 18); ctx.lineTo(cx + 10, obs.y + 20); ctx.lineTo(cx, obs.y + 22); ctx.fill();
        }
      } else if (obs.type === 'SPRING') {
        ctx.fillStyle = COLORS.SPRING; ctx.shadowBlur = 20; ctx.shadowColor = COLORS.SPRING;
        ctx.fillRect(obs.x, obs.y + (Math.sin(Date.now()*0.02)*6), obs.width, obs.height);
      } else if (obs.type === 'COLLECTIBLE') {
        const color = obs.subType === 'LIFE' ? COLORS.HEART : COLORS.CRYSTAL;
        ctx.fillStyle = color; ctx.shadowBlur = 25; ctx.shadowColor = color;
        const bounce = Math.sin(Date.now()*0.007)*12;
        if (obs.subType === 'LIFE') {
            // Малювання пульсуючого серця
            const scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2 + bounce);
            ctx.scale(scale, scale);
            ctx.beginPath();
            ctx.moveTo(0, 8); ctx.bezierCurveTo(-15, -10, -15, -20, 0, -12); ctx.bezierCurveTo(15, -20, 15, -10, 0, 8); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2 + bounce, obs.width/2, 0, Math.PI*2); ctx.fill();
        }
      } else if (obs.type === 'PLATFORM') {
        ctx.fillStyle = currentTheme.secondary; ctx.shadowBlur = 15; ctx.shadowColor = currentTheme.secondary;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === 'SPIKE') {
        ctx.fillStyle = currentTheme.obstacle; ctx.shadowBlur = 20; ctx.shadowColor = currentTheme.obstacle;
        if (obs.subType === 'DOUBLE_SPIKE') {
            for(let k=0; k<2; k++) {
                ctx.beginPath(); ctx.moveTo(obs.x + k*48, obs.y + obs.height);
                ctx.lineTo(obs.x + 24 + k*48, obs.y); ctx.lineTo(obs.x + 48 + k*48, obs.y + obs.height); ctx.fill();
            }
        } else {
            ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width/2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.fill();
        }
      } else { ctx.fillStyle = currentTheme.secondary; ctx.fillRect(obs.x, obs.y, obs.width, obs.height); }
      ctx.restore();
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life / 40; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ГРАВЕЦЬ
    if (invulnFrames.current % 10 < 5) {
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.x + p.width/2, p.y + p.height/2);
      
      // 1. ЩИТ - ВПЕРЕД
      if (p.hasShield) {
        ctx.save();
        ctx.rotate(rollRotationRef.current * 1.6);
        ctx.strokeStyle = COLORS.SHIELD; ctx.lineWidth = 5; ctx.setLineDash([15, 20]);
        ctx.shadowBlur = 30; ctx.shadowColor = COLORS.SHIELD;
        ctx.beginPath(); ctx.arc(0, 0, p.width * 0.8, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // 2. СЕРЕДНЄ КОЛО (Оболонка) - РЕВЕРС (НАЗАД)
      ctx.save();
      ctx.rotate(-rollRotationRef.current); 
      ctx.strokeStyle = currentTheme.player; ctx.lineWidth = 4;
      ctx.shadowBlur = 20; ctx.shadowColor = currentTheme.player;
      ctx.beginPath(); ctx.arc(0, 0, p.width * 0.58, 0, Math.PI * 2); ctx.stroke();
      
      // Зубці механізму
      for(let i=0; i<10; i++) {
        ctx.rotate(Math.PI / 5);
        ctx.beginPath(); ctx.moveTo(p.width * 0.5, 0); ctx.lineTo(p.width * 0.65, 0); ctx.stroke();
      }
      ctx.restore();

      // 3. ЦЕНТРАЛЬНЕ ЯДРО - СТАБІЛЬНЕ + НАХИЛ
      ctx.save();
      const tilt = p.dy * 0.05; // Нахил залежить від швидкості падіння/зльоту
      ctx.rotate(tilt);

      ctx.fillStyle = '#000000'; ctx.shadowBlur = 35; ctx.shadowColor = currentTheme.player;
      ctx.beginPath(); ctx.arc(0, 0, p.width * 0.45, 0, Math.PI * 2); ctx.fill();
      
      ctx.strokeStyle = p.hasShield ? COLORS.SHIELD : '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, p.width * 0.45, 0, Math.PI * 2); ctx.stroke();

      // Лого 1913 - НЕ ОБЕРТАЄТЬСЯ
      ctx.shadowBlur = 0; 
      ctx.font = 'bold 22px "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3b82f6'; ctx.fillText('19', -8, -10);
      ctx.fillStyle = '#facc15'; ctx.fillText('13', 8, 10);
      ctx.restore();
      
      ctx.restore();
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) { if (status === GameStatus.PLAYING) update(canvas); draw(ctx); }
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw, status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && lastStatusRef.current !== GameStatus.PLAYING) resetGame();
    lastStatusRef.current = status;
  }, [status, resetGame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => {
    const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleAction = (e?: any) => { if (status === GameStatus.PLAYING) { if (e?.preventDefault) e.preventDefault(); performJump(); } };
    window.addEventListener('touchstart', handleAction, { passive: false });
    window.addEventListener('mousedown', handleAction);
    const keyHandler = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleAction(); };
    window.addEventListener('keydown', keyHandler);
    return () => { window.removeEventListener('touchstart', handleAction); window.removeEventListener('mousedown', handleAction); window.removeEventListener('keydown', keyHandler); };
  }, [status, performJump]);

  return <canvas ref={canvasRef} className="w-full h-full block touch-none" />;
};

export default GameCanvas;
