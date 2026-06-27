// POLASHI — Endgame Cinematic Text
// Each inner array = segments that appear one by one with 1.5s delays.
// Multiple variants per scenario — one picked randomly each game.

export const ENDGAME_TEXT = {

  // Nawab player sees this when EIC wins
  NAWAB_SEES_EIC_WIN: [
    [
      "And thus began the dark days of Bengal.",
      "What was lost that night",
      "would not return for two hundred years.",
      "Maybe even more."
    ],
    [
      "The candles went out in Murshidabad that night.",
      "No one came",
      "to relight them."
    ],
    [
      "Bengal has seen its last free dawn.",
      "Hold tight.",
      "It's going to be a long night."
    ],
  ],

  // EIC player sees this when EIC wins
  EIC_SEES_EIC_WIN: [
    [
      "An empire was built tonight.",
      "By you.",
      "The Company thanks you."
    ],
    [
      "You have made history today.",
      "You shall not be forgotten."
    ],
    [
      "It was a necessary sacrifice.",
      "For Bengal.",
      "Right...?"
    ],
    [
      "The naive Nawab is gone.",
      "Now Bengal will thrive under your rule.",
      "Right?"
    ],
  ],

  // Nawab player sees this when Nawab wins
  NAWAB_SEES_NAWAB_WIN: [
    [
      "Bengal breathes tonight.",
      "The Company never forgets what it wants."
    ],
    [
      "The traitors fall.",
      "The Nawab stands.",
      { text: "For now.", red: true }
    ],
    [
      "Bengal survives.",
      "Surely the Nawab will execute the traitors now.",
      "Right?"
    ],
  ],

  // EIC player sees this when Nawab wins
  EIC_SEES_NAWAB_WIN: [
    [
      "The mission failed.",
      "Bengal survives.",
      "Beg for forgiveness.",
      "For now."
    ],
    [
      "A lost battle.",
      "The Company will be back."
    ],
    [
      "A temporary setback.",
      "The ledgers in London are already being updated."
    ],
  ],
};

export function pickVariant(key) {
  const variants = ENDGAME_TEXT[key];
  if (!variants || variants.length === 0) return [];
  return variants[Math.floor(Math.random() * variants.length)];
}

// Get the right text key for a player
export function getEndgameKey(winner, myFaction) {
  if (winner === 'EIC' && myFaction === 'NAWAB') return 'NAWAB_SEES_EIC_WIN';
  if (winner === 'EIC' && myFaction === 'EIC')   return 'EIC_SEES_EIC_WIN';
  if (winner === 'NAWAB' && myFaction === 'NAWAB') return 'NAWAB_SEES_NAWAB_WIN';
  if (winner === 'NAWAB' && myFaction === 'EIC')   return 'EIC_SEES_NAWAB_WIN';
  return null;
}
