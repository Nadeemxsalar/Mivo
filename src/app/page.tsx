// src/app/page.tsx
'use client';
import React, { useState, memo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import LudoBoard from './components/LudoBoard';
import { Color } from '../types/game';

// 1. PERFECT 3x3 MATRIX DICE FACE (Gap & Overlap Fix for Mobile/Laptop)
const DiceFace = memo(({ value }: { value: number }) => {
  const Dot = () => <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 lg:w-3.5 lg:h-3.5 bg-slate-950 rounded-full shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" />;
  
  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2.5 lg:p-3 gap-0.5 sm:gap-1 lg:gap-2 place-items-center justify-items-center items-center select-none pointer-events-none">
      {(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      <div />
      {(value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      {(value === 6) ? <Dot /> : <div />}
      {(value === 1 || value === 3 || value === 5) ? <Dot /> : <div />}
      {(value === 6) ? <Dot /> : <div />}
      {(value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      <div />
      {(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
    </div>
  );
});
DiceFace.displayName = 'DiceFace';

// 2. PREMIUM PLAYER BOX (Solid 3D Block Roll with Memory Optimization)
const PlayerBox = memo(({ color, name }: { color: Color, name: string }) => {
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);
  const rollDice = useGameStore((state: any) => state.rollDice);
  const hasRolled = useGameStore((state: any) => state.hasRolled);
  const isAnimating = useGameStore((state: any) => state.isAnimating);
  const activeColors = useGameStore((state: any) => state.activeColors);
  const isRobotMode = useGameStore((state: any) => state.isRobotMode);
  const isFastMode = useGameStore((state: any) => state.isFastMode);

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(6);
  
  const clickLockRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!activeColors?.includes(color)) return <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 opacity-0 pointer-events-none" />;

  const isActive = currentPlayerTurn === color;

  useEffect(() => {
    if (isActive && diceValue !== null && !isRolling) setDisplayValue(diceValue);
  }, [diceValue, isActive, isRolling]);

  // CPU Optimization: Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRollClick = useCallback(() => {
    if (!isActive || isRolling || hasRolled || isAnimating || clickLockRef.current) return; 
    clickLockRef.current = true;
    setIsRolling(true);
    
    const speed = isFastMode ? 40 : 70;
    const duration = isFastMode ? 250 : 500;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplayValue(prev => {
        let next = Math.floor(Math.random() * 6) + 1;
        while(next === prev) next = Math.floor(Math.random() * 6) + 1; 
        return next;
      });
    }, speed);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      rollDice(); 
      setIsRolling(false);
      clickLockRef.current = false;
    }, duration); 
  }, [isActive, isRolling, hasRolled, isAnimating, isFastMode, rollDice]);

  useEffect(() => {
    if (isRobotMode && isActive && color !== 'yellow' && !hasRolled && !isAnimating && !isRolling) {
      const timer = setTimeout(() => handleRollClick(), isFastMode ? 400 : 800); 
      return () => clearTimeout(timer);
    }
  }, [isRobotMode, isActive, color, hasRolled, isAnimating, isRolling, isFastMode, handleRollClick]);

  const finalDiceValue = isRolling ? displayValue : (diceValue !== null ? diceValue : displayValue);

  const colorStyles: Record<Color, { bg: string, ring: string }> = {
    red: { bg: 'bg-gradient-to-br from-[#ff5252] to-[#b71c1c]', ring: 'ring-red-500/80' },
    green: { bg: 'bg-gradient-to-br from-[#69f0ae] to-[#1b5e20]', ring: 'ring-green-500/80' },
    blue: { bg: 'bg-gradient-to-br from-[#448aff] to-[#0d47a1]', ring: 'ring-blue-500/80' },
    yellow: { bg: 'bg-gradient-to-br from-[#ffe57f] to-[#f57f17]', ring: 'ring-yellow-400/80' }
  };
  const currentStyle = colorStyles[color];

  const rollVariants: Variants = {
    idle: { rotate: 0, y: 0, scale: 1 },
    rolling: {
      rotate: [0, -15, 20, -15, 10, -5, 0], y: [0, -25, -45, -20, -10, 0], scale: [1, 1.2, 1.35, 1.15, 1.05, 1], 
      transition: { duration: isFastMode ? 0.25 : 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 transform-gpu ${isActive ? `scale-105 opacity-100 z-30` : 'scale-95 opacity-80 grayscale-[10%]'}`}>
      <div className={`px-2 py-0.5 lg:px-5 lg:py-1.5 rounded-full text-white text-[9px] sm:text-xs lg:text-sm font-black tracking-widest uppercase border border-white/20 shadow-lg whitespace-nowrap ${isActive ? currentStyle.bg : 'bg-slate-800'}`}>
        {name} {isRobotMode && color !== 'yellow' ? '🤖' : ''}
      </div>
      
      <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-slate-900 border-[3px] lg:border-4 border-white/10 rounded-xl lg:rounded-3xl shadow-inner flex items-center justify-center relative transition-all duration-300 overflow-visible ${isActive ? `ring-2 lg:ring-4 ${currentStyle.ring}` : ''}`}>
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div key="active-dice" variants={rollVariants} initial="idle" animate={isRolling ? "rolling" : "idle"} className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 absolute z-20" style={{ transformStyle: "preserve-3d" }}>
              <button 
                onClick={handleRollClick}
                disabled={!isActive || isRolling || hasRolled || isAnimating || (isRobotMode && color !== 'yellow')}
                className={`relative w-full h-full bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-lg lg:rounded-xl shadow-[-4px_6px_10px_rgba(0,0,0,0.6)] border-b-[5px] lg:border-b-[8px] border-r-[3px] lg:border-r-[5px] border-gray-400 flex items-center justify-center transition-all z-10 transform-gpu will-change-transform ${(!hasRolled && !isAnimating && !(isRobotMode && color !== 'yellow')) ? 'cursor-pointer hover:-translate-y-1 hover:border-b-[6px] lg:hover:border-b-[10px] hover:shadow-[-4px_8px_15px_rgba(0,0,0,0.5)] active:translate-y-2 active:border-b-[2px] active:border-r-[2px] active:shadow-none' : 'cursor-default opacity-95'}`}
              >
                <div className={`w-full h-full flex items-center justify-center transition-all ${isRolling ? 'blur-[1px] scale-90 opacity-80' : 'scale-100'}`}>
                  <DiceFace value={finalDiceValue} />
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div key="inactive-dot" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className={`w-5 h-5 lg:w-10 lg:h-10 rounded-full border border-white/50 shadow-inner ${currentStyle.bg} flex items-center justify-center absolute`} />
          )}
        </AnimatePresence>
        {isActive && <div className="absolute inset-0 bg-white/5 animate-pulse rounded-xl pointer-events-none" />}
      </div>
    </div>
  );
});
PlayerBox.displayName = 'PlayerBox';

