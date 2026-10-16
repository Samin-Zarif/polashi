# POLASHI — Project Guide for Claude Code

Multiplayer social deduction game (Avalon/Resistance engine) themed on the 1757 Battle of Palashi.
Nawab loyalists vs East India Company traitors. Owner is non-technical — explain changes simply,
never assume they can debug code themselves.

## Stack & Run
- **Server:** Node + Express + Socket.IO, in-memory rooms, port 3001. Entry: `server/server.js`.
- **Client:** React + Vite + Zustand, port 5173. Entry: `client/src/`.
- Local run: double-click `run-local.bat` (installs deps, opens both windows, opens browser).
- Port 3001 stuck: `netstat -ano | findstr :3001` then `taskkill /PID <pid> /F`.
- Deploy: git push → Render (server) + Vercel (client) auto-redeploy. `update.bat` does add/commit/push.

## Key Files
- `server/constants.js` — roles, ROLE_META, phases, TEAM_SIZES, FACTION_COUNTS, REQUIRES_TWO_BETRAYALS
- `server/roleEngine.js` — role assignment + intel visibility matrix
- `server/clientView.js` — SECURITY: builds per-player filtered state. Server must NEVER broadcast roles/factions raw.
- `client/src/screens/` — Landing, Lobby, Game (role reveal + night phase), WarTent (main game)
- `client/src/components/` — SealVote (council vote), BattleCardOverlay (clash cards), BattleUnderway (the rain at Palashi: full-screen battle
  for whoever waits during the clash, over Zarif's painting split into `battle-sky.webp` and `battle-field.webp` in
  `assets/images/battle/`; the painting is his: don't replace or repaint it; his original is `build/Battle underway.jpg`), SettingsPanel, CinematicText, LoadingScreen, WarTable3D + warRoom3D (the 3D war room)
- `client/src/data/endgameText.js` — USER-AUTHORED endgame lines. Never rewrite the wording; only fix syntax if broken.
- `client/src/assets/assetManifest.js` — image/sound slots, all with graceful silent fallback if file missing.

## Game Rules — LOCKED, verified correct, do not change without explicit owner approval
- Faction counts: 5p=3N/2E, 6p=4N/2E, 7p=4N/3E, 8p=5N/3E, 9p=6N/3E, 10p=6N/4E. Mir Modon + Mir Jafar always in.
- Team sizes per chapter (TEAM_SIZES[count] = [null,c1..c5]):
  5:[2,3,2,3,3] 6:[2,3,4,3,4] 7:[2,3,3,4,4] 8:[3,4,4,5,5] 9:[3,4,4,5,5] 10:[3,4,4,5,5]
- Chapter 4 with 7+ players needs 2 betrayal cards to fail (`REQUIRES_TWO_BETRAYALS`).
- No "Loyal Soldier" role — powerless Nawab slots draw randomly from: SIRAJ, LUTFUNNISA, ST_FRAIS, JEAN_LAW, DE_BUSSY.
- No "EIC Conspirator" role (owner's decision, 14 Oct 2026) — EIC places not taken by Mir Jafar and the host's special EIC
  draw randomly from Ray Durlabh, Omichand and Jagat Seth WITHOUT abilities (`RAY_DURLABH_PLAIN`, `OMICHAND_PLAIN`,
  `JAGAT_SETH`), never a character already in the game with his abilities. They see, and are seen, like any standard EIC.
- Visibility: Mir Modon sees EIC red except Ray Durlabh; Mohon Lal sees Mir Modon + Ghaseti in yellow (can't distinguish);
  Omichand sees nobody and nobody sees him; other EIC see each other except Omichand. (Ray Durlabh's and Omichand's
  rules apply only to the versions WITH abilities.)
- Mohon Lal only comes with Ghaseti Begum (owner's decision, 15 Oct 2026): the lobby greys him out until she is on and
  says why; the server drops him without her (`set_enabled_roles`) and gives her the first EIC place (`buildRolePool`).
- The night screen shows everyone this game's EIC characters and whether each has abilities (`eicLineup`, built in
  `server/roleEngine.js`, sent by `clientView.js`) — never who holds them.
- The reveal (owner's decision, 15 Oct 2026): during ASSASSINATION every client gets only the EIC players' roles (red in
  the room); at GAME_OVER, every role (`isRevealed` in `clientView.js`). Mir Jafar can only strike the Nawab's side.
- Statues are cosmetic: each player picks one of three in the lobby, before any role is dealt (`look`: 'A' turban and
  beard, 'B' bare head, 'W' queen). No statue changes with the role.
- Endgame Victory/Defeat, and the team name above it, is per-player faction (`myRoleInfo.faction`), NOT the winning side.
  The end is a full screen (`GameOverScreen`), and Victory is always green and Defeat always red, tint included, whatever
  the team (owner's decision, 17 Oct 2026); the team name keeps its own colour.

## Critical Pitfalls (these have broken builds repeatedly)
1. **Never write `\uXXXX` escapes inside JSX strings** — they render as literal text. Use real characters (⚔ ✓ ✗) or HTML entities (`&#9876;`).
2. **Apostrophes in single-quoted JS strings break the build.** Use double quotes for any string containing `'`.
3. **Always verify before finishing:** `cd client && npx vite build` must pass. If server files changed, also import-check them with node.
4. **Never delete or omit** `run-local.bat`, `update.bat`, the git data, or `client/public/assets/`.
5. UI theme: dark + gold (Cinzel/heading fonts, CSS vars in `client/src/styles/global.css`). Match it.

## Workflow With the Owner
- After any visual change: build, then ask the owner to run `run-local.bat` and send a screenshot. Iterate from screenshots.
- Keep changes scoped; do not refactor unrelated files.
- Commit with clear messages; the owner pushes with `update.bat` (or asks Claude to push from his PC with git).
