// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Game Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PHASES = {
  LOBBY: 'LOBBY',
  ROLE_REVEAL: 'ROLE_REVEAL',
  NIGHT_PHASE: 'NIGHT_PHASE',
  TEAM_PROPOSAL: 'TEAM_PROPOSAL',
  TEAM_VOTE: 'TEAM_VOTE',
  MISSION_CLASH: 'MISSION_CLASH',
  ROUND_RESULT: 'ROUND_RESULT',
  ASSASSINATION: 'ASSASSINATION',
  GAME_OVER: 'GAME_OVER',
};

export const FACTIONS = {
  NAWAB: 'NAWAB',
  EIC: 'EIC',
};

export const ROLES = {
  // Nawab (Good)
  MIR_MODON: 'MIR_MODON',
  MOHON_LAL: 'MOHON_LAL',
  LOYAL_SOLDIER: 'LOYAL_SOLDIER',
  // EIC (Evil)
  MIR_JAFAR: 'MIR_JAFAR',
  GHASETI_BEGUM: 'GHASETI_BEGUM',
  RAY_DURLABH: 'RAY_DURLABH',
  OMICHAND: 'OMICHAND',
  EIC_CONSPIRATOR: 'EIC_CONSPIRATOR',
};

export const ROLE_META = {
  [ROLES.MIR_MODON]: {
    faction: FACTIONS.NAWAB,
    displayName: 'Mir Modon',
    title: 'The Seer',
    description:
      "You are the Nawab's most trusted commander. Your sharp eyes can see through the treachery — but beware, for the EIC seeks to silence you above all else.",
    mandatory: true,
  },
  [ROLES.MOHON_LAL]: {
    faction: FACTIONS.NAWAB,
    displayName: 'Mohon Lal',
    title: 'The Bodyguard',
    description:
      "You see two names highlighted. One is Mir Modon, the Nawab's greatest asset. The other is Ghaseti Begum, the EIC's deceiver. Protect the right one.",
    mandatory: false,
  },
  [ROLES.LOYAL_SOLDIER]: {
    faction: FACTIONS.NAWAB,
    displayName: 'Loyal Soldier',
    title: 'The Faithful',
    description:
      'You serve the Nawab with honour. You have no special intel — only your wits, your observations, and your loyalty.',
    mandatory: false,
  },
  [ROLES.MIR_JAFAR]: {
    faction: FACTIONS.EIC,
    displayName: 'Mir Jafar',
    title: 'The Assassin',
    description:
      "You are the EIC\'s blade in the dark. You know your fellow traitors. Sabotage missions, sow distrust, and when the moment comes — find and eliminate Mir Modon.",
    mandatory: true,
  },
  [ROLES.GHASETI_BEGUM]: {
    faction: FACTIONS.EIC,
    displayName: 'Ghaseti Begum',
    title: 'The Deceiver',
    description:
      "Your very existence confuses the Nawab's protector. You are known to Mohon Lal, but he cannot tell you apart from Mir Modon. Use this confusion ruthlessly.",
    mandatory: false,
  },
  [ROLES.RAY_DURLABH]: {
    faction: FACTIONS.EIC,
    displayName: 'Ray Durlabh',
    title: 'The Hidden Threat',
    description:
      "You are invisible to Mir Modon's sight. The Nawab's greatest seer cannot find you. Move freely, sabotage silently.",
    mandatory: false,
  },
  [ROLES.OMICHAND]: {
    faction: FACTIONS.EIC,
    displayName: 'Omichand',
    title: 'The Blind Opportunist',
    description:
      'You serve the EIC, but you work alone. You do not know your fellow traitors, and they do not know you. You must deduce your allies through observation.',
    mandatory: false,
  },
  [ROLES.EIC_CONSPIRATOR]: {
    faction: FACTIONS.EIC,
    displayName: 'EIC Conspirator',
    title: 'The Shadow',
    description:
      "You are a loyal servant of the East India Company. Work with your fellow traitors to sabotage the Nawab's chapters from within.",
    mandatory: false,
  },
};

// ─── Team Sizes per Player Count per Chapter ─────────────────────────────────
// Index = chapter number (1-based), value = team size needed
export const TEAM_SIZES = {
  5:  [null, 2, 3, 2, 3, 3],
  6:  [null, 2, 3, 4, 3, 4],
  7:  [null, 2, 3, 3, 4, 4],
  8:  [null, 3, 4, 4, 5, 5],
  9:  [null, 3, 4, 4, 5, 5],
  10: [null, 3, 4, 4, 5, 5],
};

// Chapter 4 with 7+ players requires 2 betrayals to fail
export const REQUIRES_TWO_BETRAYALS = (playerCount, chapter) =>
  playerCount >= 7 && chapter === 4;

// ─── Faction Distribution per Player Count ───────────────────────────────────
export const FACTION_COUNTS = {
  5:  { nawab: 3, eic: 2 },
  6:  { nawab: 4, eic: 2 },
  7:  { nawab: 4, eic: 3 },
  8:  { nawab: 5, eic: 3 },
  9:  { nawab: 6, eic: 3 },
  10: { nawab: 6, eic: 4 },
};

export const MAX_REJECTION_COUNT = 5;
export const TOTAL_CHAPTERS = 5;
export const CHAPTERS_TO_WIN = 3;
