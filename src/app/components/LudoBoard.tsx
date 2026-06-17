// src/app/components/LudoBoard.tsx
'use client';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Color, Token, START_OFFSETS, Player } from '../../types/game';

// Custom Star SVG
const StarIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-[70%] h-[70%] drop-shadow-md z-0 opacity-80">
    <path stroke="rgba(0,0,0,0.4)" strokeWidth="1" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Winner Crown Icon
const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FFD700" className="absolute -top-3 sm:-top-4 w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-50">
    <path d="M2 22h20v2H2v-2zm2-2l3-10 5 4 5-4 3 10H4z" />
    <circle cx="5" cy="8" r="2" fill="#FFD700" />
    <circle cx="12" cy="5" r="2" fill="#FFD700" />
    <circle cx="19" cy="8" r="2" fill="#FFD700" />
  </svg>
);

const PATH_COORDS = [
  [6,1],[6,2],[6,3],[6,4],[6,5],     
  [5,6],[4,6],[3,6],[2,6],[1,6],     
  [0,6],[0,7],[0,8],                 
  [1,8],[2,8],[3,8],[4,8],[5,8],     
  [6,9],[6,10],[6,11],[6,12],[6,13], 
  [6,14],[7,14],[8,14],              
  [8,13],[8,12],[8,11],[8,10],[8,9], 
  [9,8],[10,8],[11,8],[12,8],[13,8], 
  [14,8],[14,7],[14,6],              
  [13,6],[12,6],[11,6],[10,6],[9,6], 
  [8,5],[8,4],[8,3],[8,2],[8,1],     
  [8,0],[7,0],[6,0]                  
];

