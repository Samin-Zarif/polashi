// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Client View Builder
// Ensures NO secret data leaks to the wrong client.
// ─────────────────────────────────────────────────────────────────────────────

import { ROLE_META } from './constants.js';

/**
 * Builds a safe, personalised payload for a specific recipient.
 * Called before every socket.emit to that player.
 *
 * @param {Object} masterState  - The full server-side game state
 * @param {string} recipientId  - The player.id receiving this payload
 * @returns {Object}            - Scrubbed, role-safe view
 */
export function buildClientView(masterState, recipientId) {
  const {
    roomId,
    phase,
    chapter,
    leaderIndex,
    rejectionCount,
    chapterScores,
    missionHistory,
    players,
    privateIntel,
    teamProposal,
    missionResults,
    winner,
    assassinationTarget,
  } = masterState;

  const me = players.find(p => p.id === recipientId);
  const myIntel = (privateIntel && privateIntel[recipientId]) || {
    redPlayerIds: [],
    yellowPlayerIds: [],
  };

  // ── Public player list: strip role/faction from everyone ─────────────────
  const publicPlayers = players.map((p, idx) => ({
    id:         p.id,
    name:       p.name,
    isLeader:   idx === leaderIndex,
    isOnTeam:   teamProposal ? teamProposal.includes(p.id) : false,
    isHost:     p.isHost || false,
    isReady:    p.isReady || false,
    hasVoted:   p.hasVoted || false,
    missionCardSubmitted: p.missionCardSubmitted || false,
    // Only reveal roles during GAME_OVER or ASSASSINATION
    role:       shouldRevealRoles(phase) ? p.role : undefined,
    faction:    shouldRevealRoles(phase) ? p.faction : undefined,
    roleMeta:   shouldRevealRoles(phase) ? ROLE_META[p.role] : undefined,
  }));

  // ── Build my own full role info ───────────────────────────────────────────
  const myRoleInfo = me
    ? {
        role:     me.role,
        faction:  me.faction,
        roleMeta: ROLE_META[me.role],
      }
    : null;

  return {
    roomId,
    phase,
    chapter,          // 1-based current chapter number
    leaderIndex,
    rejectionCount,
    chapterScores,    // array of 'NAWAB' | 'EIC' | null per chapter
    missionHistory,   // public log entries
    players:          publicPlayers,
    teamProposal:     teamProposal || [],
    missionResults,   // { betrayalCount, totalCards, nawabWon } revealed after clash
    winner,           // 'NAWAB' | 'EIC' | null
    assassinationTarget,

    // ── Private fields — only meaningful for this recipient ────────────────
    myId:      recipientId,
    myName:    me?.name,
    myRoleInfo,
    myIntel,   // { redPlayerIds, yellowPlayerIds }

    // ── Vote tally revealed only after all have voted ──────────────────────
    votes: masterState.votesRevealed ? masterState.votes : null,
  };
}

/**
 * Lobby-phase payload — no game state yet, just room info.
 */
export function buildLobbyView(room, recipientId) {
  return {
    roomId:   room.roomId,
    phase:    room.phase,
    players:  room.players.map(p => ({
      id:      p.id,
      name:    p.name,
      isHost:  p.isHost || false,
      isReady: p.isReady || false,
    })),
    hostId:           room.hostId,
    enabledRoles:     room.enabledRoles || [],
    myId:             recipientId,
    canStart:         canRoomStart(room),
    playerCount:      room.players.length,
  };
}

/**
 * Whether the current phase warrants full role disclosure to all clients.
 */
function shouldRevealRoles(phase) {
  return phase === 'GAME_OVER' || phase === 'ASSASSINATION';
}

function canRoomStart(room) {
  const count = room.players.length;
  return count >= 5 && count <= 10;
}
