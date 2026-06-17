// src/app/page.tsx
'use client';
import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import LudoBoard from './components/LudoBoard';
import { Color } from '../types/game';

// 1. Premium Dice Face (Scalable dots for Mobile & Laptop)
const DiceFace = memo(({ value }: { value: number }) => {
  const Dot = () => <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 bg-slate-900 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transform-gpu" />;

  switch (value) {
    case 1: return <div className="flex w-full h-full items-center justify-center"><Dot/></div>;
    case 2: return <div className="flex w-full h-full items-center justify-between p-2 lg:p-3"><div className="self-start"><Dot/></div><div className="self-end"><Dot/></div></div>;
    case 3: return <div className="flex w-full h-full items-center justify-between p-2 lg:p-3"><div className="self-start"><Dot/></div><div className="self-center"><Dot/></div><div className="self-end"><Dot/></div></div>;
    case 4: return <div className="grid grid-cols-2 grid-rows-2 w-full h-full place-items-center p-1.5 lg:p-2"><Dot/><Dot/><Dot/><Dot/></div>;
    case 5: return <div className="grid grid-cols-3 grid-rows-3 w-full h-full place-items-center p-1 lg:p-1.5"><Dot/><div/><Dot/><div/><Dot/><div/><Dot/><div/><Dot/></div>;
    case 6: return <div className="grid grid-cols-2 grid-rows-3 w-full h-full place-items-center p-1.5 lg:p-2 gap-y-0.5 lg:gap-y-1"><Dot/><Dot/><Dot/><Dot/><Dot/><Dot/></div>;
    default: return <div className="flex w-full h-full items-center justify-center"><Dot/></div>;
  }
});
DiceFace.displayName = 'DiceFace';

// 2. Responsive Player Box (Strictly keeps the dice inside)
const PlayerBox = memo(({ color, name }: { color: Color, name: string }) => {
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);
  const rollDice = useGameStore((state: any) => state.rollDice);
  const hasRolled = useGameStore((state: any) => state.hasRolled);
  const isAnimating = useGameStore((state: any) => state.isAnimating);

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(6);

  const isActive = currentPlayerTurn === color;

  const handleRollClick = () => {
    if (!isActive || isRolling || hasRolled || isAnimating) return; 
    
    setIsRolling(true);
    const rollInterval = setInterval(() => setDisplayValue(Math.floor(Math.random() * 6) + 1), 60);
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
    <div className={`flex flex-col items-center justify-center gap-1.5 lg:gap-2 transition-all duration-300 transform-gpu ${isActive ? `scale-105 lg:scale-110 opacity-100 z-30 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]` : 'scale-95 opacity-70 grayscale-[10%]'}`}>
      
      {/* Player Name Badge */}
      <div className={`px-3 py-1 lg:px-5 lg:py-1.5 rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-black tracking-widest uppercase border border-white/20 shadow-lg whitespace-nowrap ${isActive ? currentStyle.bg : 'bg-slate-800'}`}>
        {name}
      </div>
      
      {/* Dice Container */}
      <div className={`w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-slate-900 border-[3px] lg:border-[4px] border-white/10 rounded-2xl lg:rounded-3xl shadow-inner flex items-center justify-center relative transition-all duration-300 overflow-hidden
        ${isActive ? `ring-2 lg:ring-4 ${currentStyle.ring} ${currentStyle.shadow}` : ''}
      `}>
        
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active-dice"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 absolute"
            >
              <button 
                onClick={handleRollClick}
                disabled={!isActive || isRolling || hasRolled || isAnimating}
                className={`w-full h-full bg-gradient-to-b from-white to-gray-300 rounded-lg lg:rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.6)] border-b-[3px] lg:border-b-[6px] border-gray-400 flex items-center justify-center transition-transform transform-gpu z-10 ${(!hasRolled && !isAnimating) ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,255,255,0.3)] active:translate-y-1 active:border-b-0' : 'cursor-default opacity-90'} ${isRolling ? 'animate-spin' : ''}`}
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
               <div className="w-1.5 h-1.5 lg:w-3 lg:h-3 bg-white/80 rounded-full blur-[0.5px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl pointer-events-none" />}
      </div>
    </div>
  );
});
PlayerBox.displayName = 'PlayerBox';

export default function Home() {
  return (
    // 'fixed inset-0' aur 'h-[100dvh]' prevents scrolling and ensures full screen height
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-[#060D1A] select-none touch-none px-2 py-4 lg:p-6">
      
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />

      {/* THE PERFECT GRID FOR BOTH LAPTOP & MOBILE 
          Laptop (lg): 1fr auto 1fr -> Center mein board rahega aur side mein players lock rahenge.
          Board ko lg:row-span-3 diya gaya hai taaki Top aur Bottom players strictly kono par rahein.
      */}
      <div className="relative z-20 w-full h-full max-w-[550px] lg:max-w-[95vw] xl:max-w-[1200px] grid 
                      grid-cols-2 lg:grid-cols-[1fr_auto_1fr] 
                      grid-rows-[auto_1fr_auto] lg:grid-rows-[auto_1fr_auto] 
                      gap-2 sm:gap-4 lg:gap-x-8 lg:gap-y-0 
                      items-center justify-items-center mx-auto">

        {/* TOP-LEFT (RED) */}
        <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 justify-self-start lg:justify-self-end self-end lg:self-start lg:mt-8">
          <PlayerBox color="red" name="Player 1" />
        </div>

        {/* TOP-RIGHT (GREEN) */}
        <div className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1 justify-self-end lg:justify-self-start self-end lg:self-start lg:mt-8">
          <PlayerBox color="green" name="Player 2" />
        </div>

        {/* THE LUDO BOARD 
            Mobile: Size chhota rahega w-[min(95vw,55vh)] taaki boxes ko jagah mile.
            Laptop: Board pura center mein bada dikhega w-[82vh] h-[82vh].
        */}
        <div className="col-span-2 row-start-2 lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3 flex items-center justify-center w-full h-full">
          <div className="relative aspect-square w-[min(95vw,55vh)] lg:w-[82vh] lg:h-[82vh] bg-slate-900 rounded-[1.5rem] lg:rounded-[3rem] p-1.5 lg:p-3 border-[6px] lg:border-[12px] border-[#0f172a] shadow-[0_0_60px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center">
            <LudoBoard />
          </div>
        </div>

        {/* BOTTOM-LEFT (BLUE) */}
        <div className="col-start-1 row-start-3 lg:col-start-1 lg:row-start-3 justify-self-start lg:justify-self-end self-start lg:self-end lg:mb-8">
          <PlayerBox color="blue" name="Player 3" />
        </div>

        {/* BOTTOM-RIGHT (YELLOW) */}
        <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-3 justify-self-end lg:justify-self-start self-start lg:self-end lg:mb-8">
          <PlayerBox color="yellow" name="YOU" />
        </div>

      </div>
    </main>
  );
}