// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Asset Manifest
// All asset paths defined here. Drop files into /public/assets/ and they
// automatically wire up. Missing files fall back gracefully (no broken images).
// ─────────────────────────────────────────────────────────────────────────────

// ── Images ────────────────────────────────────────────────────────────────────

export const IMAGES = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  // File: /public/assets/images/landing-bg.jpg
  // Use: Landing page hero background (battlefield panorama, 1920x1080 min)
  LANDING_BG: '/assets/images/landing-bg.jpg',

  // File: /public/assets/images/war-tent-bg.jpg
  // Use: Main game War Tent background (top-down tent view, 1920x1080 min)
  WAR_TENT_BG: '/assets/images/war-tent-bg.jpg',

  // File: /public/assets/images/night-bg.jpg
  // Use: Night phase / role reveal background (dark, atmospheric)
  NIGHT_BG: '/assets/images/night-bg.jpg',

  // ── Role Card Art ─────────────────────────────────────────────────────────
  // All role images: 400x560px recommended, PNG with transparent bg
  ROLES: {
    // File: /public/assets/images/roles/mir-modon.png
    MIR_MODON:       '/assets/images/roles/mir-modon.png',
    // File: /public/assets/images/roles/mohon-lal.png
    MOHON_LAL:       '/assets/images/roles/mohon-lal.png',
    // File: /public/assets/images/roles/loyal-soldier.png
    LOYAL_SOLDIER:   '/assets/images/roles/loyal-soldier.png',
    // File: /public/assets/images/roles/mir-jafar.png
    MIR_JAFAR:       '/assets/images/roles/mir-jafar.png',
    // File: /public/assets/images/roles/ghaseti-begum.png
    GHASETI_BEGUM:   '/assets/images/roles/ghaseti-begum.png',
    // File: /public/assets/images/roles/ray-durlabh.png
    RAY_DURLABH:     '/assets/images/roles/ray-durlabh.png',
    // File: /public/assets/images/roles/omichand.png
    OMICHAND:        '/assets/images/roles/omichand.png',
    // File: /public/assets/images/roles/eic-conspirator.png
    EIC_CONSPIRATOR: '/assets/images/roles/eic-conspirator.png',
  },

  // ── Map Puzzle Pieces ─────────────────────────────────────────────────────
  // All map pieces: SVG or PNG, should fit together as a 5-piece jigsaw
  // of the Palashi battlefield region
  MAP_PIECES: {
    // File: /public/assets/images/map/piece-1.png  (northwest region)
    1: '/assets/images/map/piece-1.png',
    // File: /public/assets/images/map/piece-2.png  (northeast region)
    2: '/assets/images/map/piece-2.png',
    // File: /public/assets/images/map/piece-3.png  (center region)
    3: '/assets/images/map/piece-3.png',
    // File: /public/assets/images/map/piece-4.png  (southwest region)
    4: '/assets/images/map/piece-4.png',
    // File: /public/assets/images/map/piece-5.png  (Palashi fort — final)
    5: '/assets/images/map/piece-5.png',
  },

  // ── Misc UI ───────────────────────────────────────────────────────────────
  // File: /public/assets/images/leader-token.png
  // Use: The golden token shown next to the current leader (48x48px)
  LEADER_TOKEN: '/assets/images/leader-token.png',

  // File: /public/assets/images/logo.png
  // Use: Polashi wordmark / crest (shown in header)
  LOGO: '/assets/images/logo.png',
};

// ── Sounds ────────────────────────────────────────────────────────────────────

export const SOUNDS = {
  // ── Role Reveal ───────────────────────────────────────────────────────────
  // File: /public/assets/sounds/nawab-reveal.mp3
  // Use: Plays when a Nawab faction player sees their role card
  // Tone: Triumphant dhol/tabla drums, Bengali war theme, ~4s
  NAWAB_REVEAL: '/assets/sounds/nawab-reveal.mp3',

  // File: /public/assets/sounds/eic-reveal.mp3
  // Use: Plays when an EIC faction player sees their role card
  // Tone: Eerie, conspiratorial, strings/oud, ~4s
  EIC_REVEAL: '/assets/sounds/eic-reveal.mp3',

  // ── Voting ────────────────────────────────────────────────────────────────
  // File: /public/assets/sounds/vote-yes.mp3
  // Use: Click sound when a player votes Yes (~0.3s)
  VOTE_YES: '/assets/sounds/vote-yes.mp3',

  // File: /public/assets/sounds/vote-no.mp3
  // Use: Click sound when a player votes No (~0.3s)
  VOTE_NO: '/assets/sounds/vote-no.mp3',

  // File: /public/assets/sounds/vote-pass.mp3
  // Use: Team vote passes — positive resolution sting (~1.5s)
  VOTE_PASS: '/assets/sounds/vote-pass.mp3',

  // File: /public/assets/sounds/vote-fail.mp3
  // Use: Team vote rejected — tense rejection sting (~1.5s)
  VOTE_FAIL: '/assets/sounds/vote-fail.mp3',

  // ── Mission ───────────────────────────────────────────────────────────────
  // File: /public/assets/sounds/clash-ambience.mp3
  // Use: Looping battle ambience during MISSION_CLASH phase (~10s loop)
  CLASH_AMBIENCE: '/assets/sounds/clash-ambience.mp3',

  // File: /public/assets/sounds/mission-success.mp3
  // Use: Chapter won by Nawab — victory fanfare (~2s)
  MISSION_SUCCESS: '/assets/sounds/mission-success.mp3',

  // File: /public/assets/sounds/mission-fail.mp3
  // Use: Chapter sabotaged by EIC — ominous sting (~2s)
  MISSION_FAIL: '/assets/sounds/mission-fail.mp3',

  // ── Endgame ───────────────────────────────────────────────────────────────
  // File: /public/assets/sounds/assassination.mp3
  // Use: Assassination phase begins — tense, dramatic (~3s)
  ASSASSINATION: '/assets/sounds/assassination.mp3',

  // File: /public/assets/sounds/nawab-wins.mp3
  // Use: Nawab faction wins — full victory theme (~5s)
  NAWAB_WINS: '/assets/sounds/nawab-wins.mp3',

  // File: /public/assets/sounds/eic-wins.mp3
  // Use: EIC faction wins — dark triumphant theme (~5s)
  EIC_WINS: '/assets/sounds/eic-wins.mp3',

  // ── Ambience ──────────────────────────────────────────────────────────────
  // File: /public/assets/sounds/tent-ambience.mp3
  // Use: Subtle looping background during War Tent phases (crickets, wind, ~30s loop)
  TENT_AMBIENCE: '/assets/sounds/tent-ambience.mp3',

  // File: /public/assets/sounds/vote-result-pass.mp3
  // Use: Overlay reveal — team approved
  VOTE_RESULT_PASS: '/assets/sounds/vote-result-pass.mp3',

  // File: /public/assets/sounds/vote-result-fail.mp3
  // Use: Overlay reveal — team rejected
  VOTE_RESULT_FAIL: '/assets/sounds/vote-result-fail.mp3',

  // File: /public/assets/sounds/card-pick.mp3
  // Use: Player selects a battle card
  CARD_PICK: '/assets/sounds/card-pick.mp3',
};
