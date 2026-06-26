// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Role Assignment & Private Intel Engine
// ─────────────────────────────────────────────────────────────────────────────

import {
  ROLES,
  FACTIONS,
  ROLE_META,
  FACTION_COUNTS,
} from './constants.js';

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

  for (const role of enabledOptionalRoles) {
    if (optionalNawab.includes(role) && nawabRoles.length < nawab) {
      nawabRoles.push(role);
    }
    if (optionalEIC.includes(role) && eicRoles.length < eic) {
      eicRoles.push(role);
    }
  }

  // ── Fill remaining slots with generics ───────────────────────────────────
  while (nawabRoles.length < nawab) nawabRoles.push(ROLES.LOYAL_SOLDIER);
  while (eicRoles.length < eic)    eicRoles.push(ROLES.EIC_CONSPIRATOR);

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

      case ROLES.LOYAL_SOLDIER:
        // No intel
        break;

      // ── EIC Roles ────────────────────────────────────────────────────────
      case ROLES.MIR_JAFAR:
      case ROLES.GHASETI_BEGUM:
      case ROLES.RAY_DURLABH:
      case ROLES.EIC_CONSPIRATOR: {
        // Standard EIC: sees all EIC except Omichand (and not themselves)
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

// ─── Fisher-Yates Shuffle ─────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
