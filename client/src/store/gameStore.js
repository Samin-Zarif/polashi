// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Client Game Store (Zustand)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // ── Connection & Identity ─────────────────────────────────────────────────
  socket:   null,
  myId:     null,
  myName:   null,
  roomId:   null,

  // ── UI State ──────────────────────────────────────────────────────────────
  screen:   'LANDING',   // LANDING | LOBBY | GAME | ROLE_REVEAL
  error:    null,
  isConnecting: false,

  // ── Lobby State ───────────────────────────────────────────────────────────
  lobbyData: null,

  // ── Game State (personalised view from server) ────────────────────────────
  gameState: null,

  // ── Actions ───────────────────────────────────────────────────────────────

  setSocket: (socket) => set({ socket }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  setIdentity: ({ myId, myName, roomId }) =>
    set({ myId, myName, roomId }),

  setScreen: (screen) => set({ screen }),

  setLobbyData: (lobbyData) => set({ lobbyData }),

  setGameState: (gameState) => set({ gameState }),

  // Persist identity to sessionStorage for reconnection
  saveSession: () => {
    const { myId, myName, roomId } = get();
    if (myId && roomId) {
      sessionStorage.setItem('polashi_session', JSON.stringify({ myId, myName, roomId }));
    }
  },

  loadSession: () => {
    try {
      const raw = sessionStorage.getItem('polashi_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  },

  clearSession: () => {
    sessionStorage.removeItem('polashi_session');
    set({ myId: null, myName: null, roomId: null, lobbyData: null, gameState: null });
  },

  reset: () => set({
    myId:     null,
    myName:   null,
    roomId:   null,
    screen:   'LANDING',
    error:    null,
    lobbyData: null,
    gameState: null,
    isConnecting: false,
  }),
}));
