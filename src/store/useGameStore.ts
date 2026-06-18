// src/store/useGameStore.ts
import { create } from 'zustand';
import { Color, Player, START_OFFSETS, SAFE_POSITIONS_GLOBAL, Token } from '../types/game';

interface GameState {
  players: Player[];
  currentPlayerTurn: Color;
  diceValue: number | null;
  hasRolled: boolean;
  isAnimating: boolean;
  activeColors: Color[]; 
  gameStarted: boolean;
  isRobotMode: boolean; 
  
  // Settings & Performance States
  animationType: 'jump' | 'smooth';
  isFastMode: boolean;
  soundEnabled: boolean;
  
  // NAYE ADVANCED FEATURES STATES
  leaderboard: { color: Color; finishedCount: number }[];
  hoveredTokenId: string | null; // For Path Trace preview
  
  setPreferences: (pref: { animationType?: 'jump' | 'smooth', isFastMode?: boolean, soundEnabled?: boolean }) => void;
  setHoveredToken: (tokenId: string | null) => void; // Path trace indicator state setter
  startGame: (playerCount: number, isRobot: boolean) => void;
  exitGame: () => void;
  rollDice: () => void;
  moveToken: (playerColor: Color, tokenId: string) => void;
  passTurn: () => void; 
  updateLeaderboard: () => void;
}

const getInitialPlayers = (): Player[] => ['red', 'green', 'yellow', 'blue'].map((color) => ({
  id: `player-${color}`,
  color: color as Color,
  isActive: true,
  tokens: [0, 1, 2, 3].map((num) => ({
    id: `${color}-t${num}`,
    color: color as Color,
    position: -1, 
    isFinished: false,
  })),
}));

const getGlobalPosition = (color: Color, relativePos: number): string | number => {
  if (relativePos === -1) return `base-${color}`;
  if (relativePos > 50) return `home-${color}-${relativePos}`; 
  return (START_OFFSETS[color] + relativePos) % 52;
};