const HOME_PATHS: Record<Color, number[][]> = {
  red: [[7,1],[7,2],[7,3],[7,4],[7,5]], 
  green: [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue: [[13,7],[12,7],[11,7],[10,7],[9,7]]
};

const BASE_COORDS: Record<Color, number[][]> = {
  red: [[2,2],[2,3],[3,2],[3,3]],       
  green: [[2,11],[2,12],[3,11],[3,12]], 
  yellow: [[11,11],[11,12],[12,11],[12,12]], 
  blue: [[11,2],[11,3],[12,2],[12,3]]   
};

const colors = { red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835', white: '#FFFFFF' };

const getCellStyles = (r: number, c: number): React.CSSProperties => {
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { backgroundColor: 'transparent' };
  if (r === 7 && c > 0 && c < 6) return { backgroundColor: colors.red };
  if (c === 7 && r > 0 && r < 6) return { backgroundColor: colors.green };
  if (r === 7 && c > 8 && c < 14) return { backgroundColor: colors.yellow };
  if (c === 7 && r > 8 && r < 14) return { backgroundColor: colors.blue };
  if (r === 6 && c === 1) return { backgroundColor: colors.red };
  if (r === 1 && c === 8) return { backgroundColor: colors.green };
  if (r === 8 && c === 13) return { backgroundColor: colors.yellow };
  if (r === 13 && c === 6) return { backgroundColor: colors.blue };
  return { backgroundColor: colors.white };
};

const isStarSpot = (r: number, c: number) => {
  return [[6, 1], [1, 8], [8, 13], [13, 6], [8, 2], [6, 12], [2, 6], [12, 8]].some(([sr, sc]) => sr === r && sc === c);
};

export default function LudoBoard() {
  const players = useGameStore((state: any) => state.players);
  const moveToken = useGameStore((state: any) => state.moveToken);
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);

  const visualPosRef = useRef<Record<string, number>>({});
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token) => {
        if (visualPosRef.current[t.id] === undefined) {
          visualPosRef.current[t.id] = t.position;
        }
      });
    });
    setRenderTick(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token) => {
        const targetPos = t.position;
        const currentVisPos = visualPosRef.current[t.id];

        if (currentVisPos !== undefined && currentVisPos !== targetPos) {
          if (targetPos === -1 || currentVisPos === -1) {
            visualPosRef.current[t.id] = targetPos;
            setRenderTick(v => v + 1);
          } else if (targetPos > currentVisPos) {
            let step = currentVisPos;
            const hop = () => {
              step++;
              visualPosRef.current[t.id] = step;
              setRenderTick(v => v + 1);
              if (step < targetPos) {
                setTimeout(hop, 150); // Fast Hop
              }
            };
            setTimeout(hop, 150);
          } else {
            visualPosRef.current[t.id] = targetPos;
            setRenderTick(v => v + 1);
          }
        }
      });
    });
  }, [players]);

  const allTokens = useMemo(() => {
    let tokensArr: any[] = [];
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token, index: number) => {
        let r = 0, c = 0;
        const playerColor = p.color as Color;
        const visPos = visualPosRef.current[t.id] ?? t.position;
        
        if (t.isFinished || visPos >= 57) {
          r = 7; c = 7; 
        } else if (visPos === -1) {
          [r, c] = BASE_COORDS[playerColor][index]; 
        } else if (visPos <= 50) {
          const globalPos = (START_OFFSETS[playerColor] + visPos) % 52;
          [r, c] = PATH_COORDS[globalPos]; 
        } else {
          [r, c] = HOME_PATHS[playerColor][visPos - 51]; 
        }
        
        tokensArr.push({ ...t, r, c, playerColor, index, visPos });
      });
    });
    return tokensArr;
  }, [players, renderTick]);

  const tokenThemes: Record<Color, { base: string, top: string }> = {
    red: { base: 'bg-[#B71C1C]', top: 'bg-gradient-to-br from-[#FF8A80] to-[#E53935]' },
    green: { base: 'bg-[#1B5E20]', top: 'bg-gradient-to-br from-[#69F0AE] to-[#43A047]' },
    blue: { base: 'bg-[#0D47A1]', top: 'bg-gradient-to-br from-[#82B1FF] to-[#1E88E5]' },
    yellow: { base: 'bg-[#F57F17]', top: 'bg-gradient-to-br from-[#FFF59D] to-[#FDD835]' },
  };

  const renderStaticGrid = useMemo(() => {
    return (
      <div className="absolute inset-0 grid bg-slate-900 z-0" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)', gap: '1px' }}>
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => {
            const isHomeCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
            return (
              <div key={`grid-${r}-${c}`} className="relative flex items-center justify-center border-[0.5px] border-black/10" style={getCellStyles(r, c)}>
                {isStarSpot(r, c) && !isHomeCenter && <StarIcon color={r===6&&c===1 ? '#fff' : r===1&&c===8 ? '#fff' : r===8&&c===13 ? '#fff' : r===13&&c===6 ? '#fff' : '#ccc'} />}
              </div>
            );
          })
        )}
      </div>
    );
  }, []);

  return (
    <div className="relative w-full h-full aspect-square bg-slate-800 overflow-hidden shadow-inner">
      {renderStaticGrid}

      {/* SOLID BASES */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#E53935] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-r border-b border-black/30">
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#43A047] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-l border-b border-black/30">
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#1E88E5] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-r border-t border-black/30">
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#FDD835] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-l border-t border-black/30">
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>

      {/* BASE HOLES */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {Object.entries(BASE_COORDS).map(([color, coords]) =>
          coords.map(([r, c], i) => (
            <div key={`${color}-hole-${i}`} className="absolute flex items-center justify-center" style={{ width: `${100/15}%`, height: `${100/15}%`, top: `${r*(100/15)}%`, left: `${c*(100/15)}%` }}>
              <div className="w-[75%] h-[75%] rounded-full bg-black/10 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] border border-black/20" />
            </div>
          ))
        )}
      </div>

      {/* CENTER TRIANGLES */}
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] z-30 pointer-events-none drop-shadow-xl">
        <div className="relative w-full h-full border border-black/40 bg-black/80">
          <div className="absolute top-0 left-0 w-full h-0 border-l-[30px] border-r-[30px] border-t-[30px] border-transparent border-t-[#43A047] sm:border-l-[40px] sm:border-r-[40px] sm:border-t-[40px]" />
          <div className="absolute bottom-0 left-0 w-full h-0 border-l-[30px] border-r-[30px] border-b-[30px] border-transparent border-b-[#1E88E5] sm:border-l-[40px] sm:border-r-[40px] sm:border-b-[40px]" />
          <div className="absolute top-0 left-0 h-full w-0 border-t-[30px] border-b-[30px] border-l-[30px] border-transparent border-l-[#E53935] sm:border-t-[40px] sm:border-b-[40px] sm:border-l-[40px]" />
          <div className="absolute top-0 right-0 h-full w-0 border-t-[30px] border-b-[30px] border-r-[30px] border-transparent border-r-[#FDD835] sm:border-t-[40px] sm:border-b-[40px] sm:border-r-[40px]" />
        </div>
      </div>

      {/* ANIMATED TOKENS (MASSIVE SCALE FOR ZOOM) */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        {allTokens.map((t) => {
          if (t.isFinished || t.visPos >= 57) return null; 

          const trueStoreToken = players.find((p: Player) => p.color === t.playerColor)?.tokens[t.index];
          const isAnimating = t.visPos !== trueStoreToken?.position;
          
          const canMove = !isAnimating && currentPlayerTurn === t.playerColor && diceValue !== null && 
                         (t.position !== -1 || diceValue === 6) && (t.position + diceValue <= 57);

          const overlappingTokens = allTokens.filter(ot => ot.r === t.r && ot.c === t.c && ot.visPos !== -1);
          const overlapIndex = overlappingTokens.findIndex(ot => ot.id === t.id);
          const totalOverlap = overlappingTokens.length;

          // ZOOM FEATURE: Default scale changed from 0.8 to 0.95 (Much Bigger!)
          let shiftX = 0, shiftY = 0, scale = 0.95;
          if (totalOverlap > 1) {
            if (totalOverlap === 2) {
              scale = 0.7; // Bigger overlaps
              shiftX = overlapIndex === 0 ? -12 : 12;
              shiftY = overlapIndex === 0 ? -12 : 12;
            } else {
              scale = 0.55; 
              shiftX = overlapIndex % 2 === 0 ? -15 : 15;
              shiftY = overlapIndex < 2 ? -15 : 15;
            }
          }

          return (
            <div 
              key={t.id}
              className={`absolute pointer-events-auto transition-all duration-150 ease-linear transform-gpu will-change-transform flex items-center justify-center ${canMove ? 'z-50' : 'z-40'}`}
              style={{
                width: `${100 / 15}%`,
                height: `${100 / 15}%`,
                top: `${t.r * (100 / 15)}%`,
                left: `${t.c * (100 / 15)}%`,
                transform: `translate(${shiftX}%, ${shiftY}%) scale(${scale})`,
              }}
            >
              <button
                onClick={() => moveToken(t.playerColor, t.id)}
                disabled={!canMove}
                className={`relative w-[90%] h-[90%] rounded-full group transition-transform ${canMove ? 'cursor-pointer hover:scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse' : 'cursor-not-allowed'}`}
              >
                <div className={`absolute bottom-[-10%] left-[5%] w-[90%] h-[90%] rounded-full ${tokenThemes[t.playerColor as Color].base} shadow-[0_4px_6px_rgba(0,0,0,0.6)]`} />
                <div className="absolute inset-0 rounded-full border-[2px] border-white/90 shadow-inner bg-white flex items-center justify-center z-10">
                  <div className={`w-[80%] h-[80%] rounded-full ${tokenThemes[t.playerColor as Color].top} shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] flex items-start justify-center pt-[10%]`}>
                    <div className="w-[50%] h-[25%] bg-white/70 rounded-full blur-[0.5px]" />
                  </div>
                </div>
                {canMove && <div className="absolute -inset-2 border-[3px] border-white rounded-full animate-ping opacity-50 pointer-events-none z-0" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}