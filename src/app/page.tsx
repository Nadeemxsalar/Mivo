// src/app/page.tsx
'use client';
import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import LudoBoard from './components/LudoBoard';
import { Color } from '../types/game';

// 1. PERFECT DICE FACE (Fixed layout, no overlapping)
const DiceFace = memo(({ value }: { value: number }) => {
  const Dot = () => <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-slate-900 rounded-full shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />;

  switch (value) {
    case 1: return <div className="flex w-full h-full items-center justify-center"><Dot/></div>;
    case 2: return <div className="flex flex-col w-full h-full justify-between p-1.5 md:p-2.5"><div className="self-start"><Dot/></div><div className="self-end"><Dot/></div></div>;
    case 3: return <div className="flex flex-col w-full h-full justify-between p-1.5 md:p-2.5"><div className="self-start"><Dot/></div><div className="self-center"><Dot/></div><div className="self-end"><Dot/></div></div>;
    case 4: return <div className="flex flex-col w-full h-full justify-between p-1.5 md:p-2.5"><div className="flex justify-between"><Dot/><Dot/></div><div className="flex justify-between"><Dot/><Dot/></div></div>;
    case 5: return <div className="flex flex-col w-full h-full justify-between p-1 md:p-2"><div className="flex justify-between"><Dot/><Dot/></div><div className="flex justify-center"><Dot/></div><div className="flex justify-between"><Dot/><Dot/></div></div>;
    case 6: return <div className="flex flex-col w-full h-full justify-between p-1 md:p-2"><div className="flex justify-between"><Dot/><Dot/></div><div className="flex justify-between"><Dot/><Dot/></div><div className="flex justify-between"><Dot/><Dot/></div></div>;
    default: return <div className="flex w-full h-full items-center justify-center"><Dot/></div>;
  }
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

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(6);

  // Agar player game mein nahi hai (eg. 2 player mode mein Green), toh box gayab kar do
  if (!activeColors.includes(color)) return <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 opacity-0 pointer-events-none" />;

  const isActive = currentPlayerTurn === color;

  const handleRollClick = () => {
    if (!isActive || isRolling || hasRolled || isAnimating) return; 
    setIsRolling(true);
    const rollInterval = setInterval(() => setDisplayValue(Math.floor(Math.random() * 6) + 1), 100);
    setTimeout(() => {
      clearInterval(rollInterval);
      rollDice(); 
      setIsRolling(false);
    }, 400); 
  };

  const finalDiceValue = isRolling ? displayValue : (diceValue !== null ? diceValue : displayValue);

  const colorStyles: Record<Color, { bg: string, ring: string, shadow: string }> = {
    red: { bg: 'bg-gradient-to-br from-[#ff5252] to-[#b71c1c]', ring: 'ring-[#ff5252]', shadow: 'shadow-[#ff5252]/50' },
    green: { bg: 'bg-gradient-to-br from-[#69f0ae] to-[#1b5e20]', ring: 'ring-[#69f0ae]', shadow: 'shadow-[#69f0ae]/50' },
    blue: { bg: 'bg-gradient-to-br from-[#448aff] to-[#0d47a1]', ring: 'ring-[#448aff]', shadow: 'shadow-[#448aff]/50' },
    yellow: { bg: 'bg-gradient-to-br from-[#ffe57f] to-[#f57f17]', ring: 'ring-[#ffe57f]', shadow: 'shadow-[#ffe57f]/50' }
  };

  const currentStyle = colorStyles[color];

  return (
    <div className={`flex flex-col items-center justify-center gap-1 md:gap-2 transition-all duration-300 transform-gpu ${isActive ? `scale-105 lg:scale-110 opacity-100 z-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]` : 'scale-95 opacity-80 grayscale-[10%]'}`}>
      
      <div className={`px-3 py-1 lg:px-5 lg:py-1.5 rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-black tracking-widest uppercase border border-white/20 shadow-lg whitespace-nowrap ${isActive ? currentStyle.bg : 'bg-slate-800'}`}>
        {name}
      </div>
      
      <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-slate-900 border-[3px] lg:border-[4px] border-white/10 rounded-2xl lg:rounded-3xl shadow-inner flex items-center justify-center relative transition-all duration-300 overflow-hidden
        ${isActive ? `ring-2 lg:ring-4 ${currentStyle.ring} ${currentStyle.shadow}` : ''}
      `}>
        
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active-dice"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 absolute"
            >
              <button 
                onClick={handleRollClick}
                disabled={!isActive || isRolling || hasRolled || isAnimating}
                className={`w-full h-full bg-gradient-to-b from-white to-gray-300 rounded-lg lg:rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] border-b-[3px] lg:border-b-[5px] border-gray-400 flex items-center justify-center transition-transform transform-gpu z-10 
                ${(!hasRolled && !isAnimating) ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,255,255,0.3)] active:translate-y-1 active:border-b-0' : 'cursor-default opacity-95'}
                ${isRolling ? 'animate-pulse' : ''}`}
              >
                <DiceFace value={finalDiceValue} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="inactive-dot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`w-6 h-6 lg:w-10 lg:h-10 rounded-full border border-white/50 shadow-inner ${currentStyle.bg} flex items-center justify-center absolute`}
            >
               <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white/80 rounded-full blur-[0.5px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl pointer-events-none" />}
      </div>
    </div>
  );
});
PlayerBox.displayName = 'PlayerBox';

// 3. MAIN APP COMPONENT
export default function Home() {
  const gameStarted = useGameStore((state: any) => state.gameStarted);
  const startGame = useGameStore((state: any) => state.startGame);
  const exitGame = useGameStore((state: any) => state.exitGame);

  // START MENU SCREEN (Agar game start nahi hua hai)
  if (!gameStarted) {
    return (
      <main className="fixed inset-0 w-screen h-[100dvh] bg-[#060D1A] flex items-center justify-center select-none overflow-hidden p-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_#334155_0%,_#020617_100%)]" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-8 w-full max-w-md"
        >
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-500 drop-shadow-lg tracking-wider">
              LUDO
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium tracking-widest uppercase">Select Players</p>
          </div>

          <div className="flex flex-col w-full gap-4">
            <button onClick={() => startGame(2)} className="group relative w-full p-4 bg-gradient-to-r from-red-600/80 to-yellow-500/80 rounded-xl font-bold text-white shadow-lg overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/20">
              <span className="relative z-10 tracking-widest text-lg">2 PLAYERS</span>
            </button>
            
            <button onClick={() => startGame(3)} className="group relative w-full p-4 bg-gradient-to-r from-green-600/80 to-yellow-500/80 rounded-xl font-bold text-white shadow-lg overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/20">
              <span className="relative z-10 tracking-widest text-lg">3 PLAYERS</span>
            </button>
            
            <button onClick={() => startGame(4)} className="group relative w-full p-4 bg-gradient-to-r from-blue-600/80 to-red-500/80 rounded-xl font-bold text-white shadow-lg overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/20">
              <span className="relative z-10 tracking-widest text-lg">4 PLAYERS</span>
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ACTIVE GAME SCREEN
  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-[#060D1A] select-none touch-none p-2 md:p-6">
      
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />

      {/* Top Exit Button */}
      <button 
        onClick={exitGame}
        className="absolute top-2 right-2 md:top-6 md:right-6 z-50 px-3 py-1.5 md:px-4 md:py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold tracking-wider hover:bg-red-500/40 transition-colors"
      >
        QUIT GAME
      </button>

      <div className="relative z-20 w-full h-full max-w-[500px] lg:max-w-[1200px] grid 
                      grid-cols-2 lg:grid-cols-[1fr_auto_1fr] 
                      grid-rows-[auto_1fr_auto] lg:grid-rows-[auto_1fr_auto] 
                      gap-2 sm:gap-4 lg:gap-x-8 lg:gap-y-0 
                      items-center justify-items-center mx-auto min-h-0 min-w-0">

        {/* TOP-LEFT */}
        <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 justify-self-start lg:justify-self-end self-end lg:self-start lg:mt-6">
          <PlayerBox color="red" name="Player 1" />
        </div>

        {/* TOP-RIGHT */}
        <div className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1 justify-self-end lg:justify-self-start self-end lg:self-start lg:mt-6">
          <PlayerBox color="green" name="Player 2" />
        </div>

        {/* PERFECTLY SCALED BOARD */}
        <div className="col-span-2 row-start-2 lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3 flex items-center justify-center w-full h-full min-h-0 min-w-0">
          <div className="relative aspect-square w-[min(96vw,62vh)] sm:w-[min(85vw,65vh)] lg:w-[80vh] lg:h-[80vh] bg-slate-900 rounded-[1.5rem] lg:rounded-[3rem] p-1.5 lg:p-3 border-[6px] lg:border-[12px] border-[#0f172a] shadow-[0_0_50px_rgba(0,0,0,0.9)] shrink-0 flex items-center justify-center">
            <LudoBoard />
          </div>
        </div>

        {/* BOTTOM-LEFT */}
        <div className="col-start-1 row-start-3 lg:col-start-1 lg:row-start-3 justify-self-start lg:justify-self-end self-start lg:self-end lg:mb-6">
          <PlayerBox color="blue" name="Player 3" />
        </div>

        {/* BOTTOM-RIGHT */}
        <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-3 justify-self-end lg:justify-self-start self-start lg:self-end lg:mb-6">
          <PlayerBox color="yellow" name="YOU" />
        </div>

      </div>
    </main>
  );
}