// 3. SETTINGS MODAL WIDGET
const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const setPreferences = useGameStore((state: any) => state.setPreferences);
  const animationType = useGameStore((state: any) => state.animationType);
  const isFastMode = useGameStore((state: any) => state.isFastMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-sm flex flex-col gap-6 transform-gpu will-change-transform">
        <h2 className="text-2xl font-black text-white tracking-widest text-center border-b border-slate-700/50 pb-4">⚙️ SETTINGS</h2>
        
        {/* Token Animation Toggle */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] text-center">TOKEN ANIMATION</label>
          <div className="flex gap-3">
            <button onClick={() => setPreferences({ animationType: 'jump' })} className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-widest rounded-xl transition-all duration-300 border-2 ${animationType === 'jump' ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-white'}`}>🦘 JUMP</button>
            <button onClick={() => setPreferences({ animationType: 'smooth' })} className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-widest rounded-xl transition-all duration-300 border-2 ${animationType === 'smooth' ? 'border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-white'}`}>⛸️ SMOOTH</button>
          </div>
        </div>

        {/* Game Speed Toggle */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] text-center">GAME SPEED</label>
          <div className="flex gap-3">
            <button onClick={() => setPreferences({ isFastMode: false })} className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-widest rounded-xl transition-all duration-300 border-2 ${!isFastMode ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-white'}`}>🐢 NORMAL</button>
            <button onClick={() => setPreferences({ isFastMode: true })} className={`flex-1 py-3 text-xs sm:text-sm font-black tracking-widest rounded-xl transition-all duration-300 border-2 ${isFastMode ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-white'}`}>⚡ FAST</button>
          </div>
        </div>

        <button onClick={onClose} className="mt-4 w-full py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black rounded-2xl tracking-[0.2em] transition-all active:scale-95 border border-white/10 shadow-lg">CLOSE</button>
      </motion.div>
    </div>
  );
};

