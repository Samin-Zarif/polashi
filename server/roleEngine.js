// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Role Assignment & Private Intel Engine
// ─────────────────────────────────────────────────────────────────────────────

import {
  ROLES,
  FACTIONS,
  ROLE_META,
  FACTION_COUNTS,
} from './constants.js';

// Pool of named powerless Nawab roles — randomly drawn to fill generic slots
const NAWAB_GENERIC_POOL = [
  ROLES.SIRAJ,
  ROLES.LUTFUNNISA,
  ROLES.ST_FRAIS,
  ROLES.JEAN_LAW,
  ROLES.DE_BUSSY,
];

// EIC without abilities — randomly drawn to fill the EIC places the special characters
// don't take. A character already in the game with his abilities is never drawn again.
// (There are always enough: at most 3 places to fill, and 3 names minus each one in play.)
const EIC_GENERIC_POOL = [
  { role: ROLES.RAY_DURLABH_PLAIN, unless: ROLES.RAY_DURLABH },
  { role: ROLES.OMICHAND_PLAIN,    unless: ROLES.OMICHAND },
  { role: ROLES.JAGAT_SETH },
];

/**
 * Given the player count and which optional roles are enabled,
 * returns a shuffled array of role strings to hand out.
 */
export function buildRolePool(playerCount, enabledOptionalRoles = []) {
  const { nawab, eic } = FACTION_COUNTS[playerCount];

  // ── Mandatory roles ──────────────────────────────────────────────────────
  const nawabRoles = [ROLES.MIR_MODON];
  const eicRoles   = [ROLES.MIR_JAFAR];

  // ── Optional roles requested by host ─────────────────────────────────────
  const optionalNawab = [ROLES.MOHON_LAL];
  const optionalEIC   = [ROLES.GHASETI_BEGUM, ROLES.RAY_DURLABH, ROLES.OMICHAND];

  // Mohon Lal only comes with Ghaseti Begum (the lobby enforces it too), and she takes the
  // first EIC place, so even a small game never leaves him without her.
  let requested = [...enabledOptionalRoles];
  if (!requested.includes(ROLES.GHASETI_BEGUM)) requested = requested.filter(r => r !== ROLES.MOHON_LAL);
  if (requested.includes(ROLES.MOHON_LAL)) {
    requested = [ROLES.GHASETI_BEGUM, ...requested.filter(r => r !== ROLES.GHASETI_BEGUM)];
  }

  for (const role of requested) {
    if (optionalNawab.includes(role) && nawabRoles.length < nawab) {
      nawabRoles.push(role);
    }
    if (optionalEIC.includes(role) && eicRoles.length < eic) {
      eicRoles.push(role);
    }
  }

  // ── Fill remaining Nawab slots with named historical figures ─────────────
  // Shuffle the pool so different games get different combinations
  const shuffledPool = shuffle([...NAWAB_GENERIC_POOL]);
  let poolIndex = 0;
  while (nawabRoles.length < nawab) {
    nawabRoles.push(shuffledPool[poolIndex % shuffledPool.length]);
    poolIndex++;
  }
  const eicPool = shuffle(EIC_GENERIC_POOL.filter(f => !f.unless || !eicRoles.includes(f.unless)).map(f => f.role));
  let eicIndex = 0;
  while (eicRoles.length < eic) {
    eicRoles.push(eicPool[eicIndex % eicPool.length]);
    eicIndex++;
  }

  const pool = [...nawabRoles, ...eicRoles];
  return shuffle(pool);
}

/**
 * Assigns roles to players and computes the private intel map.
 * Returns { players (with roles), privateIntel }
 */
export function assignRolesAndComputeIntel(players, enabledOptionalRoles) {
  const rolePool = buildRolePool(players.length, enabledOptionalRoles);

  const assigned = players.map((p, i) => ({
    ...p,
    role:    rolePool[i],
    faction: ROLE_META[rolePool[i]].faction,
    // which stone statue sits in this player's chair: 'A' turban and beard, 'B' bare head,
    // 'W' the queen. Chosen by the player in the lobby, before any role is dealt, so a statue
    // says nothing about a role; anyone without a choice gets one at random.
    look:    ['A', 'B', 'W'].includes(p.look) ? p.look : ['A', 'B', 'W'][Math.floor(Math.random() * 3)],
  }));

  const privateIntel = computePrivateIntel(assigned);
  return { players: assigned, privateIntel };
}

