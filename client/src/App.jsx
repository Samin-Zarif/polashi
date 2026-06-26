// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — App Root
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useSocket }    from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import Landing          from './screens/Landing';
import Lobby            from './screens/Lobby';
import Game             from './screens/Game';
import './styles/global.css';

export default function App() {
  // Initialise socket connection once
  useSocket();

  const screen = useGameStore(s => s.screen);

  return (
    <>
      {screen === 'LANDING' && <Landing />}
      {screen === 'LOBBY'   && <Lobby />}
      {screen === 'GAME'    && <Game />}
    </>
  );
}
