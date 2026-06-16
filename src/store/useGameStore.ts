// src/store/useGameStore.ts
import { create } from 'zustand';
import { Color, Player, START_OFFSETS, SAFE_POSITIONS_GLOBAL } from '../types/game';

interface GameState {
  players: Player[];
  currentPlayerTurn: Color;
  diceValue: number | null;
  hasRolled: boolean;
  
  rollDice: () => void;
  moveToken: (playerColor: Color, tokenId: string) => void;
  passTurn: () => void; 
}

const initialPlayers: Player[] = ['red', 'green', 'yellow', 'blue'].map((color) => ({
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
  players: initialPlayers,
  currentPlayerTurn: 'red', 
  diceValue: null,
  hasRolled: false,

  passTurn: () => {
    set((state) => {
      const colors: Color[] = ['red', 'green', 'yellow', 'blue'];
      const nextTurn = colors[(colors.indexOf(state.currentPlayerTurn) + 1) % 4];
      return { currentPlayerTurn: nextTurn, diceValue: null, hasRolled: false };
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled) return;
    
    const randomNum = Math.floor(Math.random() * 6) + 1;
    set({ diceValue: randomNum, hasRolled: true });

    // AUTO-PASS LOGIC (Advanced AI Check)
    const currentPlayer = state.players.find(p => p.color === state.currentPlayerTurn);
    if (currentPlayer) {
      // Check karte hain kya is player ki koi bhi ek goti chal sakti hai?
      const hasValidMove = currentPlayer.tokens.some(t => {
        if (t.isFinished) return false;
        if (t.position === -1) return randomNum === 6; // Base mein hai toh 6 chahiye
        return (t.position + randomNum) <= 57; // Path par hai toh limit check
      });

      // Agar koi valid move nahi hai, toh 1.2 seconds baad automatically turn pass kar do
      if (!hasValidMove) {
        setTimeout(() => {
          get().passTurn();
        }, 1200); 
      }
    }
  },

  moveToken: (playerColor, tokenId) => {
    const state = get();
    if (state.currentPlayerTurn !== playerColor || !state.hasRolled || !state.diceValue) return;

    const diceVal = state.diceValue;

    set((prevState) => {
      const newPlayers = JSON.parse(JSON.stringify(prevState.players)) as Player[];
      const playerIndex = newPlayers.findIndex(p => p.color === playerColor);
      const token = newPlayers[playerIndex].tokens.find(t => t.id === tokenId);

      if (!token || token.isFinished) return prevState; 

      let newRelativePos = token.position;
      let getsExtraTurn = false;

      // 1. BASE LOGIC
      if (token.position === -1) {
        if (diceVal !== 6) return prevState; 
        newRelativePos = 0;
        getsExtraTurn = true; 
      } 
      // 2. PATH LOGIC
      else {
        newRelativePos += diceVal;
        if (newRelativePos > 57) return prevState; 
        
        if (newRelativePos === 57) {
          token.isFinished = true;
          getsExtraTurn = true; // Win hone par bonus
        }
      }

      token.position = newRelativePos;

      // 3. CUTTING LOGIC (Doosre ki goti katna)
      const newGlobalPos = getGlobalPosition(playerColor, newRelativePos);
      
      if (typeof newGlobalPos === 'number' && !SAFE_POSITIONS_GLOBAL.includes(newGlobalPos)) {
        newPlayers.forEach(p => {
          if (p.color !== playerColor) {
            p.tokens.forEach(enemyToken => {
              const enemyGlobal = getGlobalPosition(p.color, enemyToken.position);
              if (enemyGlobal === newGlobalPos) {
                enemyToken.position = -1; // Wapas ghar jao
                getsExtraTurn = true;     // Goti katne par extra turn
              }
            });
          }
        });
      }

      // 4. TURN MANAGEMENT
      let nextTurn = prevState.currentPlayerTurn;
      if (diceVal === 6) getsExtraTurn = true; 

      if (!getsExtraTurn) {
        const colors: Color[] = ['red', 'green', 'yellow', 'blue'];
        nextTurn = colors[(colors.indexOf(nextTurn) + 1) % 4];
      }

      return { 
        players: newPlayers, 
        currentPlayerTurn: nextTurn, 
        diceValue: null, 
        hasRolled: false 
      };
    });
  }
}));