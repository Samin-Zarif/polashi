import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import SettingsPanel from '../components/SettingsPanel';
import { preloadWarRoom, STATUES, statueLook } from '../components/warRoomAssets';
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
  { key: 'MIR_JAFAR', name: 'Mir Jafar', faction: 'EIC',   desc: 'The Great Traitor. Always in the game.' },
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
  const [roleNote, setRoleNote] = useState('');   // why a role switch didn't do what the host asked
  // Start downloading the war room while players are still joining
  useEffect(() => { preloadWarRoom(); }, []);
  // the note fades after a few seconds
  useEffect(() => {
    if (!roleNote) return;
    const t = setTimeout(() => setRoleNote(''), 4500);
    return () => clearTimeout(t);
  }, [roleNote]);

  if (!lobbyData) return <div className="lobby" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  const { players, hostId, enabledRoles, canStart, playerCount } = lobbyData;
  const isHost = myId === hostId;
  const maxSlots = 10;

  // Mohon Lal can only be in the game with Ghaseti Begum (he sees the two of them alike)
  const ghasetiOn = enabledRoles.includes('GHASETI_BEGUM');
  const toggleRole = (roleKey) => {
    if (!isHost) return;
    if (roleKey === 'MOHON_LAL' && !ghasetiOn && !enabledRoles.includes('MOHON_LAL')) {
      setRoleNote("Mohon Lal can't be chosen without Ghaseti Begum. Turn her on first.");
      return;
    }
    let next = enabledRoles.includes(roleKey)
      ? enabledRoles.filter(r => r !== roleKey)
      : [...enabledRoles, roleKey];
    if (roleKey === 'GHASETI_BEGUM' && !next.includes('GHASETI_BEGUM') && next.includes('MOHON_LAL')) {
      next = next.filter(r => r !== 'MOHON_LAL');
      setRoleNote("Mohon Lal is off too: he can't be in the game without Ghaseti Begum.");
    } else {
      setRoleNote('');
    }
    socket.emit('set_enabled_roles', { roles: next });
  };

  const handleStart = () => { clearError(); socket.emit('start_game'); };
  const me = players.find(p => p.id === myId);
  const myLook = statueLook(me);
  const chooseLook = (key) => { if (key !== myLook) socket.emit('set_look', { look: key }); };
  const statueOf = (p) => STATUES.find(s => s.key === statueLook(p)) || STATUES[0];

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
          {/* each player picks the statue they sit as at the war table, before any role is dealt */}
          <div className="lobby__statues">
            <h3 className="lobby__section-title">Your Statue</h3>
            <div className="lobby__statue-choices" role="radiogroup" aria-label="Your statue at the war table">
              {STATUES.map(s => (
                <button key={s.key} type="button" role="radio" aria-checked={myLook === s.key}
                  className={`lobby__statue${myLook === s.key ? ' is-chosen' : ''}`}
                  onClick={() => chooseLook(s.key)}>
                  <img src={s.image} alt="" className="lobby__statue-img" draggable="false" />
                  <span className="lobby__statue-label">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="lobby__statue-note">Cosmetic only. It changes how you look at the war table, nothing else.</p>
          </div>

          <h3 className="lobby__section-title">Commanders in the Tent</h3>
          <div className="lobby__player-grid">
            {players.map((p, i) => (
              <div key={p.id} className={`lobby__player-slot${p.id === myId ? ' is-me' : ''}${p.isHost ? ' is-host' : ''}`} style={{ '--i': i }}>
                <div className="lobby__player-avatar"><img src={statueOf(p).image} alt="" draggable="false" /></div>
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
              const locked = role.key === 'MOHON_LAL' && !ghasetiOn && !isEnabled;
              return (
                <button key={role.key}
                  className={`lobby__role-toggle${isEnabled ? ' enabled' : ''}${locked ? ' is-locked' : ''}`}
                  onClick={() => toggleRole(role.key)}
                  disabled={!isHost} aria-pressed={isEnabled} aria-disabled={locked || undefined}>
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
          {roleNote && <p className="lobby__roles-alert" role="status">{roleNote}</p>}
          <p className="lobby__roles-note">
            Mohon Lal needs Ghaseti Begum in the game. Ray Durlabh and Omichand can still appear without their abilities when they are off, and so can Jagat Seth. The night screen lists every EIC in the game.
          </p>

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
