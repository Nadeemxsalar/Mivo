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
  
  leaderboard: { color: Color; finishedCount: number }[];
  hoveredTokenId: string | null; 
  
  // 5 ADVANCED FEATURES STATES
  sixStreakCount: number; 
  recommendedTokenId: string | null; 
  gameStats: Record<Color, { totalKills: number; totalSixes: number; distanceTraveled: number }>; 
  safeTokens: Record<string, boolean>; 
  ragePlayers: Record<Color, boolean>; 

  // NEW MULTI-WINNER STATES
  winners: Color[];
  gameFinished: boolean;

  setPreferences: (pref: { animationType?: 'jump' | 'smooth', isFastMode?: boolean, soundEnabled?: boolean }) => void;
  setHoveredToken: (tokenId: string | null) => void; 
  startGame: (playerCount: number, isRobot: boolean) => void;
  exitGame: () => void;
  rollDice: () => void;
  moveToken: (playerColor: Color, tokenId: string) => void;
  passTurn: () => void; 
  updateLeaderboard: () => void;
}

// Helper to calculate next turn strictly clockwise while skipping finished players
const getNextTurnColor = (currentTurn: Color, activeColors: Color[], players: Player[]): Color => {
  let idx = activeColors.indexOf(currentTurn);
  for (let i = 1; i <= activeColors.length; i++) {
    const nextColor = activeColors[(idx + i) % activeColors.length];
    const p = players.find(player => player.color === nextColor);
    const isDone = p ? p.tokens.filter(t => t.isFinished).length === 4 : false;
    if (!isDone) return nextColor;
  }
  return currentTurn;
};

const getGlobalPosition = (color: Color, relativePos: number): string | number => {
  if (relativePos === -1) return `base-${color}`;
  if (relativePos > 50) return `home-${color}-${relativePos}`; 
  return (START_OFFSETS[color] + relativePos) % 52;
};

