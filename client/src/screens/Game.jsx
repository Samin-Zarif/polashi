import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { AssetImage } from '../components/AssetImage';
import { IMAGES, SOUNDS } from '../assets/assetManifest';
import { useSound } from '../hooks/useSound';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import WarTent from './WarTent';
import { preloadWarRoom } from '../components/warRoomAssets';
import './Game.css';

// Fallback emoji when role image not added yet
const ROLE_FALLBACK = {
  MIR_MODON:       'M',
  MOHON_LAL:       'B',
  SIRAJ:           'N',
  LUTFUNNISA:      'L',
  ST_FRAIS:        'F',
  JEAN_LAW:        'J',
  DE_BUSSY:        'D',
  MIR_JAFAR:       'A',
  GHASETI_BEGUM:   'G',
  RAY_DURLABH:     'R',
  OMICHAND:        'O',
  RAY_DURLABH_PLAIN: 'R',
  OMICHAND_PLAIN:    'O',
  JAGAT_SETH:        'J',
};
const COUNT_WORDS = ['No one', 'One', 'Two', 'Three', 'Four', 'Five'];

// Shown on the card back only if /assets/images/logo.png is missing
function CardBackEmblem() {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" stroke="#8a6a2f" strokeWidth="2" fill="none"/>
      <circle cx="60" cy="60" r="44" stroke="#8a6a2f" strokeWidth="1" strokeDasharray="5 4" fill="none"/>
      <line x1="34" y1="34" x2="86" y2="86" stroke="#c9913a" strokeWidth="3" strokeLinecap="round"/>
      <line x1="86" y1="34" x2="34" y2="86" stroke="#c9913a" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="60" cy="60" r="6" fill="#c9913a"/>
      <circle cx="60" cy="60" r="2.6" fill="#e8b84b"/>
    </svg>
  );
}

// Role reveal timing (ms). FLIP_MS must match --flip-ms in Game.css.
const HOLD_BACK_MS = 2000;   // how long the card back stays up before it turns
const FLIP_MS      = 2600;   // how long the turn itself takes