export const useGameStore = create<GameState>((set, get) => ({
  players: getInitialPlayers(),
  currentPlayerTurn: 'red', 
  diceValue: null,
  hasRolled: false,
  isAnimating: false,
  gameStarted: false,
  isRobotMode: false,
  activeColors: ['red', 'green', 'blue', 'yellow'],
  animationType: 'jump',
  isFastMode: false,
  soundEnabled: true,
  
  // Initializing new features states cleanly
  leaderboard: [],
  hoveredTokenId: null,

  setPreferences: (pref) => set((state) => ({ ...state, ...pref })),
  
  setHoveredToken: (tokenId) => set({ hoveredTokenId: tokenId }),

  updateLeaderboard: () => {
    const { players, activeColors } = get();
    const currentLeaderboard = activeColors.map(color => {
      const p = players.find(player => player.color === color);
      const finishedCount = p ? p.tokens.filter(t => t.isFinished).length : 0;
      return { color, finishedCount };
    }).sort((a, b) => b.finishedCount - a.finishedCount);
    
    set({ leaderboard: currentLeaderboard });
  },

  startGame: (playerCount: number, isRobot: boolean) => {
    let active: Color[] = [];
    if (playerCount === 2) active = ['red', 'yellow']; 
    else if (playerCount === 3) active = ['red', 'green', 'yellow']; 
    else active = ['red', 'green', 'blue', 'yellow'];

    set({
      gameStarted: true,
      isRobotMode: isRobot,
      activeColors: active,
      players: getInitialPlayers(), 
      currentPlayerTurn: active[0], 
      diceValue: null,
      hasRolled: false,
      isAnimating: false,
      hoveredTokenId: null
    });
    get().updateLeaderboard();
  },

  exitGame: () => {
    set({ gameStarted: false });
  },

  passTurn: () => {
    set((state) => {
      const currentIndex = state.activeColors.indexOf(state.currentPlayerTurn);
      const nextTurn = state.activeColors[(currentIndex + 1) % state.activeColors.length];
      return { currentPlayerTurn: nextTurn, diceValue: null, hasRolled: false, isAnimating: false };
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.isAnimating) return;
    
    let randomNum = Math.floor(Math.random() * 6) + 1;
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      randomNum = (array[0] % 6) + 1; 
    }

    set({ diceValue: randomNum, hasRolled: true });

    const currentPlayer = state.players.find(p => p.color === state.currentPlayerTurn);
    if (currentPlayer) {
      const validTokens = currentPlayer.tokens.filter(t => {
        if (t.isFinished) return false;
        if (t.position === -1) return randomNum === 6; 
        return (t.position + randomNum) <= 57; 
      });

      // FEATURE 3: SMART SNAP NO-MOVE AUTO SKIP (0ms Lag Pass Turn)
      if (validTokens.length === 0) {
        setTimeout(() => {
          get().passTurn();
        }, state.isFastMode ? 200 : 400); // Super optimized instant pass execution
      } 
      // AUTO-MOVE SMART ASSIST
      else if (validTokens.length === 1 && (!state.isRobotMode || state.currentPlayerTurn === 'yellow')) {
        setTimeout(() => {
          get().moveToken(state.currentPlayerTurn, validTokens[0].id);
        }, state.isFastMode ? 350 : 600);
      }
    }
  },

  moveToken: (playerColor, tokenId) => {
    const state = get();
    if (state.currentPlayerTurn !== playerColor || !state.hasRolled || !state.diceValue || state.isAnimating) return;

    const diceVal = state.diceValue;

    set((prevState) => {
      // Memory Optimization: Slice variables to strictly offload calculations
      const newPlayers = JSON.parse(JSON.stringify(prevState.players)) as Player[];
      const playerIndex = newPlayers.findIndex(p => p.color === playerColor);
      const token = newPlayers[playerIndex].tokens.find(t => t.id === tokenId);

      if (!token || token.isFinished) return prevState; 

      let newRelativePos = token.position;
      let getsExtraTurn = false;
      let stepsToMove = 0; 

      if (token.position === -1) {
        if (diceVal !== 6) return prevState; 
        newRelativePos = 0;
        stepsToMove = 1; 
        getsExtraTurn = true; 
      } else {
        if (newRelativePos + diceVal > 57) return prevState;
        newRelativePos += diceVal;
        stepsToMove = diceVal; 
        
        if (newRelativePos === 57) {
          token.isFinished = true;
          getsExtraTurn = true; 
        }
      }

      token.position = newRelativePos;

      const newGlobalPos = getGlobalPosition(playerColor, newRelativePos);
      let killedSomeone = false;
      
      if (typeof newGlobalPos === 'number' && !SAFE_POSITIONS_GLOBAL.includes(newGlobalPos)) {
        newPlayers.forEach(p => {
          if (p.color !== playerColor && prevState.activeColors.includes(p.color)) {
            p.tokens.forEach(enemyToken => {
              const enemyGlobal = getGlobalPosition(p.color, enemyToken.position);
              if (enemyGlobal === newGlobalPos && enemyToken.position !== -1) {
                enemyToken.position = -1; 
                getsExtraTurn = true;    
                killedSomeone = true;
              }
            });
          }
        });
      }

      let nextTurn = prevState.currentPlayerTurn;
      if (diceVal === 6 || killedSomeone) getsExtraTurn = true; 

      if (!getsExtraTurn) {
        const currentIndex = prevState.activeColors.indexOf(nextTurn);
        nextTurn = prevState.activeColors[(currentIndex + 1) % prevState.activeColors.length];
      }

      const stepTime = prevState.isFastMode ? 80 : 150;
      const animationTime = (stepsToMove * stepTime) + 300;

      setTimeout(() => {
        useGameStore.setState({ 
          currentPlayerTurn: nextTurn, 
          diceValue: null, 
          hasRolled: false,
          isAnimating: false,
          hoveredTokenId: null
        });
        // Garbage Collection and Leaderboard sync at the tail-end of action
        get().updateLeaderboard();
      }, animationTime);

      return { players: newPlayers, isAnimating: true };
    });
  }
}));