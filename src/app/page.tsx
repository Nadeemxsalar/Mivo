// src/app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import LudoBoard from './components/LudoBoard';
import { Color } from '../types/game';

// Realistic 3D Dice Face
const DiceFace = ({ value }: { value: number | string }) => {
  if (typeof value === 'string') return <span className="text-xl md:text-2xl font-black text-slate-800 drop-shadow-md">{value}</span>;
  const dot = <div className="w-[20%] h-[20%] bg-slate-900 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" />;

  switch (value) {
    case 1: return <div className="flex h-full w-full items-center justify-center">{dot}</div>;
    case 2: return <div className="flex h-full w-full justify-between p-[15%]"><div className="self-start">{dot}</div><div className="self-end">{dot}</div></div>;
    case 3: return <div className="flex h-full w-full justify-between p-[15%]"><div className="self-start">{dot}</div><div className="self-center">{dot}</div><div className="self-end">{dot}</div></div>;
    case 4: return <div className="grid h-full w-full grid-cols-2 grid-rows-2 place-items-center p-[10%]">{dot}{dot}{dot}{dot}</div>;
    case 5: return <div className="grid h-full w-full grid-cols-3 grid-rows-3 place-items-center p-[8%]">{dot}<div/>{dot}<div/>{dot}<div/>{dot}<div/>{dot}</div>;
    case 6: return <div className="grid h-full w-full grid-cols-2 grid-rows-3 place-items-center px-[15%] py-[10%] gap-y-1">{dot}{dot}{dot}{dot}{dot}{dot}</div>;
    default: return null;
  }
};

// Tight & Responsive Player Profile Box
const PlayerBox = ({ color, name }: { color: Color, name: string }) => {
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);
  const rollDice = useGameStore((state: any) => state.rollDice);
  const hasRolled = useGameStore((state: any) => state.hasRolled);

  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | string>('🎲');

  const isActive = currentPlayerTurn === color;

  const handleRollClick = () => {
    if (!isActive || isRolling || hasRolled) return; 
    setIsRolling(true);
    const rollInterval = setInterval(() => setDisplayValue(Math.floor(Math.random() * 6) + 1), 60);
    setTimeout(() => {
      clearInterval(rollInterval);
      rollDice(); 
      setIsRolling(false);
    }, 500);
  };

  useEffect(() => {
    if (isActive && diceValue !== null && !isRolling) setDisplayValue(diceValue);
    else if (isActive && diceValue === null && !isRolling) setDisplayValue('🎲');
  }, [diceValue, isRolling, isActive]);

  const colorStyles: Record<Color, string> = {
    red: 'bg-[#ff3b30] border-[#b01e16]',
    green: 'bg-[#34c759] border-[#1d8236]',
    blue: 'bg-[#007aff] border-[#004f9e]',
    yellow: 'bg-[#ffcc00] border-[#a68500]'
  };

  return (
    <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'scale-105 md:scale-110 opacity-100 z-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'scale-95 opacity-70 grayscale-[20%]'}`}>
      
      {/* Player Name Tag */}
      <div className="bg-slate-800/90 backdrop-blur-md border border-slate-500 px-2 py-0.5 md:py-1 rounded-full text-white text-[9px] md:text-xs font-bold tracking-wider shadow-lg whitespace-nowrap">
        {name}
      </div>
      
      {/* Container holding Avatar + Dice */}
      <div className={`w-14 h-20 md:w-20 md:h-28 rounded-lg md:rounded-2xl border-[3px] md:border-[4px] shadow-2xl flex flex-col items-center justify-between p-1 md:p-2 ${colorStyles[color]} relative overflow-hidden`}>
        {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
        
        {/* Compact Avatar */}
        <div className="w-6 h-6 md:w-10 md:h-10 bg-white/90 rounded-full shadow-inner flex items-center justify-center border md:border-2 border-black/20 z-10">
          <div className={`w-3 h-3 md:w-5 md:h-5 rounded-full ${colorStyles[color]} shadow-inner`} />
        </div>

        {/* Dice Button */}
        <button 
          onClick={handleRollClick}
          disabled={!isActive || isRolling || hasRolled}
          className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-b from-white to-gray-200 rounded-lg md:rounded-xl shadow-[0_3px_10px_rgba(0,0,0,0.5)] border-b-2 md:border-b-4 border-gray-400 flex items-center justify-center transition-all z-10 ${isActive && !hasRolled ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0' : 'cursor-default'} ${isRolling ? 'animate-spin' : ''}`}
        >
          {isActive ? <DiceFace value={displayValue} /> : <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gray-400 rounded-full shadow-inner" />}
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    // 'fixed' & 'overflow-hidden' ensure 0 scrolling bugs on mobile
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0a192f] flex items-center justify-center select-none touch-none p-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a192f] to-black">
      
      {/* Subtle Premium Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* 
        MASTER CSS GRID: 
        Mobile: 2 Columns, 3 Rows 
        Laptop: 3 Columns, 3 Rows
      */}
      <div className="relative z-20 grid w-full max-w-[95vw] lg:max-w-[1100px]
                      grid-cols-2 lg:grid-cols-[1fr_auto_1fr]
                      grid-rows-[auto_auto_auto] lg:grid-rows-[auto_1fr_auto]
                      gap-y-3 gap-x-2 lg:gap-x-8 lg:gap-y-0
                      place-items-center">

        {/* TOP-LEFT: Red Player */}
        <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 justify-self-start lg:justify-self-end self-end lg:self-start lg:mt-6">
          <PlayerBox color="red" name="Player 1 (RED)" />
        </div>

        {/* TOP-RIGHT: Green Player */}
        <div className="col-start-2 row-start-1 lg:col-start-3 lg:row-start-1 justify-self-end lg:justify-self-start self-end lg:self-start lg:mt-6">
          <PlayerBox color="green" name="Player 2 (GREEN)" />
        </div>

        {/* CENTER: The Ludo Board */}
        <div className="col-span-2 row-start-2 lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-3">
          <div className="w-[92vw] h-[92vw] max-w-[340px] max-h-[340px] sm:max-w-[420px] sm:max-h-[420px] md:max-w-[500px] md:max-h-[500px] lg:max-w-[600px] lg:max-h-[600px] xl:max-w-[650px] xl:max-h-[650px] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-[1rem] md:rounded-[2rem] bg-white p-1.5 md:p-3 border-[6px] md:border-[10px] border-[#2c3e50] flex items-center justify-center">
            <LudoBoard />
          </div>
        </div>

        {/* BOTTOM-LEFT: Blue Player */}
        <div className="col-start-1 row-start-3 lg:col-start-1 lg:row-start-3 justify-self-start lg:justify-self-end self-start lg:self-end lg:mb-6">
          <PlayerBox color="blue" name="Player 3 (BLUE)" />
        </div>

        {/* BOTTOM-RIGHT: Yellow Player */}
        <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-3 justify-self-end lg:justify-self-start self-start lg:self-end lg:mb-6">
          <PlayerBox color="yellow" name="YOU (YELLOW)" />
        </div>

      </div>
    </main>
  );
}