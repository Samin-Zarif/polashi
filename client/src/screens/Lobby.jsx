import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import SettingsPanel from '../components/SettingsPanel';
import '../components/SettingsPanel.css';
import './Lobby.css';

const OPTIONAL_ROLES = [
  { key: 'MOHON_LAL',    name: 'Mohon Lal',    faction: 'NAWAB', desc: "Sees Mir Modon and Ghaseti Begum in yellow — but cannot tell them apart." },
  { key: 'GHASETI_BEGUM',name: 'Ghaseti Begum', faction: 'EIC',  desc: "Her presence confuses Mohon Lal's vision. A master manipulator." },
  { key: 'RAY_DURLABH',  name: 'Ray Durlabh',  faction: 'EIC',  desc: "Completely invisible to Mir Modon's sight. The ultimate spy." },
  { key: 'OMICHAND',     name: 'Omichand',      faction: 'EIC',  desc: "Isolated from other EIC. Neither side knows who the other is." },
];

const MANDATORY_ROLES = [
  { key: 'MIR_MODON', name: 'Mir Modon', faction: 'NAWAB', desc: 'The Seer. Always in the game.' },
  { key: 'MIR_JAFAR', name: 'Mir Jafar', faction: 'EIC',   desc: 'The Assassin. Always in the game.' },
];

export default function Lobby() {
  const socket     = useGameStore(s => s.socket);
  const myId       = useGameStore(s => s.myId);
  const roomId     = useGameStore(s => s.roomId);
  const lobbyData  = useGameStore(s => s.lobbyData);
  const error      = useGameStore(s => s.error);
  const clearError = useGameStore(s => s.clearError);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!lobbyData) return <div className="lobby" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  const { players, hostId, enabledRoles, canStart, playerCount } = lobbyData;
  const isHost = myId === hostId;
  const maxSlots = 10;

  const toggleRole = (roleKey) => {
    if (!isHost) return;
    const next = enabledRoles.includes(roleKey)
      ? enabledRoles.filter(r => r !== roleKey)
      : [...enabledRoles, roleKey];
    socket.emit('set_enabled_roles', { roles: next });
  };

  const handleStart = () => { clearError(); socket.emit('start_game'); };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="lobby">
      <header className="lobby__header">
        <span className="lobby__brand">⚔ Polashi</span>
        <div className="lobby__room-code">
          <span className="lobby__room-code-label">Room Code</span>
          <span className="lobby__room-code-value">{roomId}</span>
          <button className="lobby__copy-btn" onClick={copyRoomCode}>{copied ? '✓ Copied!' : 'Copy'}</button>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)} title="Audio Settings">&#9881;</button>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </header>

      <div className="lobby__main">
        <section className="lobby__players-section">
          <h3 className="lobby__section-title">Commanders in the Tent</h3>
          <div className="lobby__player-grid">
            {players.map((p, i) => (
              <div key={p.id} className={`lobby__player-slot${p.id === myId ? ' is-me' : ''}${p.isHost ? ' is-host' : ''}`} style={{ '--i': i }}>
                <div className="lobby__player-avatar">{p.name.charAt(0).toUpperCase()}</div>
                <span className="lobby__player-name">{p.name}</span>
                {p.id === myId && <span className="lobby__player-badge">You</span>}
                {p.isHost && <span className="lobby__player-badge">Host</span>}
              </div>
            ))}
            {Array.from({ length: maxSlots - playerCount }).map((_, i) => (
              <div key={`empty-${i}`} className="lobby__empty-slot">
                <div className="lobby__empty-dot">+</div>
                <span className="text-muted text-sm">Waiting for player&hellip;</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="lobby__host-panel">
          <h3 className="lobby__section-title">{isHost ? 'Role Setup' : 'Roles in Play'}</h3>
          <div className="lobby__roles-grid">
            {MANDATORY_ROLES.map(role => (
              <div key={role.key} className="lobby__role-toggle mandatory enabled">
                <div className="lobby__role-checkbox">✓</div>
                <div className="lobby__role-info">
                  <div className="lobby__role-name">{role.name}</div>
                  <div className={`lobby__role-faction ${role.faction.toLowerCase()}`}>
                    {role.faction === 'NAWAB' ? 'Nawab Pokkho' : 'EIC Pokkho'} &middot; Mandatory
                  </div>
                  <div className="lobby__role-desc">{role.desc}</div>
                </div>
              </div>
            ))}
            {OPTIONAL_ROLES.map(role => {
              const isEnabled = enabledRoles.includes(role.key);
              return (
                <button key={role.key}
                  className={`lobby__role-toggle${isEnabled ? ' enabled' : ''}`}
                  onClick={() => toggleRole(role.key)}
                  disabled={!isHost} aria-pressed={isEnabled}>
                  <div className="lobby__role-checkbox">{isEnabled ? '✓' : ''}</div>
                  <div className="lobby__role-info">
                    <div className="lobby__role-name">{role.name}</div>
                    <div className={`lobby__role-faction ${role.faction.toLowerCase()}`}>
                      {role.faction === 'NAWAB' ? 'Nawab Pokkho' : 'EIC Pokkho'}
                    </div>
                    <div className="lobby__role-desc">{role.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lobby__start-section">
            <div className="lobby__player-count">
              <span className="lobby__count-label">Players</span>
              <span className={`lobby__count-value ${canStart ? 'ready' : 'waiting'}`}>{playerCount} / 10</span>
            </div>
            {error && <div className="lobby__error">{error}</div>}
            {isHost ? (
              <>
                <button className="btn btn-primary w-full" onClick={handleStart} disabled={!canStart}>
                  ⚔ Begin the Battle
                </button>
                {!canStart && (
                  <p className="lobby__waiting-note">
                    Need {Math.max(0, 5 - playerCount)} more commander{5 - playerCount !== 1 ? 's' : ''} to begin
                  </p>
                )}
              </>
            ) : (
              <p className="lobby__waiting-note animate-flicker">Waiting for the host to begin&hellip;</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
