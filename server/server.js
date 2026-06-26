// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Main Server
// ─────────────────────────────────────────────────────────────────────────────

import express        from 'express';
import { createServer } from 'http';
import { Server }     from 'socket.io';
import cors           from 'cors';
import { nanoid }     from 'nanoid';

import { PHASES, MAX_REJECTION_COUNT, CHAPTERS_TO_WIN, REQUIRES_TWO_BETRAYALS, ROLE_META, FACTIONS, ROLES } from './constants.js';
import { assignRolesAndComputeIntel } from './roleEngine.js';
import { buildClientView, buildLobbyView } from './clientView.js';
import {
  createRoom, getRoom, addPlayerToRoom, removePlayerFromRoom,
  findRoomByPlayerId, setEnabledRoles,
  getTeamSizeForCurrentChapter, nawabScore, eicScore,
  advanceLeader, resetVotes, resetMissionCards,
} from './store.js';

// ─── Express + Socket.IO Setup ────────────────────────────────────────────────

const app    = express();
const httpServer = createServer(app);
const io     = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', game: 'Polashi' }));

// ─── Broadcast Helpers ────────────────────────────────────────────────────────

/**
 * Sends each player in the room their personalised client view.
 */
function broadcastGameState(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    const view = buildClientView(room, player.id);
    io.to(player.socketId).emit('game_state', view);
  }
}

function broadcastLobbyState(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    const view = buildLobbyView(room, player.id);
    io.to(player.socketId).emit('lobby_state', view);
  }
}

function emitError(socket, message) {
  socket.emit('error_msg', { message });
}

