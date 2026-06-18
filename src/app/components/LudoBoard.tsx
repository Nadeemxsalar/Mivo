// src/app/components/LudoBoard.tsx
'use client';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Color, Token, START_OFFSETS, Player } from '../../types/game';

// Custom Star SVG
const StarIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className="w-[70%] h-[70%] drop-shadow-md z-10 opacity-90">
    <path stroke="rgba(0,0,0,0.5)" strokeWidth="1" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ArrowIcon = ({ rotation }: { rotation: string }) => (
  <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" className="absolute w-[60%] h-[60%] drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] z-0" style={{ transform: `rotate(${rotation})` }}>
    <path d="M12 4l-8 8h6v8h4v-8h6z" />
  </svg>
);

const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FFD700" className="absolute -top-3 sm:-top-4 w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-50">
    <path d="M2 22h20v2H2v-2zm2-2l3-10 5 4 5-4 3 10H4z" />
    <circle cx="5" cy="8" r="2" fill="#FFD700" />
    <circle cx="12" cy="5" r="2" fill="#FFD700" />
    <circle cx="19" cy="8" r="2" fill="#FFD700" />
  </svg>
);

const CenterTajIcon = () => (
  <svg viewBox="0 0 100 100" fill="none" className="w-[70%] h-[70%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-[subtleBounce_2.5s_ease-in-out_infinite]">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF9C4" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="70%" stopColor="#F57F17" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
      <radialGradient id="jewelRed" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="100%" stopColor="#d32f2f" />
      </radialGradient>
      <radialGradient id="jewelBlue" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#82b1ff" />
        <stop offset="100%" stopColor="#1976d2" />
      </radialGradient>
      <radialGradient id="jewelGreen" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#b9f6ca" />
        <stop offset="100%" stopColor="#388e3c" />
      </radialGradient>
    </defs>
    <path d="M 20 80 L 80 80 L 85 90 L 15 90 Z" fill="url(#goldGrad)" stroke="#fff" strokeWidth="0.5" />
    <path d="M 25 75 L 10 30 L 35 50 L 50 15 L 65 50 L 90 30 L 75 75 Z" fill="url(#goldGrad)" stroke="#FFE082" strokeWidth="1" />
    <circle cx="10" cy="25" r="5.5" fill="url(#jewelRed)" stroke="#fff" strokeWidth="1" />
    <circle cx="50" cy="10" r="6.5" fill="url(#jewelBlue)" stroke="#fff" strokeWidth="1" />
    <circle cx="90" cy="25" r="5.5" fill="url(#jewelGreen)" stroke="#fff" strokeWidth="1" />
    <circle cx="35" cy="58" r="3" fill="#FFF" opacity="0.9" />
    <circle cx="65" cy="58" r="3" fill="#FFF" opacity="0.9" />
    <circle cx="50" cy="65" r="4.5" fill="url(#jewelRed)" stroke="#fff" strokeWidth="0.5" />
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

const PATH_RATIO = 1.15; 
const TRACK_RATIOS = [1, 1, 1, 1, 1, 1, PATH_RATIO, PATH_RATIO, PATH_RATIO, 1, 1, 1, 1, 1, 1];
const TOTAL_RATIO = 12 + (3 * PATH_RATIO); 

const getTrackPos = (index: number) => {
  let sum = 0;
  for (let i = 0; i < index; i++) sum += TRACK_RATIOS[i];
  return (sum / TOTAL_RATIO) * 100;
};

const getTrackSize = (index: number) => {
  return (TRACK_RATIOS[index] / TOTAL_RATIO) * 100;
};

const BASE_CELL_PCT = (1 / TOTAL_RATIO) * 100; 
const TOKEN_SIZE = BASE_CELL_PCT * 0.85; 
const BASE_CONTAINER_PCT = `${(6 / TOTAL_RATIO) * 100}%`;
const CENTER_CONTAINER_PCT = `${(3 * PATH_RATIO / TOTAL_RATIO) * 100}%`;

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

const getStartDirection = (r: number, c: number) => {
  if (r === 6 && c === 1) return '90deg'; 
  if (r === 1 && c === 8) return '180deg'; 
  if (r === 8 && c === 13) return '-90deg'; 
  if (r === 13 && c === 6) return '0deg'; 
  return null;
};

export default function LudoBoard() {
  const players = useGameStore((state: any) => state.players);
  const moveToken = useGameStore((state: any) => state.moveToken);
  const currentPlayerTurn = useGameStore((state: any) => state.currentPlayerTurn);
  const diceValue = useGameStore((state: any) => state.diceValue);
  const hasRolled = useGameStore((state: any) => state.hasRolled);
  
  const isRobotMode = useGameStore((state: any) => state.isRobotMode);
  const isAnimatingStore = useGameStore((state: any) => state.isAnimating);
  const isFastMode = useGameStore((state: any) => state.isFastMode);
  const animationType = useGameStore((state: any) => state.animationType);
  const leaderboard = useGameStore((state: any) => state.leaderboard);
  
  const hoveredTokenId = useGameStore((state: any) => state.hoveredTokenId);
  const setHoveredToken = useGameStore((state: any) => state.setHoveredToken);

  // NEW ADVANCED STORE STATES CONNECTED
  const recommendedTokenId = useGameStore((state: any) => state.recommendedTokenId);
  const safeTokens = useGameStore((state: any) => state.safeTokens);
  const ragePlayers = useGameStore((state: any) => state.ragePlayers);

  const visualPosRef = useRef<Record<string, number>>({});
  const [renderTick, setRenderTick] = useState(0);

  const stepDuration = isFastMode ? 80 : 150; 

  useEffect(() => {
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token) => {
        if (visualPosRef.current[t.id] === undefined) {
          visualPosRef.current[t.id] = t.position;
        }
      });
    });
    setRenderTick(1);
  }, []); 

  // =====================================
  // ADVANCED STEP-BY-STEP & SILKY SMOOTH REWIND KILL ENGINE
  // =====================================
  useEffect(() => {
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token) => {
        const targetPos = t.position;
        const currentVisPos = visualPosRef.current[t.id];

        if (currentVisPos !== undefined && currentVisPos !== targetPos) {
          if (targetPos === -1 && currentVisPos > -1) {
            let step = currentVisPos;
            const rewind = () => {
              step = Math.max(-1, step - 1); 
              visualPosRef.current[t.id] = step;
              setRenderTick(v => v + 1);
              if (step > -1) {
                setTimeout(rewind, isFastMode ? 25 : 45); 
              }
            };
            setTimeout(rewind, isFastMode ? 25 : 45);
          } 
          else if (targetPos > currentVisPos) {
            let step = currentVisPos;
            const hop = () => {
              step++;
              visualPosRef.current[t.id] = step;
              setRenderTick(v => v + 1);
              if (step < targetPos) {
                setTimeout(hop, stepDuration); 
              }
            };
            setTimeout(hop, stepDuration);
          } else {
            visualPosRef.current[t.id] = targetPos;
            setRenderTick(v => v + 1);
          }
        }
      });
    });
  }, [players, stepDuration, isFastMode]);

  const allTokens = useMemo(() => {
    let tokensArr: any[] = [];
    players.forEach((p: Player) => {
      p.tokens.forEach((t: Token, index: number) => {
        let r = 0, c = 0;
        const playerColor = p.color as Color;
        const visPos = visualPosRef.current[t.id] ?? t.position;
        
        if (t.isFinished || visPos >= 56) { // EXACT WIN CONFIGURATION
          r = 7; c = 7; 
        } else if (visPos === -1) {
          [r, c] = BASE_COORDS[playerColor][index]; 
        } else if (visPos <= 50) {
          const globalPos = (START_OFFSETS[playerColor] + visPos) % 52;
          [r, c] = PATH_COORDS[globalPos]; 
        } else {
          [r, c] = HOME_PATHS[playerColor][visPos - 51]; 
        }
        
        tokensArr.push({ ...t, r, c, playerColor, index, visPos, isFinished: t.isFinished });
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
      <div className="absolute inset-0 grid bg-slate-900 z-0" style={{ 
        gridTemplateColumns: TRACK_RATIOS.map(r => `${r}fr`).join(' '), 
        gridTemplateRows: TRACK_RATIOS.map(r => `${r}fr`).join(' '), 
        gap: '1px' 
      }}>
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => {
            const isHomeCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
            const startDirection = getStartDirection(r, c);
            const isStar = isStarSpot(r, c);

            return (
              <div key={`grid-${r}-${c}`} className="relative flex items-center justify-center border-[0.5px] border-black/10 overflow-hidden" style={getCellStyles(r, c)}>
                {isStar && !isHomeCenter && <StarIcon color={startDirection ? '#fff' : '#ccc'} />}
                {startDirection && !isHomeCenter && <ArrowIcon rotation={startDirection} />}
              </div>
            );
          })
        )}
      </div>
    );
  }, []);

  // Ghost Trace Calculation
  let ghostPos = null;
  if (hoveredTokenId && !isAnimatingStore && diceValue !== null && hasRolled) {
    const activePlayer = players.find((p: Player) => p.color === currentPlayerTurn);
    const hoveredT = activePlayer?.tokens.find((t: Token) => t.id === hoveredTokenId);
    
    if (hoveredT && !hoveredT.isFinished) {
      let targetP = hoveredT.position;
      
      if (targetP === -1 && diceValue === 6) targetP = 0;
      else if (targetP > -1 && targetP + diceValue <= 56) targetP += diceValue;
      else targetP = -2; 

      if (targetP > -1) {
        let gr = 0, gc = 0;
        if (targetP >= 56) { 
          gr = 7; gc = 7; 
        } else if (targetP <= 50) {
          const gPos = (START_OFFSETS[currentPlayerTurn as Color] + targetP) % 52;
          [gr, gc] = PATH_COORDS[gPos];
        } else {
          [gr, gc] = HOME_PATHS[currentPlayerTurn as Color][targetP - 51];
        }
        ghostPos = { r: gr, c: gc, color: currentPlayerTurn as Color };
      }
    }
  }

  return (
    <div className="relative w-full h-full aspect-square bg-slate-800 overflow-hidden shadow-inner @container">
      <style>{`
        @keyframes subtleBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15%); } }
        @keyframes hopAnim { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-28%) scale(1.18); } }
        .anim-hop { animation: hopAnim ${stepDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; }
        
        @keyframes gotiKillSpin { 0% { transform: scale(1.1) rotate(0deg); filter: drop-shadow(0 0 15px #ef4444) brightness(1.8); } 100% { transform: scale(0.8) rotate(-720deg); filter: drop-shadow(0 0 5px #ef4444) brightness(1.2); } }
        .anim-kill { animation: gotiKillSpin 0.25s linear infinite !important; }
        
        @keyframes winShockwave { 0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.9); transform: scale(1); opacity: 1; } 100% { box-shadow: 0 0 0 40px rgba(255, 215, 0, 0); transform: scale(1.6); opacity: 0; } }
        .anim-shockwave { animation: winShockwave 0.6s ease-out; }

        @keyframes gentleLevitate { 0%, 100% { transform: translateY(0) scale(1.08); } 50% { transform: translateY(-12%) scale(1.08); } }
        .ultra-playable-btn { animation: gentleLevitate 1.2s ease-in-out infinite !important; border: 2px solid white !important; box-shadow: 0 6px 12px rgba(0,0,0,0.5) !important; }
        
        @keyframes targetPulse { 0% { transform: scale(1); opacity: 0.8; border-width: 3px; } 100% { transform: scale(1.8); opacity: 0; border-width: 1px; } }
        .target-ring-pulse { animation: targetPulse 1.2s ease-out infinite; border-style: solid; }

        /* NEW FEATURE VISUALS: Hint Ring & Rage Vibe */
        @keyframes hintPulseRing { 0% { transform: scale(1); opacity: 1; border-color: #00e6ff; } 100% { transform: scale(1.7); opacity: 0; border-width: 1.5px; } }
        .hint-ring-anim { animation: hintPulseRing 1s ease-out infinite; }
        
        @keyframes rageHeartbeat { 0%, 100% { filter: drop-shadow(0 0 8px #ff3300) brightness(1.1); transform: scale(1); } 50% { filter: drop-shadow(0 0 25px #ff0000) brightness(1.4); transform: scale(1.1); } }
        .rage-mode-active { animation: rageHeartbeat 0.6s ease-in-out infinite !important; border: 2px solid #ff4444 !important; }
      `}</style>
      
      {renderStaticGrid}

      <div className="absolute top-0 left-0 bg-[#E53935] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-r border-b border-black/30" style={{ width: BASE_CONTAINER_PCT, height: BASE_CONTAINER_PCT }}>
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute top-0 right-0 bg-[#43A047] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-l border-b border-black/30" style={{ width: BASE_CONTAINER_PCT, height: BASE_CONTAINER_PCT }}>
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute bottom-0 left-0 bg-[#1E88E5] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-r border-t border-black/30" style={{ width: BASE_CONTAINER_PCT, height: BASE_CONTAINER_PCT }}>
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>
      <div className="absolute bottom-0 right-0 bg-[#FDD835] z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-l border-t border-black/30" style={{ width: BASE_CONTAINER_PCT, height: BASE_CONTAINER_PCT }}>
        <div className="absolute top-[16.66%] left-[16.66%] w-[66.66%] h-[66.66%] bg-[#f8f9fa] rounded-xl sm:rounded-2xl shadow-inner border-[2px] border-black/10" />
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
        {Object.entries(BASE_COORDS).map(([color, coords]) =>
          coords.map(([r, c], i) => (
            <div key={`${color}-hole-${i}`} className="absolute flex items-center justify-center" 
                 style={{ width: `${getTrackSize(c)}%`, height: `${getTrackSize(r)}%`, top: `${getTrackPos(r)}%`, left: `${getTrackPos(c)}%` }}>
              <div className="w-[75%] h-[75%] rounded-full bg-black/10 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] border border-black/20" />
            </div>
          ))
        )}
      </div>

      <div className="absolute z-30 pointer-events-none drop-shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center justify-center overflow-hidden border-[2px] sm:border-[3px] border-[#FFD700] shadow-[inset_0_0_20px_rgba(0,0,0,0.7)] bg-[#111]" 
           style={{ top: BASE_CONTAINER_PCT, left: BASE_CONTAINER_PCT, width: CENTER_CONTAINER_PCT, height: CENTER_CONTAINER_PCT }}>
        
        <div className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] animate-[spin_10s_linear_infinite] opacity-40 mix-blend-screen" 
             style={{ background: 'conic-gradient(from 0deg, transparent 0deg, #ffffff 30deg, transparent 60deg, #ffffff 90deg, transparent 120deg, #ffffff 150deg, transparent 180deg, #ffffff 210deg, transparent 240deg, #ffffff 270deg, transparent 300deg, #ffffff 330deg)' }} />

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-90">
          <defs>
            <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <polygon points="0,0 100,0 50,50" fill="#2E7D32" /> 
          <polygon points="100,0 100,100 50,50" fill="#FBC02D" /> 
          <polygon points="0,100 100,100 50,50" fill="#1565C0" /> 
          <polygon points="0,0 0,100 50,50" fill="#D32F2F" /> 
          
          <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <polygon points="0,0 100,0 100,100 0,100" fill="url(#glass)" pointerEvents="none" />
        </svg>

        <div className="absolute w-[60%] h-[60%] bg-gradient-to-br from-yellow-200 via-yellow-500 to-amber-700 rounded-full shadow-[0_0_20px_rgba(255,215,0,1)] border-[2px] sm:border-[3px] border-white/60 flex items-center justify-center z-10">
          <div className="w-[85%] h-[85%] bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center relative overflow-hidden">
            <CenterTajIcon />
          </div>
        </div>
      </div>

      {ghostPos && (
        <div className="absolute z-30 pointer-events-none flex items-center justify-center opacity-50 transition-all duration-150 mix-blend-screen"
             style={{ width: `${getTrackSize(ghostPos.c)}%`, height: `${getTrackSize(ghostPos.r)}%`, top: `${getTrackPos(ghostPos.r)}%`, left: `${getTrackPos(ghostPos.c)}%` }}>
           <div className={`w-[85%] h-[85%] rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse`} />
        </div>
      )}

      {/* LAYER 5: Animated Tokens */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        {allTokens.map((t) => {
          const trueStoreToken = players.find((p: Player) => p.color === t.playerColor)?.tokens[t.index];
          const isAnimating = t.visPos !== trueStoreToken?.position;
          
          const isGettingKilled = trueStoreToken?.position === -1 && t.visPos > -1;
          const justFinished = t.visPos === 56 && trueStoreToken?.position === 56 && isAnimating;
          
          const canMove = !isAnimating && !isGettingKilled && currentPlayerTurn === t.playerColor && diceValue !== null && 
                         (t.position !== -1 || diceValue === 6) && (t.position + diceValue <= 56);

          const overlappingTokens = allTokens.filter(ot => ot.r === t.r && ot.c === t.c && ot.visPos !== -1 && ot.visPos < 56);
          const overlapIndex = overlappingTokens.findIndex(ot => ot.id === t.id);
          const totalOverlap = overlappingTokens.length;

          let shiftX = 0, shiftY = 0, scale = 0.95;
          if (totalOverlap > 1 && !t.isFinished && t.visPos < 56 && !isGettingKilled) { 
            scale = 0.55; 
            if (totalOverlap === 2) {
              shiftX = overlapIndex === 0 ? -15 : 15;
              shiftY = overlapIndex === 0 ? -15 : 15;
            } else if (totalOverlap === 3) {
              shiftX = overlapIndex === 0 ? 0 : (overlapIndex === 1 ? -18 : 18);
              shiftY = overlapIndex === 0 ? -18 : 15;
            } else {
              shiftX = overlapIndex % 2 === 0 ? -18 : 18;
              shiftY = overlapIndex < 2 ? -18 : 18;
            }
          }

          if (t.isFinished || t.visPos >= 56) {
            scale = 0.55;
            if (t.playerColor === 'red') { shiftX = -28; shiftY = 0; }
            else if (t.playerColor === 'green') { shiftX = 0; shiftY = -28; }
            else if (t.playerColor === 'yellow') { shiftX = 28; shiftY = 0; }
            else if (t.playerColor === 'blue') { shiftX = 0; shiftY = 28; }
          }

          const isJumpingNow = isAnimating && animationType === 'jump' && t.visPos > -1 && t.visPos < 56;
          
          // ADVANCED VISUAL FEATURE TRIGGERS
          const isRecommended = canMove && recommendedTokenId === t.id;
          const isSafe = safeTokens[t.id] && t.visPos !== -1 && t.visPos !== 56;
          const isRage = ragePlayers[t.playerColor] && t.visPos > -1 && t.visPos < 56;

          return (
            <div 
              key={t.id}
              className={`absolute pointer-events-auto transform-gpu flex items-center justify-center ${canMove ? 'z-50' : 'z-40'} ${isGettingKilled ? 'z-50' : ''}`}
              style={{
                width: `${getTrackSize(t.c)}%`,
                height: `${getTrackSize(t.r)}%`,
                top: `${getTrackPos(t.r)}%`,
                left: `${getTrackPos(t.c)}%`,
                transform: `translate(${shiftX}%, ${shiftY}%) scale(${scale})`,
                transition: isGettingKilled ? 'none' : `top ${stepDuration}ms linear, left ${stepDuration}ms linear, transform ${stepDuration}ms ease-out`
              }}
            >
              {justFinished && <div className="absolute inset-0 rounded-full anim-shockwave pointer-events-none" />}

              {/* FEATURE: Target Pulse Ring */}
              {canMove && !isRecommended && (
                <div className="absolute inset-0 rounded-full pointer-events-none z-0 target-ring-pulse" style={{ borderColor: colors[t.playerColor as Color] }} />
              )}

              {/* FEATURE: Smart Hint Engine Cyan Ring */}
              {isRecommended && (
                <div className="absolute inset-[-30%] rounded-full z-0 hint-ring-anim border-2 border-dashed border-[#00e6ff] pointer-events-none" />
              )}

              <button
                onClick={() => moveToken(t.playerColor, t.id)}
                onMouseEnter={() => canMove && setHoveredToken(t.id)}
                onMouseLeave={() => setHoveredToken(null)}
                disabled={!canMove}
                className={`relative rounded-full group transition-all ${isJumpingNow ? 'anim-hop' : ''} ${canMove ? 'cursor-pointer ultra-playable-btn' : 'cursor-not-allowed'} ${isGettingKilled ? 'anim-kill' : ''} ${isRage ? 'rage-mode-active' : ''}`}
                style={{ width: `${TOKEN_SIZE}cqw`, height: `${TOKEN_SIZE}cqw` }}
              >
                {t.isFinished && <CrownIcon />}
                
                {/* FEATURE: Safe Zone Transparent Shield */}
                {isSafe && (
                  <div className="absolute inset-0 bg-blue-400/30 rounded-full border border-blue-200/80 backdrop-blur-[1px] flex items-center justify-center z-20 shadow-[0_0_10px_rgba(96,165,250,0.8)]">
                    <span className="text-[10px] drop-shadow-md">🛡️</span>
                  </div>
                )}

                {/* FEATURE: Rage Mode Thunderbolt Badge */}
                {isRage && !isSafe && (
                  <div className="absolute -top-1 -right-1 z-30 drop-shadow-md text-[10px]">⚡</div>
                )}
                
                <div className={`absolute bottom-[-10%] left-[5%] w-[90%] h-[90%] rounded-full ${tokenThemes[t.playerColor as Color].base} shadow-[0_4px_6px_rgba(0,0,0,0.6)]`} />
                <div className="absolute inset-0 rounded-full border-[2px] border-white/90 shadow-inner bg-white flex items-center justify-center z-10">
                  <div className={`w-[80%] h-[80%] rounded-full ${tokenThemes[t.playerColor as Color].top} shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] flex items-start justify-center pt-[10%]`}>
                    <div className="w-[50%] h-[25%] bg-white/70 rounded-full blur-[0.5px]" />
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}