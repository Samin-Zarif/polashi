// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Socket Manager Hook
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { io }                from 'socket.io-client';
import { useGameStore }      from '../store/gameStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const {
    setSocket, setError, setIdentity, setScreen,
    setLobbyData, setGameState, loadSession, saveSession,
  } = useGameStore.getState();

  useEffect(() => {
    const socket = io(SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay:    1500,
    });

    socketRef.current = socket;
    setSocket(socket);

    // ── Core events ────────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setError(null);

      // Try to reconnect an existing session
      const session = loadSession();
      if (session?.myId && session?.roomId) {
        socket.emit('reconnect_player', {
          roomId:   session.roomId,
          playerId: session.myId,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', () => {
      setError('Could not reach the game server. Please try again.');
    });

    // ── Room events ────────────────────────────────────────────────────────
    socket.on('room_created', ({ roomId, playerId }) => {
      const { myName } = useGameStore.getState();
      setIdentity({ myId: playerId, myName, roomId });
      saveSession();
      setScreen('LOBBY');
    });

    socket.on('room_joined', ({ roomId, playerId }) => {
      const { myName } = useGameStore.getState();
      setIdentity({ myId: playerId, myName, roomId });
      saveSession();
      setScreen('LOBBY');
    });

    // ── State broadcasts ───────────────────────────────────────────────────
    socket.on('lobby_state', (data) => {
      setLobbyData(data);
      const { screen } = useGameStore.getState();
      if (screen !== 'LOBBY') setScreen('LOBBY');
    });

    socket.on('game_state', (data) => {
      // Debug intel — remove once confirmed working
      if (data.myIntel) console.log('[Intel]', data.myIntel, 'players:', data.players?.map(p => ({id:p.id, name:p.name})));
      setGameState(data);
      const { screen } = useGameStore.getState();
      if (screen !== 'GAME') setScreen('GAME');
    });

    // ── Error ──────────────────────────────────────────────────────────────
    socket.on('error_msg', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}