// ─── Socket.IO Event Handlers ─────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // ── CREATE ROOM ───────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    if (!playerName?.trim()) return emitError(socket, 'Name required.');

    const roomId = nanoid(6).toUpperCase();
    const player = {
      id:       nanoid(),
      socketId: socket.id,
      name:     playerName.trim(),
    };

    const room = createRoom(roomId, player);
    socket.join(roomId);
    socket.data.playerId = player.id;
    socket.data.roomId   = roomId;

    socket.emit('room_created', { roomId, playerId: player.id });
    broadcastLobbyState(room);
    console.log(`[ROOM] Created ${roomId} by ${playerName}`);
  });

  // ── JOIN ROOM ─────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }) => {
    if (!playerName?.trim()) return emitError(socket, 'Name required.');

    const room = getRoom(roomId?.toUpperCase());
    if (!room) return emitError(socket, 'Room not found.');
    if (room.phase !== PHASES.LOBBY) return emitError(socket, 'Game already in progress.');
    if (room.players.length >= 10) return emitError(socket, 'Room is full (max 10 players).');

    const player = {
      id:       nanoid(),
      socketId: socket.id,
      name:     playerName.trim(),
    };

    const updated = addPlayerToRoom(roomId.toUpperCase(), player);
    if (!updated) return emitError(socket, 'Could not join — duplicate name or room full.');

    socket.join(roomId.toUpperCase());
    socket.data.playerId = player.id;
    socket.data.roomId   = roomId.toUpperCase();

    socket.emit('room_joined', { roomId: roomId.toUpperCase(), playerId: player.id });
    broadcastLobbyState(updated);
    console.log(`[ROOM] ${playerName} joined ${roomId}`);
  });

  // ── UPDATE OPTIONAL ROLES (host only) ─────────────────────────────────────
  socket.on('set_enabled_roles', ({ roles }) => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room) return;
    if (room.hostId !== playerId) return emitError(socket, 'Only the host can change roles.');

    setEnabledRoles(roomId, roles || []);
    broadcastLobbyState(room);
  });

  // ── START GAME (host only) ────────────────────────────────────────────────
  socket.on('start_game', () => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room) return emitError(socket, 'Room not found.');
    if (room.hostId !== playerId) return emitError(socket, 'Only the host can start the game.');
    if (room.players.length < 5) return emitError(socket, 'Need at least 5 players.');
    if (room.players.length > 10) return emitError(socket, 'Maximum 10 players.');
    if (room.phase !== PHASES.LOBBY) return emitError(socket, 'Game already started.');

    // Assign roles and compute private intel
    const { players: assignedPlayers, privateIntel } = assignRolesAndComputeIntel(
      room.players,
      room.enabledRoles
    );

    room.players     = assignedPlayers;
    room.privateIntel = privateIntel;
    room.phase       = PHASES.ROLE_REVEAL;
    room.leaderIndex = Math.floor(Math.random() * room.players.length);

    broadcastGameState(room);
    console.log(`[GAME] Started in room ${roomId} with ${room.players.length} players`);
  });

  // ── ROLE REVEAL ACKNOWLEDGED (player seen their card) ─────────────────────
  socket.on('role_reveal_ack', () => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room || room.phase !== PHASES.ROLE_REVEAL) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) player.isReady = true;

    const allReady = room.players.every(p => p.isReady);
    if (allReady) {
      room.players.forEach(p => { p.isReady = false; });
      room.phase = PHASES.NIGHT_PHASE;
      broadcastGameState(room);

      // Auto-advance to TEAM_PROPOSAL after a delay (client-side timer handles animation)
      setTimeout(() => {
        const r = getRoom(roomId);
        if (r && r.phase === PHASES.NIGHT_PHASE) {
          r.phase = PHASES.TEAM_PROPOSAL;
          broadcastGameState(r);
        }
      }, 8000); // 8 seconds for the night phase reveal
    } else {
      broadcastGameState(room);
    }
  });

  // ── PROPOSE TEAM (leader only) ────────────────────────────────────────────
  socket.on('propose_team', ({ teamIds }) => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room || room.phase !== PHASES.TEAM_PROPOSAL) return;

    const leader = room.players[room.leaderIndex];
    if (leader.id !== playerId) return emitError(socket, 'Only the leader can propose a team.');

    const requiredSize = getTeamSizeForCurrentChapter(room);
    if (!Array.isArray(teamIds) || teamIds.length !== requiredSize) {
      return emitError(socket, `Team must have exactly ${requiredSize} members.`);
    }

    // Validate all IDs exist
    const validIds = new Set(room.players.map(p => p.id));
    if (!teamIds.every(id => validIds.has(id))) {
      return emitError(socket, 'Invalid player selection.');
    }

    room.teamProposal = teamIds;
    resetVotes(room);
    room.phase = PHASES.TEAM_VOTE;
    broadcastGameState(room);
    console.log(`[VOTE] Team proposed in ${roomId}: ${teamIds}`);
  });

  // ── CAST VOTE ─────────────────────────────────────────────────────────────
  socket.on('cast_vote', ({ vote }) => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room || room.phase !== PHASES.TEAM_VOTE) return;
    if (vote !== 'YES' && vote !== 'NO') return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.hasVoted) return;

    room.votes[playerId] = vote;
    player.hasVoted = true;

    const allVoted = room.players.every(p => p.hasVoted);
    if (allVoted) {
      resolveVote(room);
    } else {
      broadcastGameState(room);
    }
  });

  // ── SUBMIT MISSION CARD ───────────────────────────────────────────────────
  socket.on('submit_mission_card', ({ card }) => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room || room.phase !== PHASES.MISSION_CLASH) return;
    if (!room.teamProposal.includes(playerId)) return;
    if (card !== 'LOYAL' && card !== 'BETRAYAL') return;

    // Nawab faction cannot submit BETRAYAL
    const player = room.players.find(p => p.id === playerId);
    if (player.faction === FACTIONS.NAWAB && card === 'BETRAYAL') {
      return emitError(socket, 'Nawab faction must submit Loyal.');
    }

    if (room.missionCards[playerId]) return; // already submitted
    room.missionCards[playerId] = card;
    player.missionCardSubmitted = true;

    const teamSize = getTeamSizeForCurrentChapter(room);
    const submitted = Object.keys(room.missionCards).length;
    if (submitted >= teamSize) {
      resolveMission(room);
    } else {
      broadcastGameState(room);
    }
  });

  // ── ASSASSINATION (Mir Jafar picks a target) ──────────────────────────────
  socket.on('assassinate', ({ targetId }) => {
    const { roomId, playerId } = socket.data;
    const room = getRoom(roomId);
    if (!room || room.phase !== PHASES.ASSASSINATION) return;

    const assassin = room.players.find(p => p.id === playerId && p.role === ROLES.MIR_JAFAR);
    if (!assassin) return emitError(socket, 'Only Mir Jafar can assassinate.');

    const target = room.players.find(p => p.id === targetId);
    if (!target) return emitError(socket, 'Invalid target.');

    room.assassinationTarget = targetId;
    if (target.role === ROLES.MIR_MODON) {
      room.winner = FACTIONS.EIC;
    } else {
      room.winner = FACTIONS.NAWAB;
    }

    room.phase = PHASES.GAME_OVER;
    broadcastGameState(room);
    console.log(`[END] Assassination in ${roomId}: ${target.name} targeted. EIC ${target.role === ROLES.MIR_MODON ? 'WINS' : 'LOSES'}`);
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomId, playerId } = socket.data || {};
    if (!roomId || !playerId) return;

    const room = getRoom(roomId);
    if (room && room.phase === PHASES.LOBBY) {
      const updated = removePlayerFromRoom(roomId, playerId);
      if (updated) broadcastLobbyState(updated);
    } else if (room) {
      // Mark as disconnected but keep in game
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.socketId = null;
        player.disconnected = true;
      }
      broadcastGameState(room);
    }
    console.log(`[DISCONNECT] ${socket.id}`);
  });

  // ── RECONNECT ─────────────────────────────────────────────────────────────
  socket.on('reconnect_player', ({ roomId, playerId }) => {
    const room = getRoom(roomId);
    if (!room) return emitError(socket, 'Room no longer exists.');

    const player = room.players.find(p => p.id === playerId);
    if (!player) return emitError(socket, 'Player not found in this room.');

    player.socketId    = socket.id;
    player.disconnected = false;
    socket.join(roomId);
    socket.data.playerId = playerId;
    socket.data.roomId   = roomId;

    if (room.phase === PHASES.LOBBY) {
      socket.emit('lobby_state', buildLobbyView(room, playerId));
    } else {
      socket.emit('game_state', buildClientView(room, playerId));
    }
    console.log(`[RECONNECT] Player ${playerId} rejoined ${roomId}`);
  });
});

