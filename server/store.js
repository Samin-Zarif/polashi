// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — In-Memory Game Store
// All rooms and their master states live here.
// ─────────────────────────────────────────────────────────────────────────────

import { PHASES, TEAM_SIZES, CHAPTERS_TO_WIN, TOTAL_CHAPTERS } from './constants.js';

const rooms = new Map(); // roomId → masterGameState

// ─── Room Lifecycle ───────────────────────────────────────────────────────────

export function createRoom(roomId, hostPlayer) {
  const room = {
    roomId,
    phase:        PHASES.LOBBY,
    hostId:       hostPlayer.id,
    players:      [{ ...hostPlayer, isHost: true, isReady: false }],
    enabledRoles: [],   // optional roles toggled by host

    // Game state (populated when game starts)
    chapter:          1,
    leaderIndex:      0,
    rejectionCount:   0,
    chapterScores:    Array(TOTAL_CHAPTERS).fill(null),
    missionHistory:   [],
    privateIntel:     {},
    teamProposal:     [],
    votes:            {},
    votesRevealed:    false,
    missionCards:     {},
    missionResults:   null,
    winner:           null,
    assassinationTarget: null,
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
}

// ─── Player Management ────────────────────────────────────────────────────────

export function addPlayerToRoom(roomId, player) {
  const room = getRoom(roomId);
  if (!room) return null;
  if (room.players.length >= 10) return null;
  if (room.phase !== PHASES.LOBBY) return null;
  if (room.players.find(p => p.name.toLowerCase() === player.name.toLowerCase())) {
    return null; // duplicate name
  }
  room.players.push({ ...player, isHost: false, isReady: false });
  return room;
}

export function removePlayerFromRoom(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players = room.players.filter(p => p.id !== playerId);

  // If host left, assign new host
  if (room.hostId === playerId && room.players.length > 0) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].id;
  }

  if (room.players.length === 0) {
    deleteRoom(roomId);
    return null;
  }
  return room;
}

export function findRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.id === playerId)) return room;
  }
  return null;
}

// ─── Host Settings ────────────────────────────────────────────────────────────

export function setEnabledRoles(roomId, roles) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.enabledRoles = roles;
  return room;
}

// ─── Game State Helpers ───────────────────────────────────────────────────────

export function getTeamSizeForCurrentChapter(room) {
  return TEAM_SIZES[room.players.length][room.chapter];
}

export function getChapterScore(room) {
  return room.chapterScores.filter(Boolean);
}

export function nawabScore(room) {
  return room.chapterScores.filter(s => s === 'NAWAB').length;
}

export function eicScore(room) {
  return room.chapterScores.filter(s => s === 'EIC').length;
}

export function advanceLeader(room) {
  room.leaderIndex = (room.leaderIndex + 1) % room.players.length;
}

export function resetVotes(room) {
  room.votes = {};
  room.votesRevealed = false;
  room.players.forEach(p => { p.hasVoted = false; });
}

export function resetMissionCards(room) {
  room.missionCards = {};
  room.players.forEach(p => { p.missionCardSubmitted = false; });
}

export { rooms };
