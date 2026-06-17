// src/app/page.tsx
'use client';
import React, { useState, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import LudoBoard from './components/LudoBoard';
import { Color } from '../types/game';

// 1. PERFECT 3x3 MATRIX DICE FACE (With Dynamic Dot Gaps)
const DiceFace = memo(({ value }: { value: number }) => {
  // FIXED GAP BUG: Mobile aur Laptop ke liye sizes ko perfectly balance kiya hai
  const Dot = () => <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-slate-950 rounded-full shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />;

  return (
    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2 lg:p-3 gap-1 sm:gap-1.5 lg:gap-2 place-items-center justify-items-center items-center select-none pointer-events-none">
      {/* Row 1 */}
      {(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      <div />
      {(value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      
      {/* Row 2 */}
      {(value === 6) ? <Dot /> : <div />}
      {(value === 1 || value === 3 || value === 5) ? <Dot /> : <div />}
      {(value === 6) ? <Dot /> : <div />}
      
      {/* Row 3 */}
      {(value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
      <div />
      {(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? <Dot /> : <div />}
    </div>
  );
});
DiceFace.displayName = 'DiceFace';

// 2. PREMIUM PLAYER BOX
const PlayerBox = memo(({ color, name }: { color: Color, name: string }) => {
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);
  const rollDice = useGameStore((state: any) => state.rollDice);
  const hasRolled = useGameStore((state: any) => state.hasRolled);
  const isAnimating = useGameStore((state: any) => state.isAnimating);
  const activeColors = useGameStore((state: any) => state.activeColors);
  const isRobotMode = useGameStore((state: any) => state.isRobotMode);

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(6);
  const clickLockRef = useRef(false);

  if (!activeColors?.includes(color)) return <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 opacity-0 pointer-events-none" />;

  const isActive = currentPlayerTurn === color;

  useEffect(() => {
    if (isActive && diceValue !== null && !isRolling) {
      setDisplayValue(diceValue);
    }
  }, [diceValue, isActive, isRolling]);

  const handleRollClick = () => {
    if (!isActive || isRolling || hasRolled || isAnimating || clickLockRef.current) return; 
    
    clickLockRef.current = true;
    setIsRolling(true);
    
    const rollInterval = setInterval(() => {
      setDisplayValue(prev => {
        let next = Math.floor(Math.random() * 6) + 1;
        while(next === prev) next = Math.floor(Math.random() * 6) + 1; 
        return next;
      });
    }, 70);
    
    setTimeout(() => {
      clearInterval(rollInterval);
      rollDice(); 
      setIsRolling(false);
      clickLockRef.current = false;
    }, 500); 
  };

  // ROBOT AUTO ROLL
  useEffect(() => {
    if (isRobotMode && isActive && color !== 'yellow' && !hasRolled && !isAnimating && !isRolling) {
      const timer = setTimeout(() => {
        handleRollClick();
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [isRobotMode, isActive, color, hasRolled, isAnimating, isRolling]);

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
      rotate: [0, -15, 20, -15, 10, -5, 0], 
      y: [0, -25, -45, -20, -10, 0],       
      scale: [1, 1.2, 1.35, 1.15, 1.05, 1], 
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 transform-gpu will-change-transform ${isActive ? `scale-105 opacity-100 z-30` : 'scale-95 opacity-80 grayscale-[10%]'}`}>
      <div className={`px-2 py-0.5 lg:px-5 lg:py-1.5 rounded-full text-white text-[9px] sm:text-xs lg:text-sm font-black tracking-widest uppercase border border-white/20 shadow-lg whitespace-nowrap ${isActive ? currentStyle.bg : 'bg-slate-800'}`}>
        {name} {isRobotMode && color !== 'yellow' ? '🤖' : ''}
      </div>
      
      <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-slate-900 border-[3px] lg:border-4 border-white/10 rounded-xl lg:rounded-3xl shadow-inner flex items-center justify-center relative transition-all duration-300 overflow-visible
        ${isActive ? `ring-2 lg:ring-4 ${currentStyle.ring}` : ''}
      `}>
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div 
              key="active-dice" 
              variants={rollVariants} 
              initial="idle" 
              animate={isRolling ? "rolling" : "idle"} 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 absolute z-20"
            >
              <button 
                onClick={handleRollClick}
                disabled={!isActive || isRolling || hasRolled || isAnimating || (isRobotMode && color !== 'yellow')}
                className={`relative w-full h-full bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-lg lg:rounded-xl shadow-[-4px_6px_10px_rgba(0,0,0,0.6)] border-b-[5px] lg:border-b-[8px] border-r-[3px] lg:border-r-[5px] border-gray-400 flex items-center justify-center transition-all z-10 
                ${(!hasRolled && !isAnimating && !(isRobotMode && color !== 'yellow')) ? 'cursor-pointer hover:-translate-y-1 hover:border-b-[6px] lg:hover:border-b-[10px] hover:shadow-[-4px_8px_15px_rgba(0,0,0,0.5)] active:translate-y-2 active:border-b-[2px] active:border-r-[2px] active:shadow-none' : 'cursor-default opacity-95'}
                `}
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

// 3. MAIN APP
export default function Home() {
  const gameStarted = useGameStore((state: any) => state.gameStarted);
  const startGame = useGameStore((state: any) => state.startGame);
  const exitGame = useGameStore((state: any) => state.exitGame);

  const [modeTab, setModeTab] = useState<'COMPUTER' | 'FRIENDS'>('COMPUTER');

  if (!gameStarted) {
    return (
      <main className="fixed inset-0 w-screen h-[100dvh] bg-[#060D1A] flex items-center justify-center select-none overflow-hidden p-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_#334155_0%,_#020617_100%)]" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 md:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-6 w-full max-w-md">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-500 drop-shadow-lg tracking-wider">LUDO</h1>
            <p className="text-slate-400 text-[10px] md:text-sm font-medium tracking-widest uppercase">Select Game Mode</p>
          </div>

          <div className="flex w-full bg-slate-800/80 p-1 rounded-xl shadow-inner border border-white/5 mb-2">
            <button onClick={() => setModeTab('COMPUTER')} className={`flex-1 py-2 text-xs md:text-sm font-bold tracking-wider rounded-lg transition-all ${modeTab === 'COMPUTER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🤖 VS COMPUTER</button>
            <button onClick={() => setModeTab('FRIENDS')} className={`flex-1 py-2 text-xs md:text-sm font-bold tracking-wider rounded-lg transition-all ${modeTab === 'FRIENDS' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🧑‍🤝‍🧑 VS FRIENDS</button>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button onClick={() => startGame(2, modeTab === 'COMPUTER')} className="w-full p-3 md:p-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-red-600/80 hover:to-yellow-500/80 rounded-xl font-bold text-white shadow-lg active:scale-95 border border-white/20 tracking-widest text-sm md:text-lg transition-all">2 PLAYERS</button>
            <button onClick={() => startGame(3, modeTab === 'COMPUTER')} className="w-full p-3 md:p-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-green-600/80 hover:to-yellow-500/80 rounded-xl font-bold text-white shadow-lg active:scale-95 border border-white/20 tracking-widest text-sm md:text-lg transition-all">3 PLAYERS</button>
            <button onClick={() => startGame(4, modeTab === 'COMPUTER')} className="w-full p-3 md:p-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-blue-600/80 hover:to-red-500/80 rounded-xl font-bold text-white shadow-lg active:scale-95 border border-white/20 tracking-widest text-sm md:text-lg transition-all">4 PLAYERS</button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-[#060D1A] select-none touch-none py-2 px-3 md:p-6">
      
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <button onClick={exitGame} className="absolute top-2 right-2 md:top-6 md:right-6 z-50 px-2 py-1 md:px-4 md:py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] md:text-xs font-bold tracking-wider hover:bg-red-500/40 transition-colors">QUIT</button>

      <div className="relative z-20 w-full h-full max-w-[500px] lg:max-w-[1200px] grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] lg:grid-rows-[auto_1fr_auto] gap-y-3 sm:gap-y-4 lg:gap-x-8 lg:gap-y-0 items-center justify-items-center content-center mx-auto min-h-0 min-w-0">
        <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 justify-self-start lg:justify-self-end self-end lg:self-start lg:mt-6">
          <PlayerBox color="red" name="Player 1" />
        </div>
        <div className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1 justify-self-end lg:justify-self-start self-end lg:self-start lg:mt-6">
          <PlayerBox color="green" name="Player 2" />
        </div>
        <div className="col-span-2 row-start-2 lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3 flex items-center justify-center w-full min-h-0 min-w-0">
          <div className="relative aspect-square w-[min(98vw,calc(100dvh-190px))] lg:w-[85vh] lg:h-[85vh] bg-slate-900 rounded-2xl lg:rounded-[3rem] p-1.5 lg:p-2 border-[4px] lg:border-8 border-[#0f172a] shadow-[0_0_50px_rgba(0,0,0,0.9)] shrink-0 flex items-center justify-center">
            <LudoBoard />
          </div>
        </div>
        <div className="col-start-1 row-start-3 lg:col-start-1 lg:row-start-3 justify-self-start lg:justify-self-end self-start lg:self-end lg:mb-6">
          <PlayerBox color="blue" name="Player 3" />
        </div>
        <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-3 justify-self-end lg:justify-self-start self-start lg:self-end lg:mb-6">
          <PlayerBox color="yellow" name="YOU" />
        </div>
      </div>
    </main>
  );
}