// ─── Game Logic Functions ─────────────────────────────────────────────────────

function resolveVote(room) {
  room.votesRevealed = true;

  const yesCount = Object.values(room.votes).filter(v => v === 'YES').length;
  const noCount  = Object.values(room.votes).filter(v => v === 'NO').length;
  const passed   = yesCount > noCount;

  // Build log entry
  const leader = room.players[room.leaderIndex];
  const teamNames = room.teamProposal.map(id => room.players.find(p => p.id === id)?.name || '?');
  const yesVoters = Object.entries(room.votes)
    .filter(([, v]) => v === 'YES')
    .map(([id]) => room.players.find(p => p.id === id)?.name || '?');
  const noVoters  = Object.entries(room.votes)
    .filter(([, v]) => v === 'NO')
    .map(([id]) => room.players.find(p => p.id === id)?.name || '?');

  const logEntry = {
    id:          nanoid(),
    chapter:     room.chapter,
    leaderName:  leader.name,
    team:        teamNames,
    yesVoters,
    noVoters,
    passed,
    outcome:     null, // filled after mission
  };

  room.missionHistory.push(logEntry);
  broadcastGameState(room);

  setTimeout(() => {
    const r = getRoom(room.roomId);
    if (!r) return;

    if (passed) {
      r.rejectionCount = 0;
      resetMissionCards(r);
      r.phase = PHASES.MISSION_CLASH;
    } else {
      r.rejectionCount += 1;
      if (r.rejectionCount >= MAX_REJECTION_COUNT) {
        r.winner = FACTIONS.EIC;
        r.phase  = PHASES.GAME_OVER;
      } else {
        advanceLeader(r);
        r.teamProposal = [];
        r.phase = PHASES.TEAM_PROPOSAL;
      }
    }
    broadcastGameState(r);
  }, 3000); // show votes for 3 seconds
}

function resolveMission(room) {
  const betrayalCount = Object.values(room.missionCards).filter(c => c === 'BETRAYAL').length;
  const requiresTwo   = REQUIRES_TWO_BETRAYALS(room.players.length, room.chapter);
  const nawabWon      = requiresTwo ? betrayalCount < 2 : betrayalCount === 0;

  room.missionResults = { betrayalCount, nawabWon };

  const chapterIdx = room.chapter - 1;
  room.chapterScores[chapterIdx] = nawabWon ? 'NAWAB' : 'EIC';

  // Update the latest log entry with the outcome
  const lastEntry = room.missionHistory[room.missionHistory.length - 1];
  if (lastEntry) lastEntry.outcome = nawabWon ? 'NAWAB' : 'EIC';

  room.phase = PHASES.ROUND_RESULT;
  broadcastGameState(room);
  console.log(`[MISSION] Chapter ${room.chapter}: ${nawabWon ? 'NAWAB' : 'EIC'} wins. Betrayals: ${betrayalCount}`);

  setTimeout(() => {
    const r = getRoom(room.roomId);
    if (!r) return;

    const nScore = nawabScore(r);
    const eScore = eicScore(r);

    if (eScore >= 3) {
      r.winner = FACTIONS.EIC;
      r.phase  = PHASES.GAME_OVER;
    } else if (nScore >= 3) {
      // Check if assassination should happen
      const hasMirJafar = r.players.some(p => p.role === ROLES.MIR_JAFAR);
      r.phase = hasMirJafar ? PHASES.ASSASSINATION : PHASES.GAME_OVER;
      if (!hasMirJafar) r.winner = FACTIONS.NAWAB;
    } else {
      // Advance to next chapter
      r.chapter += 1;
      r.rejectionCount = 0;
      r.missionResults = null;
      r.teamProposal   = [];
      advanceLeader(r);
      r.phase = PHASES.TEAM_PROPOSAL;
    }
    broadcastGameState(r);
  }, 5000); // show mission result for 5 seconds
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🏰 Polashi server running on http://localhost:${PORT}\n`);
});
