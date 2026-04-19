
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus, GameState, Difficulty } from './types';
import { TRANSLATIONS, LEVEL_UP_THRESHOLD } from './constants';
import { getAICoachingMessage } from './services/geminiService';
import { audioService } from './services/audioService';

declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#020617');
      tg.setBackgroundColor('#020617');
      tg.enableClosingConfirmation();
    }
  }, []);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: parseInt(localStorage.getItem('neonHighScore') || '0'),
    status: GameStatus.MENU,
    aiCoachMessage: '',
    lives: 3,
    difficulty: Difficulty.NORMAL,
    isMuted: false,
    lang: 'uk',
    level: 0,
    crystalsCollected: 0
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [internalScore, setInternalScore] = useState(0);

  const t = useMemo(() => TRANSLATIONS[gameState.lang], [gameState.lang]);

  const levelProgress = useMemo(() => {
    return Math.min(100, ((internalScore % LEVEL_UP_THRESHOLD) / LEVEL_UP_THRESHOLD) * 100);
  }, [internalScore]);

  const startGame = async () => {
    try {
      await audioService.init();
      audioService.startMusic();
    } catch (e) {
      console.warn("Помилка ініціалізації звуку:", e);
    }
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    setGameState(prev => ({ 
      ...prev, 
      status: GameStatus.PLAYING, 
      score: 0, 
      lives: 3, 
      level: 0, 
      crystalsCollected: 0 
    }));
    setInternalScore(0);
  };

  const handleLifeLost = useCallback(() => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        const finalScore = Math.floor(prev.score / 10);
        if (finalScore > prev.highScore) localStorage.setItem('neonHighScore', finalScore.toString());
        getAICoachingMessage(prev.score).then(msg => setGameState(s => ({ ...s, aiCoachMessage: msg })));
        audioService.stopMusic();
        return { ...prev, lives: 0, status: GameStatus.GAMEOVER, score: finalScore, highScore: Math.max(finalScore, prev.highScore) };
      }
      return { ...prev, lives: newLives };
    });
  }, []);

  const handleBonus = useCallback((type: 'LIFE' | 'SCORE') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    setGameState(prev => ({
      ...prev,
      lives: type === 'LIFE' ? Math.min(prev.lives + 1, 5) : prev.lives,
      score: type === 'SCORE' ? prev.score + 5000 : prev.score,
      crystalsCollected: type === 'SCORE' ? prev.crystalsCollected + 1 : prev.crystalsCollected
    }));
    if (type === 'SCORE') {
      setInternalScore(curr => curr + 5000);
    }
  }, []);

  const handleLevelUp = useCallback((lvl: number) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setGameState(prev => ({ ...prev, level: lvl }));
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 2000);
  }, []);

  const handleScoreUpdate = useCallback((s: number) => {
    setInternalScore(s);
    setGameState(prev => ({ ...prev, score: s }));
  }, []);

  return (
    <div className="relative w-full h-screen flex flex-col bg-slate-950 text-white select-none overflow-hidden font-sans">
      
      <div className="absolute top-0 left-0 w-full z-40 p-4 pt-8 flex flex-col pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1.5 pointer-events-auto items-center">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className={`w-4 h-4 rounded-sm transition-all duration-300 ${i < gameState.lives ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-slate-800'}`}></div>
               ))}
            </div>
            
            <div className="flex items-center gap-2 mt-1 pointer-events-auto bg-black/40 px-2 py-1 rounded-lg border border-white/5 w-fit">
              <span className="text-cyan-400 text-sm drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">💎</span>
              <span className="text-sm font-mono font-black text-white">{gameState.crystalsCollected}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button onClick={() => {
              const newMuted = !gameState.isMuted;
              audioService.setMuted(newMuted);
              setGameState(s => ({...s, isMuted: newMuted}));
            }} className="pointer-events-auto bg-slate-900/60 p-2 rounded-lg text-xl border border-white/5 backdrop-blur-sm active:scale-90 transition-transform">
               {gameState.isMuted ? '🔇' : '🔊'}
            </button>
            <div className="text-right">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t.score}</div>
               <div className="text-2xl font-mono font-black leading-none">{Math.floor(gameState.score / 10)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full max-w-[200px] pointer-events-auto">
          <div className="flex justify-between items-end mb-1">
            <div className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">
              {t.level} {gameState.level + 1}
            </div>
            <div className="text-[8px] font-mono text-slate-400">
              {Math.floor(levelProgress)}%
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <GameCanvas 
        status={gameState.status} 
        difficulty={gameState.difficulty}
        level={gameState.level}
        onGameOver={() => {}} 
        onLifeLost={handleLifeLost}
        onBonus={handleBonus}
        onLevelUp={handleLevelUp}
        onScoreChange={handleScoreUpdate}
      />

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="animate-bounce-slow flex flex-col items-center">
            <h2 className="text-5xl font-black italic tracking-tighter text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] uppercase">
              {t.levelUp}
            </h2>
            <p className="text-xl font-bold text-white uppercase tracking-widest mt-2">
              {t.level} {gameState.level + 1}
            </p>
          </div>
        </div>
      )}

      {gameState.status === GameStatus.MENU && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center transition-all">
          <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 mb-12 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase">
            {t.title}
          </h1>
          
          <div className="w-full max-w-xs space-y-6">
            <button 
              onClick={startGame}
              className="w-full bg-white text-slate-950 font-black py-6 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all text-2xl uppercase italic tracking-widest"
            >
              {t.play}
            </button>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/50 rounded-xl border border-white/5">
                {[Difficulty.EASY, Difficulty.NORMAL, Difficulty.HARD].map(d => (
                  <button key={d} onClick={() => setGameState(s => ({...s, difficulty: d}))} className={`py-2 text-[8px] font-bold rounded-lg transition-all ${gameState.difficulty === d ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {t[d.toLowerCase() as keyof typeof t]}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {gameState.status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
          <h2 className="text-2xl font-black text-rose-500 mb-1 uppercase tracking-tighter">{t.gameOver}</h2>
          <div className="text-7xl font-mono font-black text-white mb-8 tracking-tighter drop-shadow-lg">{gameState.score}</div>
          
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-white/10 mb-10 max-w-sm shadow-2xl relative">
             <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-black">{t.coach}</div>
             <div className="text-lg italic text-cyan-300 leading-tight">"{gameState.aiCoachMessage || '...'}"</div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={startGame} className="bg-cyan-500 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 uppercase shadow-xl transition-transform text-lg">
              {t.retry}
            </button>
            <button onClick={() => setGameState(s => ({...s, status: GameStatus.MENU}))} className="text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest py-4 transition-colors">
              {t.menu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
