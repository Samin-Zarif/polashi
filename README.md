# ⚔ Polashi — The 1757 Battle of Palashi

A real-time, multiplayer social deduction web game set in the Battle of Palashi.
Built on the Resistance/Avalon engine with a full Bangladeshi historical theme.

---

## Project Structure

```
polashi/
├── server/               # Node.js + Socket.IO backend
│   ├── server.js         # Main server + all socket events
│   ├── constants.js      # Roles, phases, team sizes, win conditions
│   ├── roleEngine.js     # Role assignment + visibility matrix computation
│   ├── clientView.js     # Secure per-player state filter
│   ├── store.js          # In-memory room/game state
│   └── package.json
│
└── client/               # React + Vite frontend
    ├── src/
    │   ├── App.jsx           # Screen router
    │   ├── main.jsx          # Entry point
    │   ├── store/
    │   │   └── gameStore.js  # Zustand state
    │   ├── hooks/
    │   │   └── useSocket.js  # Socket.IO connection manager
    │   ├── screens/
    │   │   ├── Landing.jsx   # Home / Create / Join
    │   │   ├── Lobby.jsx     # Waiting room + host role picker
    │   │   └── Game.jsx      # Role reveal + game shell
    │   └── styles/
    │       └── global.css    # Full design system
    └── public/
        └── assets/
            ├── images/       # Battlefield BG, war tent, role artwork
            │   └── roles/    # Individual role card images
            └── sounds/       # Music and SFX
```

---

## Setup & Run

### 1. Start the Backend
```bash
cd server
npm install
node server.js
# Runs on http://localhost:3001
```

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Open Multiple Tabs
Open `http://localhost:5173` in 5+ browser tabs to test multiplayer.

---

## Adding Assets

### Background Images
Drop into `client/public/assets/images/`:
- `battlefield-bg.jpg` → Landing page hero
- `war-tent-bg.jpg`    → Main game background

Then uncomment the `background-image` lines in `Landing.css` and `Game.css`.

### Role Card Images
Drop into `client/public/assets/images/roles/`:
- `mir_modon.png`, `mir_jafar.png`, `mohon_lal.png`, etc.

Then replace the emoji icons in `Game.jsx`'s `ROLE_DISPLAY` with `<img>` tags.

### Sounds
Drop into `client/public/assets/sounds/`:
- `nawab_drums.mp3`, `eic_theme.mp3`, `clash.mp3`, etc.

Then uncomment the `useEffect` sound hooks in `Game.jsx`.

---

## Game Phases (State Machine)

```
LOBBY
  → ROLE_REVEAL     (each player sees their secret role card)
  → NIGHT_PHASE     (intel view, 8 second pause)
  → TEAM_PROPOSAL   (leader selects team)
  → TEAM_VOTE       (all vote yes/no)
  → MISSION_CLASH   (team submits loyal/betrayal cards)
  → ROUND_RESULT    (chapter outcome revealed)
  ↑_________________↓ (loop for up to 5 chapters)
  → ASSASSINATION   (if Nawab wins 3, Mir Jafar gets one shot)
  → GAME_OVER
```

---

## Security Model

The server **never broadcasts the master game state**. Each socket emission calls
`buildClientView(masterState, recipientId)` which strips all role/faction data
from other players and sends only the pre-computed `myIntel` for that specific
player. Even if a client intercepts all their WebSocket traffic, they cannot
learn more than their role entitles them to see.

---

## Phase Roadmap

- **Phase 1** ✅ — Project setup, lobby, role reveal, secure state engine
- **Phase 2** — War Tent UI (main game: proposals, voting, mission clash)
- **Phase 3** — Puzzle map scoreboard, animations, full visual polish
- **Phase 4** — Assassination phase, game over screen
- **Phase 5** — Cinematic intro, audio integration, mobile polish