/**
 * Builds the visibility map for every player.
 * privateIntel[playerId] = { redPlayerIds: [], yellowPlayerIds: [] }
 */
function computePrivateIntel(players) {
  const intel = {};

  // Index players by role for quick lookup
  const byRole = {};
  for (const p of players) {
    byRole[p.role] = byRole[p.role] || [];
    byRole[p.role].push(p.id);
  }

  const getIds = (role) => byRole[role] || [];

  // All EIC player IDs (used for the standard EIC-sees-EIC rule)
  const allEicIds = players
    .filter(p => p.faction === FACTIONS.EIC)
    .map(p => p.id);

  // Omichand IDs (excluded from mutual EIC visibility)
  const omichandIds = getIds(ROLES.OMICHAND);

  // EIC visible to standard EIC members = all EIC minus Omichand
  const eicVisibleToStandardEic = allEicIds.filter(
    id => !omichandIds.includes(id)
  );

  // Ray Durlabh IDs (excluded from Mir Modon's vision)
  const rayDurlabhIds = getIds(ROLES.RAY_DURLABH);

  // Mir Modon IDs (for Mohon Lal's yellow)
  const mirModonIds = getIds(ROLES.MIR_MODON);

  // Ghaseti Begum IDs (for Mohon Lal's yellow)
  const ghasetiIds = getIds(ROLES.GHASETI_BEGUM);

  for (const p of players) {
    const redIds    = [];
    const yellowIds = [];

    switch (p.role) {
      // ── Nawab Roles ──────────────────────────────────────────────────────
      case ROLES.MIR_MODON: {
        // Sees all EIC in red EXCEPT Ray Durlabh
        const visible = allEicIds.filter(id => !rayDurlabhIds.includes(id));
        redIds.push(...visible.filter(id => id !== p.id));
        break;
      }

      case ROLES.MOHON_LAL: {
        // Sees Mir Modon AND Ghaseti Begum in yellow — doesn't know which is which
        yellowIds.push(...mirModonIds);
        yellowIds.push(...ghasetiIds);
        break;
      }

      case ROLES.SIRAJ:
      case ROLES.LUTFUNNISA:
      case ROLES.ST_FRAIS:
      case ROLES.JEAN_LAW:
      case ROLES.DE_BUSSY:
        // No intel — powerless historical figures
        break;

      // ── EIC Roles ────────────────────────────────────────────────────────
      case ROLES.MIR_JAFAR:
      case ROLES.GHASETI_BEGUM:
      case ROLES.RAY_DURLABH:
      case ROLES.RAY_DURLABH_PLAIN:
      case ROLES.OMICHAND_PLAIN:
      case ROLES.JAGAT_SETH: {
        // Standard EIC: sees all EIC except Omichand (and not themselves).
        // The EIC without abilities are standard EIC: they see, and are seen, like the rest.
        redIds.push(
          ...eicVisibleToStandardEic.filter(id => id !== p.id)
        );
        break;
      }

      case ROLES.OMICHAND:
        // Completely blind — sees nobody
        break;
    }

    intel[p.id] = {
      redPlayerIds:    [...new Set(redIds)],
      yellowPlayerIds: [...new Set(yellowIds)],
    };
  }

  return intel;
}

/**
 * This game's EIC, for everyone to see on the night screen: which characters serve the
 * Company and whether each has abilities — never who holds them.
 * Mir Jafar first, then the others with abilities, then those without; by name within each.
 */
export function eicLineup(players) {
  return players
    .filter(p => ROLE_META[p.role]?.faction === FACTIONS.EIC)
    .map(p => ({ name: ROLE_META[p.role].displayName, abilities: !!ROLE_META[p.role].abilities, first: p.role === ROLES.MIR_JAFAR }))
    .sort((a, b) => (b.first - a.first) || (b.abilities - a.abilities) || a.name.localeCompare(b.name))
    .map(({ name, abilities }) => ({ name, abilities }));
}

// ─── Fisher-Yates Shuffle ─────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
