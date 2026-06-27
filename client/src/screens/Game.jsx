import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { AssetImage } from '../components/AssetImage';
import { IMAGES, SOUNDS } from '../assets/assetManifest';
import { useSound } from '../hooks/useSound';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import WarTent from './WarTent';
import './Game.css';

// Fallback emoji when role image not added yet
const ROLE_FALLBACK = {
  MIR_MODON: 'S', MOHON_LAL: 'B', LOYAL_SOLDIER: 'L',
  MIR_JAFAR: 'A', GHASETI_BEGUM: 'D', RAY_DURLABH: 'H',
  OMICHAND: 'O', EIC_CONSPIRATOR: 'E',
};

function RoleReveal({ gameState }) {
  const socket   = useGameStore(s => s.socket);
  const { play } = useSound();
  const [acked, setAcked] = useState(false);
  const { myRoleInfo, myIntel, players } = gameState;

  // Start background music and play faction reveal sound
  useEffect(() => {
    if (!myRoleInfo) return;
    const sound = myRoleInfo.faction === 'NAWAB' ? SOUNDS.NAWAB_REVEAL : SOUNDS.EIC_REVEAL;
    play(sound, { volume: 0.8 });
  }, [myRoleInfo?.role]);

  if (!myRoleInfo) return null;
  const { role, faction, roleMeta } = myRoleInfo;
  const isNawab    = faction === 'NAWAB';
  const readyCount = players.filter(p => p.isReady).length;
  const redNames   = myIntel.redPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean);
  const yellowNames= myIntel.yellowPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean);

  const handleAck = () => {
    if (acked) return;
    setAcked(true);
    socket.emit('role_reveal_ack');
  };

  return (
    <div className="role-reveal">
      {/* Left — Role Card (pinned, 10% bigger) */}
      <div className="role-reveal__card animate-pulse-gold">
        <p className="role-reveal__eyebrow">Your orders have arrived</p>
        <div className={`role-reveal__faction-badge ${isNawab ? 'nawab' : 'eic'}`}>
          {isNawab ? 'Nawab Pokkho' : 'EIC Pokkho'}
        </div>
        <div className="role-reveal__icon">
          <AssetImage
            src={IMAGES.ROLES[role]}
            alt={roleMeta.displayName}
            fallback={ROLE_FALLBACK[role] || '?'}
            style={{ width: 88, height: 124, objectFit: 'cover' }}
          />
        </div>
        <h2 className="role-reveal__name">{roleMeta.displayName}</h2>
        <p className="role-reveal__title">{roleMeta.title}</p>
        <p className="role-reveal__desc">{roleMeta.description}</p>
      </div>

      {/* Right — Intel + Actions */}
      <div className="role-reveal__right">
        {(redNames.length > 0 || yellowNames.length > 0) && (
          <div className="role-reveal__intel-block">
            <p className="role-reveal__intel-title">Your Intelligence</p>
            <div className="role-reveal__intel-list">
              {redNames.map(name    => <div key={name} className="role-reveal__intel-player intel-red">&bull; {name} &mdash; EIC Traitor</div>)}
              {yellowNames.map(name => <div key={name} className="role-reveal__intel-player intel-yellow">&#9680; {name} &mdash; Suspect</div>)}
            </div>
          </div>
        )}
        {!acked ? (
          <button className="btn btn-primary" onClick={handleAck}>
            I understand my orders
          </button>
        ) : (
          <div>
            <p className="role-reveal__waiting animate-flicker">Awaiting other commanders&hellip;</p>
            <p className="role-reveal__players-ready">{readyCount} / {players.length} ready</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NightPhase({ gameState }) {
  const { play } = useSound();
  const { myIntel, players } = gameState;
  const redNames    = myIntel.redPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean);
  const yellowNames = myIntel.yellowPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean);

  // Play tent ambience
  useEffect(() => { play(SOUNDS.TENT_AMBIENCE, { loop: true, volume: 0.3 }); }, []);

  return (
    <div className="night-phase">
      <h1 className="night-phase__title animate-flicker">The Night Closes In</h1>
      <p className="night-phase__desc animate-fade">
        The war tent falls silent. Look around the table. Remember what you know.
      </p>

      {(redNames.length > 0 || yellowNames.length > 0) && (
        <div className="role-reveal__intel-block" style={{ marginTop: 'var(--space-xl)' }}>
          <p className="role-reveal__intel-title">Your Intelligence</p>
          <div className="role-reveal__intel-list">
            {redNames.map(name    => <div key={name} className="role-reveal__intel-player intel-red">&bull; {name}</div>)}
            {yellowNames.map(name => <div key={name} className="role-reveal__intel-player intel-yellow">&#9680; {name}</div>)}
          </div>
        </div>
      )}

      <p className="night-phase__menace animate-fade" style={{ animationDelay: '1s' }}>
        {myRoleInfo?.faction === 'EIC'
          ? "Smile. Conspire. And when the moment comes — bury Bengal."
          : "The fate of Bengal rests in your hands."}
      </p>
      <p className="role-reveal__waiting" style={{ marginTop: 'var(--space-lg)' }}>
        Dawn approaches&hellip; the council begins shortly.
      </p>
    </div>
  );
}

export default function Game() {
  const gameState = useGameStore(s => s.gameState);
  if (!gameState) return <div className="game-shell"><div className="spinner" /></div>;
  const { phase } = gameState;
  if (phase === 'ROLE_REVEAL') return <RoleReveal gameState={gameState} />;
  if (phase === 'NIGHT_PHASE') return <NightPhase gameState={gameState} />;
  return <WarTent gameState={gameState} />;
}