const initialStats = {
  yellow: { totalKills: 0, totalSixes: 0, distanceTraveled: 0 },
  blue: { totalKills: 0, totalSixes: 0, distanceTraveled: 0 },
  red: { totalKills: 0, totalSixes: 0, distanceTraveled: 0 },
  green: { totalKills: 0, totalSixes: 0, distanceTraveled: 0 }
};

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  currentPlayerTurn: 'yellow', 
  diceValue: null,
  hasRolled: false,
  isAnimating: false,
  gameStarted: false,
  isRobotMode: false,
  activeColors: ['yellow', 'blue', 'red', 'green'],
  animationType: 'jump',
  isFastMode: false,
  soundEnabled: true,
  leaderboard: [],
  hoveredTokenId: null,

  sixStreakCount: 0,
  recommendedTokenId: null,
  gameStats: initialStats,
  safeTokens: {},
  ragePlayers: { yellow: false, blue: false, red: false, green: false },
  
  // INITIAL MULTI-WINNER VALUES
  winners: [],
  gameFinished: false,

  setPreferences: (pref) => set((state) => ({ ...state, ...pref })),
  setHoveredToken: (tokenId) => set({ hoveredTokenId: tokenId }),

  updateLeaderboard: () => {
    const { players, activeColors } = get();
    if (!players || players.length === 0) return;
    const currentLeaderboard = activeColors.map(color => {
      const p = players.find(player => player.color === color);
      const finishedCount = p ? p.tokens.filter(t => t.isFinished).length : 0;
      return { color, finishedCount };
    }).sort((a, b) => b.finishedCount - a.finishedCount);
    
    set({ leaderboard: currentLeaderboard });
  },

  startGame: (playerCount: number, isRobot: boolean) => {
    let active: Color[] = [];
    if (playerCount === 2) active = ['yellow', 'red']; 
    else if (playerCount === 3) active = ['yellow', 'blue', 'red']; 
    else active = ['yellow', 'blue', 'red', 'green'];

    const freshPlayers = ['yellow', 'blue', 'red', 'green'].map((color) => ({
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

    set({
      gameStarted: true,
      isRobotMode: isRobot,
      activeColors: active,
      players: freshPlayers, 
      currentPlayerTurn: active[0], 
      diceValue: null,
      hasRolled: false,
      isAnimating: false,
      hoveredTokenId: null,
      sixStreakCount: 0,
      recommendedTokenId: null,
      gameStats: JSON.parse(JSON.stringify(initialStats)),
      safeTokens: {},
      ragePlayers: { yellow: false, blue: false, red: false, green: false },
      winners: [],
      gameFinished: false
    });
    get().updateLeaderboard();
  },

  exitGame: () => {
    set({ gameStarted: false, gameFinished: false, winners: [] });
  },

  passTurn: () => {
    set((state) => {
      if (state.gameFinished) return {};
      const nextTurn = getNextTurnColor(state.currentPlayerTurn, state.activeColors, state.players);
      return { 
        currentPlayerTurn: nextTurn, 
        diceValue: null, 
        hasRolled: false, 
        isAnimating: false,
        sixStreakCount: nextTurn === state.currentPlayerTurn ? state.sixStreakCount : 0,
        recommendedTokenId: null
      };
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.isAnimating || state.gameFinished) return;
    
    let randomNum = Math.floor(Math.random() * 6) + 1;
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      randomNum = (array[0] % 6) + 1; 
    }

    if (randomNum === 6) {
      const turn = state.currentPlayerTurn;
      set(prev => ({
        gameStats: {
          ...prev.gameStats,
          [turn]: { ...prev.gameStats[turn], totalSixes: prev.gameStats[turn].totalSixes + 1 }
        }
      }));
    }

    let currentStreak = state.sixStreakCount;
    if (randomNum === 6) {
      currentStreak++;
    } else {
      currentStreak = 0;
    }

    if (currentStreak === 3) {
      set({ diceValue: randomNum, hasRolled: true, sixStreakCount: 0, recommendedTokenId: null });
      setTimeout(() => {
        get().passTurn();
      }, state.isFastMode ? 250 : 500);
      return;
    }

    set({ diceValue: randomNum, hasRolled: true, sixStreakCount: currentStreak });

    const currentPlayer = state.players.find(p => p.color === state.currentPlayerTurn);
    if (currentPlayer) {
      const validTokens = currentPlayer.tokens.filter(t => {
        if (t.isFinished) return false;
        if (t.position === -1) return randomNum === 6; 
        return (t.position + randomNum) <= 56; 
      });

      if (validTokens.length === 0) {
        setTimeout(() => {
          get().passTurn();
        }, state.isFastMode ? 200 : 400); 
      } 
      else {
        let bestTokenId = validTokens[0].id;
        let maxWeight = -1;

        validTokens.forEach(t => {
          let weight = 0;
          const nextRelPos = t.position === -1 ? 0 : t.position + randomNum;
          const nextGlobPos = getGlobalPosition(state.currentPlayerTurn, nextRelPos);

          if (typeof nextGlobPos === 'number' && !SAFE_POSITIONS_GLOBAL.includes(nextGlobPos)) {
            state.players.forEach(p => {
              if (p.color !== state.currentPlayerTurn) {
                p.tokens.forEach(et => {
                  if (et.position !== -1 && getGlobalPosition(p.color, et.position) === nextGlobPos) {
                    weight += 100;
                  }
                });
              }
            });
          }
          if (nextRelPos === 56) weight += 50;
          if (typeof nextGlobPos === 'number' && SAFE_POSITIONS_GLOBAL.includes(nextGlobPos)) weight += 30;
          if (t.position === -1) weight += 20;

          if (weight > maxWeight) {
            maxWeight = weight;
            bestTokenId = t.id;
          }
        });

        set({ recommendedTokenId: bestTokenId });

        if (state.isRobotMode && state.currentPlayerTurn !== 'yellow') {
          setTimeout(() => {
            const chosenTokenId = bestTokenId || validTokens[Math.floor(Math.random() * validTokens.length)].id;
            get().moveToken(state.currentPlayerTurn, chosenTokenId);
          }, state.isFastMode ? 400 : 700);
        } else if (validTokens.length === 1) {
          setTimeout(() => {
            get().moveToken(state.currentPlayerTurn, validTokens[0].id);
          }, state.isFastMode ? 350 : 600);
        }
      }
    }
  },

  moveToken: (playerColor, tokenId) => {
    const state = get();
    if (state.currentPlayerTurn !== playerColor || !state.hasRolled || !state.diceValue || state.isAnimating || state.gameFinished) return;

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
        if (newRelativePos + diceVal > 56) return prevState;
        newRelativePos += diceVal;
        stepsToMove = diceVal; 
        
        if (newRelativePos === 56) { 
          token.isFinished = true;
        }
      }

      token.position = newRelativePos;

      const updatedDistance = prevState.gameStats[playerColor].distanceTraveled + stepsToMove;
      let currentKills = prevState.gameStats[playerColor].totalKills;

      const newGlobalPos = getGlobalPosition(playerColor, newRelativePos);
      let killedSomeone = false;
      
      if (typeof newGlobalPos === 'number' && !SAFE_POSITIONS_GLOBAL.includes(newGlobalPos)) {
        newPlayers.forEach(p => {
          if (p.color !== playerColor && prevState.activeColors.includes(p.color)) {
            p.tokens.forEach(enemyToken => {
              const enemyGlobal = getGlobalPosition(p.color, enemyToken.position);
              if (enemyToken.position !== -1 && enemyGlobal === newGlobalPos) {
                enemyToken.position = -1; 
                getsExtraTurn = true;    
                killedSomeone = true;
              }
            });
          }
        });
      }

      if (killedSomeone) currentKills++;

      // Check if this player just won (All 4 tokens finished)
      const finishedCount = newPlayers[playerIndex].tokens.filter(t => t.isFinished).length;
      const playerJustWon = finishedCount === 4;

      let updatedWinners = [...prevState.winners];
      if (playerJustWon && !updatedWinners.includes(playerColor)) {
        updatedWinners.push(playerColor);
      }

      // Game finishes when:
      // - 3 players have won (in a 4-player game)
      // - Or active colors minus 1 player have finished
      const maxPossibleWinners = Math.min(3, prevState.activeColors.length - 1);
      const isGameOver = updatedWinners.length >= maxPossibleWinners;

      const nextSafeTokens = { ...prevState.safeTokens };
      newPlayers.forEach(p => {
        p.tokens.forEach(tk => {
          const gPos = getGlobalPosition(p.color, tk.position);
          if (typeof gPos === 'number' && SAFE_POSITIONS_GLOBAL.includes(gPos) && tk.position !== -1) {
            nextSafeTokens[tk.id] = true;
          } else {
            nextSafeTokens[tk.id] = false;
          }
        });
      });

      const nextRagePlayers = { ...prevState.ragePlayers };
      const outTokens = newPlayers[playerIndex].tokens.filter(tk => tk.position > -1 && !tk.isFinished);
      nextRagePlayers[playerColor] = outTokens.length === 1;

      let nextTurn = prevState.currentPlayerTurn;
      
      // If dice is 6 or killed someone, they get extra turn, EXCEPT if they just finished all 4 tokens!
      if ((diceVal === 6 || killedSomeone) && !playerJustWon) {
        getsExtraTurn = true;
      } else {
        getsExtraTurn = false;
      }

      if (!getsExtraTurn) {
        nextTurn = getNextTurnColor(nextTurn, prevState.activeColors, newPlayers);
        set({ sixStreakCount: 0 });
      }

      const stepTime = prevState.isFastMode ? 80 : 150;
      const animationTime = (stepsToMove * stepTime) + 300;

      setTimeout(() => {
        useGameStore.setState({ 
          currentPlayerTurn: isGameOver ? prevState.currentPlayerTurn : nextTurn, 
          diceValue: null, 
          hasRolled: false,
          isAnimating: false,
          hoveredTokenId: null,
          recommendedTokenId: null,
          winners: updatedWinners,
          gameFinished: isGameOver
        });
        get().updateLeaderboard();
      }, animationTime);

      return { 
        players: newPlayers, 
        isAnimating: true,
        safeTokens: nextSafeTokens,
        ragePlayers: nextRagePlayers,
        gameStats: {
          ...prevState.gameStats,
          [playerColor]: {
            ...prevState.gameStats[playerColor],
            distanceTraveled: updatedDistance,
            totalKills: currentKills
          }
        }
      };
    });
  }
}));