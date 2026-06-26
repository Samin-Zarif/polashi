import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { BackgroundImage } from '../components/AssetImage';
import { IMAGES } from '../assets/assetManifest';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import SettingsPanel from '../components/SettingsPanel';
import '../components/SettingsPanel.css';
import './Landing.css';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${50 + Math.random() * 50}%`,
  dur: `${4 + Math.random() * 6}s`,
  delay: `${Math.random() * 5}s`,
}));

export default function Landing() {
  const socket = useGameStore(s => s.socket);
  const error = useGameStore(s => s.error);
  const clearError = useGameStore(s => s.clearError);
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Start background music on first interaction (browser requires user gesture)
  const handleFirstInteraction = () => { startBackgroundMusic(); };

  const setTempName = (n) => {
    setName(n);
    useGameStore.setState({ myName: n.trim() });
  };

  useEffect(() => { clearError(); }, [tab]);

  const handleCreate = () => {
    if (!name.trim()) return useGameStore.setState({ error: 'Enter your name to continue.' });
    setLoading(true);
    socket.emit('create_room', { playerName: name.trim() });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = () => {
    if (!name.trim()) return useGameStore.setState({ error: 'Enter your name.' });
    if (!roomCode.trim()) return useGameStore.setState({ error: 'Enter a room code.' });
    setLoading(true);
    socket.emit('join_room', { roomId: roomCode.toUpperCase().trim(), playerName: name.trim() });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') tab === 'create' ? handleCreate() : handleJoin();
  };

  return (
    <div className="landing" onClick={handleFirstInteraction} onKeyDown={handleFirstInteraction}>
      <BackgroundImage src={IMAGES.LANDING_BG} className="landing__bg" />
      <div className="landing__bg-overlay" />
      <div className="landing__particles" aria-hidden="true">
        {PARTICLES.map(p => (
          <div key={p.id} className="landing__particle"
            style={{ left: p.left, top: p.top, '--dur': p.dur, '--delay': p.delay }} />
        ))}
      </div>
      <div className="landing__content">
        <p className="landing__year">১৭৫৭ · The Battle of Palashi</p>
        <h1 className="landing__title">POLASHI</h1>
        <p className="landing__subtitle">A Game of Loyalty &amp; Betrayal</p>
        <div className="landing__form-wrap animate-scale">
          <div className="landing__tabs" role="tablist">
            <button className={`landing__tab${tab === 'create' ? ' active' : ''}`}
              onClick={() => setTab('create')} role="tab" aria-selected={tab === 'create'}>
              Create Room
            </button>
            <button className={`landing__tab${tab === 'join' ? ' active' : ''}`}
              onClick={() => setTab('join')} role="tab" aria-selected={tab === 'join'}>
              Join Room
            </button>
          </div>
          {error && <div className="landing__error" role="alert">{error}</div>}
          <label className="landing__label" htmlFor="player-name">Your Name</label>
          <input id="player-name" className="input" type="text" placeholder="Enter your name&hellip;"
            value={name} onChange={e => setTempName(e.target.value)} onKeyDown={handleKey} maxLength={20} autoFocus />
          {tab === 'join' && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <label className="landing__label" htmlFor="room-code">Room Code</label>
              <input id="room-code" className="input" type="text" placeholder="6-letter code&hellip;"
                value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey} maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.3em', textAlign: 'center' }} />
            </div>
          )}
          <div className="landing__action-row">
            {tab === 'create' ? (
              <button className="btn btn-primary w-full" onClick={handleCreate} disabled={loading || !socket}>
                {loading ? <span className="spinner" /> : '⚔ Raise the War Tent'}
              </button>
            ) : (
              <button className="btn btn-primary w-full" onClick={handleJoin} disabled={loading || !socket}>
                {loading ? <span className="spinner" /> : '→ Enter the Tent'}
              </button>
            )}
          </div>
          {!socket && <p className="text-muted text-sm text-center mt-sm">Connecting to the war tent&hellip;</p>}
        </div>
      </div>
      <p className="landing__footer">1757 &middot; Bengal &middot; Social Deduction &middot; 5&ndash;10 Players</p>

      {/* Settings gear — fixed top right */}
      <button className="settings-btn" onClick={() => setShowSettings(true)}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}
        title="Audio Settings">
        &#9881;
      </button>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
