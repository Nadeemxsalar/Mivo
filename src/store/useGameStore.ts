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
  
  // Settings & Preferences States
  animationType: 'jump' | 'smooth';
  isFastMode: boolean;
  soundEnabled: boolean; // FEATURE 3: Sound toggle support state
  
  setPreferences: (pref: { animationType?: 'jump' | 'smooth', isFastMode?: boolean, soundEnabled?: boolean }) => void;
  startGame: (playerCount: number, isRobot: boolean) => void;
  exitGame: () => void;
  rollDice: () => void;
  moveToken: (playerColor: Color, tokenId: string) => void;
  passTurn: () => void; 
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
  
  // Default Settings Parameters
  animationType: 'jump',
  isFastMode: false,
  soundEnabled: true,

  setPreferences: (pref) => set((state) => ({ ...state, ...pref })),

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
      isAnimating: false
    });
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
    
    // Casino-Grade Crypto Randomness (100% Fair Random)
    let randomNum = Math.floor(Math.random() * 6) + 1;
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      randomNum = (array[0] % 6) + 1; 
    }

    set({ diceValue: randomNum, hasRolled: true });

    const currentPlayer = state.players.find(p => p.color === state.currentPlayerTurn);
    if (currentPlayer) {
      // Find all tokens that can legally move
      const validTokens = currentPlayer.tokens.filter(t => {
        if (t.isFinished) return false;
        if (t.position === -1) return randomNum === 6; 
        return (t.position + randomNum) <= 57; 
      });

      if (validTokens.length === 0) {
        // No moves possible -> Auto Pass turn
        setTimeout(() => {
          get().passTurn();
        }, state.isFastMode ? 600 : 1200); 
      } 
      // FEATURE 1: AUTO-MOVE SMART ASSIST (If only 1 token can move, play it automatically)
      else if (validTokens.length === 1 && (!state.isRobotMode || state.currentPlayerTurn === 'yellow')) {
        setTimeout(() => {
          get().moveToken(state.currentPlayerTurn, validTokens[0].id);
        }, state.isFastMode ? 400 : 800);
      }
    }
  },

  moveToken: (playerColor, tokenId) => {
    const state = get();
    if (state.currentPlayerTurn !== playerColor || !state.hasRolled || !state.diceValue || state.isAnimating) return;

    const diceVal = state.diceValue;

    set((prevState) => {
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
              if (enemyGlobal === enemyGlobal && enemyGlobal === newGlobalPos && enemyToken.position !== -1) {
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
          isAnimating: false 
        });
      }, animationTime);

      return { players: newPlayers, isAnimating: true };
    });
  }
}));