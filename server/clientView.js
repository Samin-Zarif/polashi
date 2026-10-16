// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Client View Builder
// Ensures NO secret data leaks to the wrong client.
// ─────────────────────────────────────────────────────────────────────────────

import { ROLE_META } from './constants.js';
import { eicLineup } from './roleEngine.js';

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
  // Who is revealed: when the game is over, everyone; during the assassination, only the
  // EIC (the traitors stand revealed while Mir Jafar hunts Mir Modon among the rest).
  const publicPlayers = players.map((p, idx) => {
    const shown = isRevealed(phase, p);
    return {
      id:         p.id,
      name:       p.name,
      isLeader:   idx === leaderIndex,
      isOnTeam:   teamProposal ? teamProposal.includes(p.id) : false,
      isHost:     p.isHost || false,
      isReady:    p.isReady || false,
      hasVoted:   p.hasVoted || false,
      missionCardSubmitted: p.missionCardSubmitted || false,
      look:       p.look,       // the statue they chose in the lobby (cosmetic only)
      role:       shown ? p.role : undefined,
      faction:    shown ? p.faction : undefined,
      roleMeta:   shown ? ROLE_META[p.role] : undefined,
    };
  });

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
    // This game's EIC characters and whether each has abilities (public: never says who)
    eicLineup:        eicLineup(players),

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
      look:    p.look,      // the statue they chose (cosmetic only)
    })),
    hostId:           room.hostId,
    enabledRoles:     room.enabledRoles || [],
    myId:             recipientId,
    canStart:         canRoomStart(room),
    playerCount:      room.players.length,
  };
}

/**
 * Whether this player's role is shown to everyone now: all roles once the game is over;
 * during the assassination, only the EIC.
 */
function isRevealed(phase, player) {
  if (phase === 'GAME_OVER') return true;
  if (phase === 'ASSASSINATION') return player.faction === 'EIC';
  return false;
}

function canRoomStart(room) {
  const count = room.players.length;
  return count >= 5 && count <= 10;
}