function RoleReveal({ gameState }) {
  const socket   = useGameStore(s => s.socket);
  const { play } = useSound();
  const [acked, setAcked] = useState(false);
  // 'back' = card back showing, 'turning' = card turning over, 'revealed' = orders fade in below
  const [stage, setStage] = useState('back');
  // The countdown starts only once the player can see the page (not while the tab is in the
  // background), so nobody misses the card turning over.
  useEffect(() => {
    let turn = 0, done = 0;
    const start = () => {
      if (document.visibilityState !== 'visible' || turn) return;
      document.removeEventListener('visibilitychange', start);
      turn = setTimeout(() => setStage('turning'),  HOLD_BACK_MS);
      done = setTimeout(() => setStage('revealed'), HOLD_BACK_MS + FLIP_MS);
    };
    start();
    document.addEventListener('visibilitychange', start);
    return () => { document.removeEventListener('visibilitychange', start); clearTimeout(turn); clearTimeout(done); };
  }, []);
  const { myRoleInfo, myIntel, players } = gameState;

  // Faction sound plays as the card turns over (playing it earlier would give the faction away)
  useEffect(() => {
    if (stage !== 'turning' || !myRoleInfo) return;
    const sound = myRoleInfo.faction === 'NAWAB' ? SOUNDS.NAWAB_REVEAL : SOUNDS.EIC_REVEAL;
    play(sound, { volume: 0.8 });
  }, [stage]);

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

  const hasIntel = redNames.length > 0 || yellowNames.length > 0;
  // the Nawab cards without abilities say so, in small coloured print under their line
  const noAbilities = isNawab && !roleMeta.abilities;
  const turned   = stage !== 'back';
  const revealed = stage === 'revealed';

  return (
    <div className="role-reveal">
      {/* The card — back first, then it turns over slowly */}
      <div className={`role-card-scene${turned ? ' is-turned' : ''}`}>
        {/* Back face — identical for every role */}
        <div className="role-card-face role-card-face--back">
          <div className="role-card-back">
            <div className="role-card-back__frame" />
            <AssetImage
              src={IMAGES.LOGO}
              alt=""
              className="role-card-back__emblem"
              fallback={<CardBackEmblem />}
              style={{ opacity: 1 }}
            />
            <div className="role-card-back__title">Polashi</div>
            <div className="role-card-back__year">১৭৫৭</div>
          </div>
        </div>
        {/* Front face — portrait fills the card, name plate at the bottom */}
        <div className="role-card-face role-card-face--front">
          <div className={`role-card ${isNawab ? 'is-nawab' : 'is-eic'}`}>
            <div className="role-card__portrait">
              <AssetImage
                src={IMAGES.ROLES[role]}
                alt={roleMeta.displayName}
                fallback={ROLE_FALLBACK[role] || '?'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', fontSize: undefined, opacity: undefined }}
              />
            </div>
            <div className="role-card__badge">{isNawab ? 'Nawab' : 'EIC'}</div>
            <div className="role-card__plate">
              <h2 className="role-card__name">
                {/* keep hyphenated words like "ud-Daulah" on one line */}
                {roleMeta.displayName.split(/(\S*-\S*)/).map((part, i) =>
                  part.includes('-') ? <span key={i} className="nowrap">{part}</span> : part)}
              </h2>
              <p className="role-card__title">{roleMeta.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Under the card, on the same centre line: orders, intelligence, button */}
      <div className={`role-reveal__details${revealed ? ' is-shown' : ''}`}>
        <div className="role-reveal__orders">
          <p className="role-reveal__desc">{roleMeta.description}</p>
          {noAbilities && <p className="role-reveal__no-abilities">No special abilities</p>}
        </div>
        {hasIntel && (
          <div className="role-reveal__intel-block">
            <p className="role-reveal__intel-title">Your Intelligence</p>
            <div className="role-reveal__intel-list">
              {redNames.map(name    => <div key={name} className="role-reveal__intel-player intel-red">&bull; {name} &mdash; EIC Traitor</div>)}
              {yellowNames.map(name => <div key={name} className="role-reveal__intel-player intel-yellow">&#9680; {name} &mdash; Suspect</div>)}
            </div>
          </div>
        )}
        <div className="role-reveal__card-action">
          {!acked ? (
            <button className="btn btn-primary" onClick={handleAck} disabled={!revealed}>
              I understand my orders
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p className="role-reveal__waiting animate-flicker">Awaiting other commanders&hellip;</p>
              <p className="role-reveal__players-ready">{readyCount} / {players.length} ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NightPhase({ gameState }) {
  const { play } = useSound();
  const { myIntel, myRoleInfo, players } = gameState;
  // this game's EIC characters, and whether each has abilities (everyone sees the same list)
  const lineup = gameState.eicLineup || [];
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

      {lineup.length > 0 && (
        <section className="night-lineup" aria-label="This game's EIC">
          <p className="night-lineup__title">{COUNT_WORDS[lineup.length] || lineup.length} of you serve the Company</p>
          <ul className="night-lineup__list">
            {lineup.map((e, i) => (
              <li key={i} className={`night-lineup__row${e.abilities ? ' has-abilities' : ''}`}>
                <span className="night-lineup__name">{e.name}</span>
                <span className="night-lineup__mark" aria-hidden="true" />
                <span className="night-lineup__abilities">{e.abilities ? 'with abilities' : 'without abilities'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(redNames.length > 0 || yellowNames.length > 0) && (
        <div className="role-reveal__intel-block night-intel">
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
  // Download the war room picture and statues now, so the war tent opens ready
  useEffect(() => { preloadWarRoom(); }, []);
  // The game has started: the background music plays, quietly (5% unless the player changed it)
  useEffect(() => { startBackgroundMusic(); }, []);
  if (!gameState) return <div className="game-shell"><div className="spinner" /></div>;
  const { phase } = gameState;
  if (phase === 'ROLE_REVEAL') return <RoleReveal gameState={gameState} />;
  if (phase === 'NIGHT_PHASE') return <NightPhase gameState={gameState} />;
  return <WarTent gameState={gameState} />;
}
