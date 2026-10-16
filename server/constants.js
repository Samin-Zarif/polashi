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
  // Nawab (Good) — named historical figures
  MIR_MODON:        'MIR_MODON',
  MOHON_LAL:        'MOHON_LAL',
  SIRAJ:            'SIRAJ',
  LUTFUNNISA:       'LUTFUNNISA',
  ST_FRAIS:         'ST_FRAIS',
  JEAN_LAW:         'JEAN_LAW',
  DE_BUSSY:         'DE_BUSSY',
  // EIC (Evil)
  MIR_JAFAR:        'MIR_JAFAR',
  GHASETI_BEGUM:    'GHASETI_BEGUM',
  RAY_DURLABH:      'RAY_DURLABH',
  OMICHAND:         'OMICHAND',
  // EIC without abilities — fill the EIC places the special characters don't take
  RAY_DURLABH_PLAIN: 'RAY_DURLABH_PLAIN',
  OMICHAND_PLAIN:    'OMICHAND_PLAIN',
  JAGAT_SETH:        'JAGAT_SETH',
};

export const ROLE_META = {
  [ROLES.MIR_MODON]: {
    abilities: true,
    faction: FACTIONS.NAWAB,
    displayName: 'Mir Modon',
    title: 'The Seer',
    description:
      "You are the Nawab's most trusted commander. Your sharp eyes can see through the smiles of traitors, but beware, for the EIC seeks to silence before others.",
    mandatory: true,
  },
  [ROLES.MOHON_LAL]: {
    abilities: true,
    faction: FACTIONS.NAWAB,
    displayName: 'Mohon Lal',
    title: 'The Bodyguard',
    description:
      "Mir Modon is Bengal's last hope. Ghaseti Begum only looks like him. Protect the right one.",
    mandatory: false,
  },
  [ROLES.SIRAJ]: {
    abilities: false,
    faction: FACTIONS.NAWAB,
    displayName: 'Nawab Siraj ud-Daulah',
    title: 'The Last Nawab',
    description:
      'Every knee bends to you. Not every heart. Always in the game.',
    mandatory: true,
  },
  [ROLES.LUTFUNNISA]: {
    abilities: false,
    faction: FACTIONS.NAWAB,
    displayName: 'Lutfunnisa Begum',
    title: 'The Faithful',
    description:
      'When every other hand lets go, yours will not.',
    mandatory: false,
  },
  [ROLES.ST_FRAIS]: {
    abilities: false,
    faction: FACTIONS.NAWAB,
    displayName: 'M. St. Frais',
    title: 'The Last Gun',
    description:
      'You fight for a land not your own, longer than its own sons.',
    mandatory: false,
  },
  [ROLES.JEAN_LAW]: {
    abilities: false,
    faction: FACTIONS.NAWAB,
    displayName: 'Jean Law',
    title: 'The Unheard',
    description:
      'You warned the Nawab. No one listened.',
    mandatory: false,
  },
  [ROLES.DE_BUSSY]: {
    abilities: false,
    faction: FACTIONS.NAWAB,
    displayName: 'De Bussy',
    title: 'The Reinforcement That Never Came',
    description:
      'Bengal waits for your army. But will arrive too late.',
    mandatory: false,
  },
  [ROLES.MIR_JAFAR]: {
    abilities: true,
    faction: FACTIONS.EIC,
    displayName: 'Mir Jafar',
    title: 'The Great Traitor',
    description:
      "You are the EIC\'s blade in the dark. You know your fellow traitors. Sabotage missions, sow distrust, and when the moment comes — find and eliminate Mir Modon.",
    mandatory: true,
  },
  [ROLES.GHASETI_BEGUM]: {
    abilities: true,
    faction: FACTIONS.EIC,
    displayName: 'Ghaseti Begum',
    title: 'The Deceiver',
    description:
      "Your very existence confuses the Nawab's protector. You are known to Mohon Lal, but he cannot tell you apart from Mir Modon. Use this confusion ruthlessly.",
    mandatory: false,
  },
  [ROLES.RAY_DURLABH]: {
    abilities: true,
    faction: FACTIONS.EIC,
    displayName: 'Ray Durlabh',
    title: 'The Hidden Threat',
    description:
      "You are invisible to Mir Modon's sight. The Nawab's greatest seer cannot find you. Move freely, sabotage silently.",
    mandatory: false,
  },
  [ROLES.OMICHAND]: {
    abilities: true,
    faction: FACTIONS.EIC,
    displayName: 'Omichand',
    title: 'The Blind Opportunist',
    description:
      'You serve the EIC, but you work alone. You do not know your fellow traitors, and they do not know you. You must deduce your allies through observation.',
    mandatory: false,
  },
  // ── EIC without abilities (same characters, plain cards) ────────────────────
  [ROLES.RAY_DURLABH_PLAIN]: {
    abilities: false,
    faction: FACTIONS.EIC,
    displayName: 'Ray Durlabh',
    title: 'The Idle Sword',
    description:
      "Your men will stand in the Nawab's line and watch him fall.",
    mandatory: false,
  },
  [ROLES.OMICHAND_PLAIN]: {
    abilities: false,
    faction: FACTIONS.EIC,
    displayName: 'Omichand',
    title: 'The Opportunist',
    description:
      'You are loyal to EIC, mostly, but you extort both.',
    mandatory: false,
  },
  [ROLES.JAGAT_SETH]: {
    abilities: false,
    faction: FACTIONS.EIC,
    displayName: 'Jagat Seth',
    title: 'The Kingmaker',
    description:
      'Your gold has crowned Nawabs before. Tonight, it crowns the Company.',
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