// 4. MAIN APP
export default function Home() {
  const gameStarted = useGameStore((state: any) => state.gameStarted);
  const startGame = useGameStore((state: any) => state.startGame);
  const exitGame = useGameStore((state: any) => state.exitGame);
  
  const [modeTab, setModeTab] = useState<'COMPUTER' | 'FRIENDS'>('COMPUTER');
  const [selectedPlayers, setSelectedPlayers] = useState(2);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!gameStarted) {
    return (
      <main className="fixed inset-0 w-screen h-[100dvh] bg-[#060D1A] flex items-center justify-center select-none overflow-hidden p-4">
        <style>{`
          @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); } 50% { transform: translateY(-20px) rotate(10deg) scale(1.1); } }
          /* GPU Optimization applied to particles */
          .particle { position: absolute; border-radius: 50%; opacity: 0.15; animation: float 6s ease-in-out infinite; filter: blur(8px); will-change: transform; transform: translateZ(0); }
        `}</style>
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="particle w-32 h-32 top-[10%] left-[15%] bg-red-500" style={{ animationDelay: '0s' }} />
          <div className="particle w-40 h-40 top-[40%] right-[10%] bg-blue-500" style={{ animationDelay: '2s' }} />
          <div className="particle w-48 h-48 bottom-[15%] left-[25%] bg-green-500" style={{ animationDelay: '4s' }} />
          <div className="particle w-24 h-24 bottom-[10%] right-[35%] bg-yellow-500" style={{ animationDelay: '1s' }} />
        </div>

        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#020617_100%)] z-0" />

        <button onClick={() => setIsSettingsOpen(true)} className="absolute top-6 right-6 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 text-xl transform-gpu">⚙️</button>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 transform-gpu will-change-transform">
          
          <div className="space-y-1 text-center bg-slate-900/40 backdrop-blur-md px-10 py-6 rounded-full border border-white/5 shadow-2xl">
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-red-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest">LUDO</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase">Pro Edition</p>
          </div>

          {/* ADVANCED MODE SELECTOR */}
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-[10px] sm:text-xs font-black tracking-[0.2em] text-slate-500 uppercase">CHOOSE YOUR MODE</p>
            <div className="flex gap-4">
              <button onClick={() => setModeTab('COMPUTER')} className={`relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl transition-all duration-300 overflow-hidden group ${modeTab === 'COMPUTER' ? 'bg-blue-600/20 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] scale-105' : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'}`}>
                <span className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform transform-gpu">🤖</span>
                <span className={`text-[10px] sm:text-xs font-black tracking-widest ${modeTab === 'COMPUTER' ? 'text-blue-400' : 'text-slate-400'}`}>VS ROBOT</span>
              </button>
              <button onClick={() => setModeTab('FRIENDS')} className={`relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl transition-all duration-300 overflow-hidden group ${modeTab === 'FRIENDS' ? 'bg-green-600/20 border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)] scale-105' : 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'}`}>
                <span className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform transform-gpu">🧑‍🤝‍🧑</span>
                <span className={`text-[10px] sm:text-xs font-black tracking-widest ${modeTab === 'FRIENDS' ? 'text-green-400' : 'text-slate-400'}`}>VS FRIENDS</span>
              </button>
            </div>
          </div>

          {/* ADVANCED PLAYER SELECTOR */}
          <div className="w-full flex flex-col gap-3 mt-2">
            <p className="text-center text-[10px] sm:text-xs font-black tracking-[0.2em] text-slate-500 uppercase">NUMBER OF PLAYERS</p>
            <div className="flex justify-center gap-4 sm:gap-6">
              {[2, 3, 4].map(num => (
                <button key={num} onClick={() => setSelectedPlayers(num)} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-black transition-all duration-300 border-2 transform-gpu ${selectedPlayers === num ? 'bg-gradient-to-tr from-yellow-400 to-amber-600 border-yellow-300 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-110' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-500'}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* MASSIVE SINGLE START BUTTON */}
          <button onClick={() => startGame(selectedPlayers, modeTab === 'COMPUTER')} className="w-full mt-6 p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 rounded-[2rem] font-black text-white shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all active:scale-95 border border-white/20 tracking-[0.2em] text-lg sm:text-xl flex items-center justify-center gap-3 group transform-gpu">
            <span>START GAME</span>
            <span className="group-hover:translate-x-2 transition-transform text-2xl transform-gpu">🚀</span>
          </button>

        </motion.div>
      </main>
    );
  }

  // ACTIVE GAME UI
  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-[#060D1A] select-none touch-none py-2 px-3 md:p-6">
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="absolute top-2 right-2 md:top-6 md:right-6 z-50 flex gap-2">
        <button onClick={() => setIsSettingsOpen(true)} className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded-full text-sm md:text-lg font-bold hover:bg-slate-700 transition-colors flex items-center justify-center shadow-lg transform-gpu active:scale-95">⚙️</button>
        <button onClick={exitGame} className="px-3 py-1.5 md:px-4 md:py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] md:text-xs font-bold tracking-wider hover:bg-red-500/40 transition-colors shadow-lg transform-gpu active:scale-95">QUIT</button>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="relative z-20 w-full h-full max-w-[500px] lg:max-w-[1200px] grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] lg:grid-rows-[auto_1fr_auto] gap-y-3 sm:gap-y-4 lg:gap-x-8 lg:gap-y-0 items-center justify-items-center content-center mx-auto min-h-0 min-w-0">
        <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 justify-self-start lg:justify-self-end self-end lg:self-start lg:mt-6"><PlayerBox color="red" name="Player 1" /></div>
        <div className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1 justify-self-end lg:justify-self-start self-end lg:self-start lg:mt-6"><PlayerBox color="green" name="Player 2" /></div>
        <div className="col-span-2 row-start-2 lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3 flex items-center justify-center w-full min-h-0 min-w-0">
          <div className="relative aspect-square w-[min(98vw,calc(100dvh-190px))] lg:w-[85vh] lg:h-[85vh] bg-slate-900 rounded-2xl lg:rounded-[3rem] p-1.5 lg:p-2 border-[4px] lg:border-8 border-[#0f172a] shadow-[0_0_50px_rgba(0,0,0,0.9)] shrink-0 flex items-center justify-center transform-gpu">
            <LudoBoard />
          </div>
        </div>
        <div className="col-start-1 row-start-3 lg:col-start-1 lg:row-start-3 justify-self-start lg:justify-self-end self-start lg:self-end lg:mb-6"><PlayerBox color="blue" name="Player 3" /></div>
        <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-3 justify-self-end lg:justify-self-start self-start lg:self-end lg:mb-6"><PlayerBox color="yellow" name="YOU" /></div>
      </div>
    </main>
  );
}