---
name: polashi-safe-edit
description: Safe editing and verification procedure for the Polashi game codebase. Use this skill for ANY change to Polashi — UI/visual work (table scene, cards, overlays, animations, CSS), game logic, server files, audio/asset wiring, endgame text, or deploy tasks. Trigger it even for small tweaks, bug fixes, or when the owner pastes a screenshot with feedback — this repo has recurring build-breaking pitfalls (unicode escapes, apostrophes) and protected files that must survive every change.
---

# Polashi Safe-Edit Procedure

Read `CLAUDE.md` at the repo root first — it holds the locked game rules, file map, and theme.
This skill is the step-by-step procedure for making any change without breaking the game.

## Before editing
1. Locate the real owner of the behavior (screens vs components vs server). Grep, don't guess.
2. If the change touches game rules (roles, counts, team sizes, visibility), STOP and confirm with the owner — those tables are locked.
3. Never plan edits to: `endgameText.js` wording, `run-local.bat`, `update.bat`, git data, `assets/` folders.

## While editing
- Real unicode characters only (⚔ ✓ ✗ …) or HTML entities. Never `\uXXXX` inside JSX strings.
- Any string containing an apostrophe gets double quotes.
- New UI must use the existing dark/gold theme vars from `client/src/styles/global.css` unless the owner asked for a new aesthetic.
- New images/sounds go through `assetManifest.js` slots with graceful fallback — the game must run silently/plainly when a file is missing.
- Keep the server security model: only `clientView.js` decides what each player sees. Never emit master state.

## Verify (mandatory, in order)
1. `cd client && npx vite build` — must end in `✓ built`.
2. If server touched: `node --input-type=module -e "import('./server/roleEngine.js').then(()=>console.log('ok'))"` from repo root (adjust path per file).
3. Scan changed files for `\u` escape sequences inside quotes; fix any found.
4. Confirm protected files still exist: `run-local.bat`, `update.bat`, `client/public/assets/`.

## After verifying
- Summarize what changed in plain language (the owner is non-technical).
- For visual changes: ask the owner to run `run-local.bat` and send a screenshot, then iterate from the screenshot rather than assuming it looks right.
- Offer a one-line commit message; the owner deploys with `update.bat`.
