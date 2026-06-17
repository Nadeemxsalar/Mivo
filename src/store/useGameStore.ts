// src/store/useGameStore.ts
import { create } from 'zustand';
import { Color, Player, START_OFFSETS, SAFE_POSITIONS_GLOBAL } from '../types/game';

interface GameState {
  players: Player[];
  currentPlayerTurn: Color;
  diceValue: number | null;
  hasRolled: boolean;
  isAnimating: boolean;
  
  // NAYE FEATURES: Game Mode & Start/Exit
  gameStarted: boolean;
  activeColors: Color[];
  
  startGame: (playerCount: number) => void;
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
  gameStarted: false, // Menu dikhane ke liye
  activeColors: ['red', 'green', 'blue', 'yellow'],

  startGame: (playerCount: number) => {
    let active: Color[] = [];
    if (playerCount === 2) active = ['red', 'yellow']; // 2 Player: Aamne-Saamne
    else if (playerCount === 3) active = ['red', 'green', 'yellow']; 
    else active = ['red', 'green', 'blue', 'yellow'];

    set({
      gameStarted: true,
      activeColors: active,
      players: getInitialPlayers(), // Reset board
      currentPlayerTurn: active[0], // Start with Red
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
    
    const randomNum = Math.floor(Math.random() * 6) + 1;
    set({ diceValue: randomNum, hasRolled: true });

    const currentPlayer = state.players.find(p => p.color === state.currentPlayerTurn);
    if (currentPlayer) {
      const hasValidMove = currentPlayer.tokens.some(t => {
        if (t.isFinished) return false;
        if (t.position === -1) return randomNum === 6; 
        return (t.position + randomNum) <= 57; 
      });

      if (!hasValidMove) {
        setTimeout(() => {
          get().passTurn();
        }, 1200); 
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
        newRelativePos += diceVal;
        stepsToMove = diceVal; 
        if (newRelativePos > 57) return prevState; 
        
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

      const animationTime = (stepsToMove * 150) + 300;

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