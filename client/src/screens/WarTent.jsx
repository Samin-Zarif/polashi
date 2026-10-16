// POLASHI - War Tent Phase 2 Main Game UI
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import BattleCardOverlay from '../components/BattleCardOverlay';
import BattleUnderway from '../components/BattleUnderway';
import '../components/BattleCardOverlay.css';
import SealVote from '../components/SealVote';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import { setMusicScene } from '../hooks/useAudioStore';
import SettingsPanel from '../components/SettingsPanel';
import '../components/SettingsPanel.css';
import CinematicText from '../components/CinematicText';
import '../components/CinematicText.css';
import { AssetImage } from '../components/AssetImage';
import { IMAGES, SOUNDS } from '../assets/assetManifest';
import { useSound, playSound } from '../hooks/useSound';
import { pickVariant, getEndgameKey } from '../data/endgameText';
import WarTable3D from '../components/WarTable3D';
import './WarTent.css';

const ROLE_ICONS = {
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
const CHAPTER_ICONS = ['I','II','III','IV','V'];
const TEAM_SIZES = {
  5:[null,2,3,2,3,3],6:[null,2,3,4,3,4],7:[null,2,3,3,4,4],
  8:[null,3,4,4,5,5],9:[null,3,4,4,5,5],10:[null,3,4,4,5,5],
};

// ── Phase Banner ──────────────────────────────────────────────────────────────
function PhaseBanner({ phase, leaderName, teamSize, rejectionCount, isLeader }) {
  const title = {TEAM_PROPOSAL:'Team Proposal',TEAM_VOTE:'Council Vote',MISSION_CLASH:'The Clash',ROUND_RESULT:'Chapter Result'}[phase]||phase;
  let desc = '';
  if (phase==='TEAM_PROPOSAL') desc = isLeader ? `Choose ${teamSize} commanders for this chapter.` : `${leaderName} is choosing ${teamSize} commanders.`;
  if (phase==='TEAM_VOTE')     desc = 'All commanders must vote on the proposed team.';
  if (phase==='MISSION_CLASH') desc = 'Approved commanders — submit your action card.';
  if (phase==='ROUND_RESULT')  desc = 'The battlefield speaks…';
  return (
    <div className="wt-phase-banner">
      <div className="wt-phase-banner__text">
        <div className="wt-phase-banner__title">{title}</div>
        <div className="wt-phase-banner__desc">{desc}</div>
      </div>
      {rejectionCount > 0 && <div className="wt-phase-banner__rejection">{rejectionCount} / 5 rejections</div>}
    </div>
  );
}

// ── Puzzle Map ────────────────────────────────────────────────────────────────
function PuzzleMap({ chapterScores, currentChapter }) {
  const nawab = chapterScores.filter(s=>s==='NAWAB').length;
  const eic   = chapterScores.filter(s=>s==='EIC').length;
  return (
    <section className="wt-plaque wt-map">
      <h2 className="wt-plaque__title">Battle Map</h2>
      <div className="wt-map__pieces">
        {chapterScores.map((score,i) => {
          const isCurrent = (i+1)===currentChapter && !score;
          return (
            <div key={i} className={`wt-map__piece${score?' '+score.toLowerCase():''}${isCurrent?' current':''}`}
              title={`Chapter ${i+1}${score==='NAWAB'?': Nawab victory':score==='EIC'?': EIC sabotage':isCurrent?': now':''}`}>
              <span className="wt-map__piece-num">{CHAPTER_ICONS[i]}</span>
              <span className="wt-map__piece-icon">{score==='NAWAB'?'✓':score==='EIC'?'✗':''}</span>
            </div>
          );
        })}
      </div>
      <div className="wt-map__score">
        <span className="wt-map__score-nawab">Nawab {nawab}</span>
        <span className="wt-map__score-eic">EIC {eic}</span>
      </div>
    </section>
  );
}

// ── Mission Log ───────────────────────────────────────────────────────────────
function MissionLog({ history }) {
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [history.length]);
  return (
    <section className="wt-plaque wt-log">
      <h2 className="wt-plaque__title">Battle Log</h2>
      <div className="wt-log__entries" ref={logRef}>
        {history.length===0 && <div className="wt-log__empty">No chapters fought yet.</div>}
        {history.map(entry => (
          <div key={entry.id} className={`wt-log__entry${entry.passed?' passed':''}${entry.outcome?' '+entry.outcome.toLowerCase()+'-win':''}`}>
            <div className="wt-log__entry-header">
              <span className="wt-log__chapter-badge">Chapter {entry.chapter}</span>
              <span className={`wt-log__verdict${entry.passed?' pass':' fail'}`}>{entry.passed?'Approved':'Rejected'}</span>
            </div>
            <div className="wt-log__line">Leader: <span>{entry.leaderName}</span></div>
            <div className="wt-log__line">Team: <span>{entry.team.join(', ')}</span></div>
            <div className="wt-log__line">Yes: {entry.yesVoters.map(n=><span key={n} className="yes">{n} </span>)}</div>
            <div className="wt-log__line">No: {entry.noVoters.map(n=><span key={n} className="no">{n} </span>)}</div>
            {entry.outcome && <div className={`wt-log__outcome ${entry.outcome.toLowerCase()}`}>{entry.outcome==='NAWAB'?'Nawab Victory':'EIC Sabotage'}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Intelligence (only for roles that see someone) ────────────────────────────
function IntelPanel({ myIntel, players }) {
  const nameOf = id => players.find(p=>p.id===id)?.name;
  const redNames    = (myIntel?.redPlayerIds||[]).map(nameOf).filter(Boolean);
  const yellowNames = (myIntel?.yellowPlayerIds||[]).map(nameOf).filter(Boolean);
  if (!redNames.length && !yellowNames.length) return null;
  return (
    <section className="wt-plaque wt-intel-panel">
      <h2 className="wt-plaque__title">Your Intelligence</h2>
      {redNames.map(n => <div key={n} className="wt-intel-panel__item red">{n} — EIC traitor</div>)}
      {yellowNames.map(n => <div key={n} className="wt-intel-panel__item yellow">{n} — suspect</div>)}
    </section>
  );
}

// ── Screen layout ─────────────────────────────────────────────────────────────
// The room fills the whole screen; the panels float over it. On narrow screens (phones)
// the room sits on top and the panels follow underneath. The table always stays in the
// clear space between the panels (the insets handed to the room).
function useTentLayout() {
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return useMemo(() => {
    const stacked = vw < 900;
    const gutter = vw >= 1400 ? 24 : 16;
    const col = stacked ? 0 : Math.round(Math.min(330, Math.max(232, vw * 0.19)));
    const header = stacked ? 52 : 60;
    const dock = 112;
    const side = col + gutter * 2;
    return {
      stacked,
      vars: { '--wt-gutter': `${gutter}px`, '--wt-col': `${col}px`, '--wt-header': `${header}px` },
      insets: stacked
        ? { top: header, right: 8, bottom: 12, left: 8, keepTorches: false }
        : { top: header, right: side, bottom: dock, left: side, keepTorches: true },
      // the reveal (the assassination): no side columns, so the room takes the width, and
      // the assassination panel sits at the bottom.
      revealInsets: stacked
        ? { top: header, right: 8, bottom: 12, left: 8, keepTorches: false }
        : { top: header, right: gutter * 2, bottom: 190, left: gutter * 2, keepTorches: false },
    };
  }, [vw]);
}

// ── Player Table — real 3D scene (Three.js), automatic 2D fallback ──────────
// Rendered once by WarTent and kept on screen through every phase, so the room
// never reloads or flashes when the game moves from proposal to vote to clash.
function PlayerTable(props) {
  return <WarTable3D {...props} />;
}

// ── Proposal ──────────────────────────────────────────────────────────────────
function ProposalActions({ players, myId, gameState, requiredSize, selected }) {
  const socket = useGameStore(s=>s.socket);
  const leader   = players[gameState.leaderIndex];
  const isLeader = leader?.id === myId;
  const handlePropose = () => { if (selected.length===requiredSize) socket.emit('propose_team',{teamIds:selected}); };

  if (!isLeader) return (
    <div className="wt-action">
      <p className="wt-vote__waiting animate-flicker">Waiting for {leader?.name} to choose the team&hellip;</p>
    </div>
  );
  return (
    <>
      <div className="wt-action">
        <div className="wt-propose">
          <span className="wt-propose__count">Selected: <strong>{selected.length} / {requiredSize}</strong></span>
          <button className="btn btn-primary" onClick={handlePropose} disabled={selected.length!==requiredSize}>
            ⚔ Propose Team
          </button>
        </div>
      </div>
    </>
  );
}

// ── Vote ──────────────────────────────────────────────────────────────────────
// The proposed team arrives as a letter; the player seals it with the green seal (approve)
// or the red one (reject). The vote is sent when the seal strikes the letter.
const MAX_PROPOSALS = 5;   // the server's MAX_REJECTION_COUNT: the fifth refusal hands the game to the Company
function VoteActions({ players, myId, gameState, insets, stacked }) {
  const socket = useGameStore(s=>s.socket);
  const [myVote, setMyVote] = useState(null);
  const [sealDone, setSealDone] = useState(false);   // the letter has finished its sealing and gone
  const [peek, setPeek] = useState(false);           // the letter is put aside to look at the table
  const { teamProposal, votes, votesRevealed, leaderIndex, chapter, rejectionCount } = gameState;
  const me = players.find(p=>p.id===myId);
  const castVote = v => {
    if (me?.hasVoted||myVote) return;
    setMyVote(v);
    socket.emit('cast_vote',{vote:v});
    playSound(v==='YES'?SOUNDS.VOTE_YES:SOUNDS.VOTE_NO);
  };
  const letter = useMemo(() => ({
    leaderName: players[leaderIndex]?.name || '?',
    teamNames: (teamProposal||[]).map(id => players.find(p=>p.id===id)?.name || '?'),
    chapter, proposalNo: (rejectionCount||0) + 1, maxProposals: MAX_PROPOSALS,
  }), [players, leaderIndex, teamProposal, chapter, rejectionCount]);
  // open until I have voted; once I seal it here, it stays until its own animation is over
  const showSeal = myVote ? !sealDone : (!me?.hasVoted && !votesRevealed);
  useEffect(() => {
    if (votesRevealed && votes) {
      const y = Object.values(votes).filter(v=>v==='YES').length;
      const n = Object.values(votes).filter(v=>v==='NO').length;
      playSound(y>n?SOUNDS.VOTE_PASS:SOUNDS.VOTE_FAIL);
    }
  }, [votesRevealed]);
  const yesCount = votes?Object.values(votes).filter(v=>v==='YES').length:0;
  const noCount  = votes?Object.values(votes).filter(v=>v==='NO').length:0;
  return (
    <>
      <div className="wt-action">
        {votesRevealed ? (
          <div className="wt-vote-results">
            <div className={`wt-vote-results__verdict${yesCount>noCount?' pass':' fail'}`}>
              {yesCount>noCount?'⚔ Team Approved':'✗ Team Rejected'}
            </div>
            <div className="wt-vote-results__breakdown">
              <span className="wt-vote-results__yes">✓ Yes: {yesCount}</span>
              <span className="wt-vote-results__no">✗ No: {noCount}</span>
            </div>
            {votes && (
              <div className="wt-vote-tally">
                {Object.entries(votes).map(([id,v]) => {
                  const name = players.find(p=>p.id===id)?.name||'?';
                  return <div key={id} className={`wt-vote-tally__item ${v.toLowerCase()}`}>{v==='YES'?'✓':'✗'} {name}</div>;
                })}
              </div>
            )}
          </div>
        ) : me?.hasVoted||myVote ? (
          <p className="wt-vote__waiting animate-flicker">
            Vote cast — waiting for others&hellip; ({players.filter(p=>p.hasVoted).length} / {players.length})
          </p>
        ) : peek ? (
          <button className="btn btn-primary wt-vote__return" onClick={()=>setPeek(false)}>Return to the letter</button>
        ) : null}
      </div>
      {showSeal && (
        <SealVote letter={letter} onVote={castVote} onClosed={()=>setSealDone(true)}
          insets={insets} stacked={stacked} hidden={peek} onPeek={()=>setPeek(true)} />
      )}
    </>
  );
}

// ── Mission Clash ─────────────────────────────────────────────────────────────
function MissionClashActions({ players, myId, gameState, needsTwo }) {
  const socket = useGameStore(s=>s.socket);
  const [card, setCard] = useState(null);
  const { teamProposal, myRoleInfo } = gameState;
  const isOnTeam  = teamProposal.includes(myId);
  const isEIC     = myRoleInfo?.faction==='EIC';
  const me        = players.find(p=>p.id===myId);
  const submitted = me?.missionCardSubmitted;
  const submitCard = c => { if (card||submitted) return; setCard(c); socket.emit('submit_mission_card',{card:c}); };
  const waiting   = teamProposal.length - players.filter(p=>teamProposal.includes(p.id)&&p.missionCardSubmitted).length;
  return (
    <>
      <div className="wt-action">
        {!isOnTeam ? (
          <p className="wt-mission__waiting animate-flicker">
            Battle underway &mdash; {waiting} card{waiting !== 1 ? 's' : ''} remaining
          </p>
        ) : submitted || card ? (
          <p className="wt-mission__waiting animate-flicker">Card submitted — waiting&hellip; ({waiting} remaining)</p>
        ) : null}
      </div>
      {/* Battle card overlay — full screen, outside action bar */}
      {isOnTeam && !submitted && !card && (
        <BattleCardOverlay
          isEIC={isEIC}
          onSubmit={submitCard}
          submitted={submitted || !!card}
          needsTwo={needsTwo}
        />
      )}
    </>
  );
}

// ── Round Result ──────────────────────────────────────────────────────────────
function RoundResultView({ gameState, players, myId }) {
  const { missionResults, teamProposal } = gameState;
  useEffect(() => {
    if (missionResults) playSound(missionResults.nawabWon?SOUNDS.MISSION_SUCCESS:SOUNDS.MISSION_FAIL,{volume:0.8});
  }, [missionResults?.nawabWon]);
  if (!missionResults) return null;
  const { betrayalCount, nawabWon } = missionResults;
  return (
    <>
      <div className="wt-action">
        <div className="wt-result">
          <div className={`wt-result__verdict${nawabWon?' nawab':' eic'}`}>
            {nawabWon?'Chapter Secured':'Chapter Sabotaged'}
          </div>
          <div className="wt-result__betrayals">
            {betrayalCount===0?"No betrayals — the Nawab's army stood firm.":`${betrayalCount} betrayal card${betrayalCount>1?'s':''} revealed.`}
          </div>
        </div>
      </div>
    </>
  );
}

// ── The reveal: the room stays on screen ─────────────────────────────────────
// Assassination: the traitors stand revealed (red statues, their characters under their
// names) and Mir Jafar marks his target by clicking a statue of the Nawab's side.
function AssassinationPanel({ gameState, mark, onStrike }) {
  const { players, myRoleInfo } = gameState;
  const isAssassin = myRoleInfo?.role === 'MIR_JAFAR';
  const markName = players.find(p => p.id === mark)?.name;
  useEffect(() => { playSound(SOUNDS.ASSASSINATION, { volume: 0.8 }); }, []);
  const line = isAssassin ? 'Three chapters lost. One knife left. Find Mir Modon.'
    : myRoleInfo?.faction === 'EIC' ? 'Your masks are off. Mir Jafar is hunting now. Wait for him.'
    : myRoleInfo?.role === 'MIR_MODON' ? 'Hold your breath. They are hunting you.'
    : 'The traitors stand revealed. Now they hunt Mir Modon.';
  return (
    <div className="wt-action wt-reveal">
      <h2 className="wt-reveal__title">The Assassination</h2>
      <p className="wt-reveal__line">{line}</p>
      {isAssassin ? (
        <div className="wt-reveal__strike">
          <span className="wt-reveal__mark">
            {markName ? <>Your mark: <strong>{markName}</strong></> : 'Click a statue to mark your target.'}
          </span>
          <button className="btn btn-danger" disabled={!mark} onClick={onStrike}>Strike</button>
        </div>
      ) : (
        <p className="wt-reveal__waiting animate-flicker">Mir Jafar is choosing&hellip;</p>
      )}
    </div>
  );
}

// ── Game Over ─────────────────────────────────────────────────────────────────
// Full screen, as it was before 15 Oct (Zarif's choice): your team's name, Victory or Defeat,
// his closing lines, every player's role, Play Again. Victory is always green and Defeat always
// red (the background tint too), whichever team you were on.
function GameOverScreen({ gameState }) {
  const { winner, players } = gameState;
  // faction comes from myRoleInfo (always present), not public player list (faction stripped)
  const myFaction = gameState.myRoleInfo?.faction;
  const iWon = (winner === 'NAWAB' && myFaction === 'NAWAB') || (winner === 'EIC' && myFaction === 'EIC');
  const isNawab = winner==='NAWAB';                       // which side won (for the sound)
  // the word above Victory / Defeat is always the player's own team (in its colour)
  const mine = (myFaction || winner) === 'EIC' ? 'eic' : 'nawab';
  // the result's colour, whatever the team (Zarif's rule): Victory is green, Defeat is red
  const tone = iWon ? 'nawab' : 'eic';

  // Pick cinematic text once on mount
  const segments = useMemo(() => {
    const key = getEndgameKey(winner, myFaction);
    return key ? pickVariant(key) : [];
  }, [winner, myFaction]);

  useEffect(() => {
    playSound(isNawab?SOUNDS.NAWAB_WINS:SOUNDS.EIC_WINS,{volume:0.9});
  }, []);

  return (
    <div className={`game-over ${tone}`}>
      {/* Your team */}
      <p className={`game-over__faction ${mine}`}>
        {mine==='nawab'?'Nawab':'EIC'}
      </p>

      {/* Big title: your team's result */}
      <h1 className={`game-over__title ${tone}`}>
        {iWon?'Victory':'Defeat'}
      </h1>

      {/* Cinematic text — segments reveal one by one */}
      <div className="game-over__cinematic">
        <CinematicText segments={segments} />
      </div>

      {/* Role reveal */}
      <div className="game-over__roles">
        {players.map(p => (
          <div key={p.id} className="game-over__player-card">
            <div className="game-over__player-name">{p.name}</div>
            {p.roleMeta && (
              <div className={`game-over__player-role${p.faction?' '+p.faction.toLowerCase():''}`}>
                {p.roleMeta.displayName}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={()=>window.location.reload()}
        style={{padding:'16px 56px',fontSize:'1rem',letterSpacing:'0.2em',marginTop:'var(--space-xl)'}}>
        Play Again
      </button>
    </div>
  );
}

// ── Main WarTent ──────────────────────────────────────────────────────────────
export default function WarTent({ gameState }) {
  const myId = useGameStore(s=>s.myId);
  const socket = useGameStore(s=>s.socket);
  const [showSettings, setShowSettings] = useState(false);
  const layout = useTentLayout();
  const { phase, chapter, leaderIndex, rejectionCount, chapterScores,
          missionHistory, players, teamProposal, myRoleInfo, myIntel,
          votes, votesRevealed } = gameState;
  const leader      = players[leaderIndex];
  const isLeader    = leader?.id === myId;
  const requiredSize = TEAM_SIZES[players.length]?.[chapter]||2;

  // The music drops to a quiet 5% once the war tent opens (unless the player set the level)
  useEffect(() => { setMusicScene('quiet'); return () => setMusicScene('full'); }, []);

  // The leader's picks while proposing a team. Kept here (not in ProposalActions) so the
  // table can stay mounted through every phase. They belong to one proposal, so a new
  // proposal (new phase, leader or chapter) starts with nobody picked.
  const proposalKey = `${phase}|${leaderIndex}|${chapter}`;
  const [picks, setPicks] = useState({ key: proposalKey, ids: [] });
  const selected = picks.key === proposalKey ? picks.ids : [];
  const proposing = phase==='TEAM_PROPOSAL' && isLeader;
  const toggleSelect = id => {
    if (!proposing) return;
    setPicks(prev => {
      const cur = prev.key === proposalKey ? prev.ids : [];
      const ids = cur.includes(id) ? cur.filter(x=>x!==id) : cur.length<requiredSize ? [...cur,id] : cur;
      return { key: proposalKey, ids };
    });
  };

  // ── The reveal (the assassination): the room stays, the traitors light up red ──
  const reveal = phase === 'ASSASSINATION';
  const isAssassin = phase === 'ASSASSINATION' && myRoleInfo?.role === 'MIR_JAFAR';
  const [mark, setMark] = useState(null);                  // Mir Jafar's chosen target
  const markable = isAssassin ? players.filter(p => p.id !== myId && p.faction !== 'EIC').map(p => p.id) : [];
  const toggleMark = id => { if (markable.includes(id)) setMark(m => (m === id ? null : id)); };
  const strike = () => { if (mark) socket.emit('assassinate', { targetId: mark }); };
  const revealedEic = players.filter(p => p.faction === 'EIC').map(p => p.id);
  const shownIntel = reveal ? {
    redPlayerIds: [...new Set([...(myIntel?.redPlayerIds || []), ...revealedEic])],
    yellowPlayerIds: (myIntel?.yellowPlayerIds || []).filter(id => !revealedEic.includes(id)),
  } : myIntel;

  // ── The battle underway (the rain at Palashi): full screen for whoever is waiting while the
  // team plays its cards. When the last card is in, the field falls silent for a breath (the
  // overlay stays in its ending), and only then does the result appear.
  const team = teamProposal || [];
  const me = players.find(p => p.id === myId);
  const played = players.filter(p => team.includes(p.id) && p.missionCardSubmitted).length;
  const waitingInClash = phase === 'MISSION_CLASH' && (!team.includes(myId) || !!me?.missionCardSubmitted);
  // (worked out during the render, so the overlay never disappears for a frame in between)
  const [battleEnding, setBattleEnding] = useState(false);
  const [lastPhase, setLastPhase] = useState(phase);
  if (lastPhase !== phase) {
    setLastPhase(phase);
    if (lastPhase === 'MISSION_CLASH' && phase === 'ROUND_RESULT') setBattleEnding(true);
  }
  useEffect(() => {
    if (!battleEnding) return undefined;
    const t = setTimeout(() => setBattleEnding(false), 1900);
    return () => clearTimeout(t);
  }, [battleEnding]);

  // Chapter 4 with 7 or more players needs two Betray cards to fall (the server's
  // REQUIRES_TWO_BETRAYALS): a small notice for everyone when the chapter begins.
  const needsTwo = players.length >= 7 && chapter === 4;
  const [ch4Seen, setCh4Seen] = useState(false);
  const showCh4 = needsTwo && phase === 'TEAM_PROPOSAL' && !ch4Seen;
  useEffect(() => {
    if (!showCh4) return undefined;
    const t = setTimeout(() => setCh4Seen(true), 7000);
    return () => clearTimeout(t);
  }, [showCh4]);

  // The end has its own full screen (after every hook above, so the hooks always run in the same order)
  if (phase==='GAME_OVER') return <GameOverScreen gameState={gameState} />;

  const renderMain = () => {
    if (phase==='ASSASSINATION') return <AssassinationPanel gameState={gameState} mark={mark} onStrike={strike} />;
    if (phase==='TEAM_PROPOSAL') return <ProposalActions players={players} myId={myId} gameState={gameState} requiredSize={requiredSize} selected={selected} />;
    if (phase==='TEAM_VOTE')     return <VoteActions players={players} myId={myId} gameState={gameState} insets={layout.insets} stacked={layout.stacked} />;
    if (phase==='MISSION_CLASH') return <MissionClashActions players={players} myId={myId} gameState={gameState} needsTwo={needsTwo} />;
    if (phase==='ROUND_RESULT')  return battleEnding ? null : <RoundResultView gameState={gameState} players={players} myId={myId} />;
    return null;
  };

  return (
    <div className={`war-tent${layout.stacked ? ' war-tent--stacked' : ''}${reveal ? ' war-tent--reveal' : ''}`} style={layout.vars}>
      {/* the painted room fills the screen; everything else floats over it */}
      <div className="wt-stage">
        <PlayerTable players={players} myId={myId} myIntel={shownIntel} phase={phase}
          teamProposal={reveal ? [] : (teamProposal || [])}
          selectedIds={proposing ? selected : isAssassin && mark ? [mark] : []}
          onToggleSelect={proposing ? toggleSelect : isAssassin ? toggleMark : undefined}
          selectableIds={isAssassin ? markable : undefined}
          votes={phase==='TEAM_VOTE' ? votes : null}
          votesRevealed={phase==='TEAM_VOTE' ? !!votesRevealed : false}
          insets={reveal ? layout.revealInsets : layout.insets} />
      </div>

      <header className="wt-header">
        <span className="wt-header__brand"><span className="wt-header__swords">&#9876;</span> Polashi</span>
        <div className="wt-header__chapter" aria-label={`Chapter ${chapter} of 5`}>
          <span className="wt-header__chapter-label">Chapter</span>
          <span className="wt-header__chapter-value">{CHAPTER_ICONS[chapter-1] || chapter}</span>
          <span className="wt-header__chapter-of">of V</span>
        </div>
        <button className="settings-btn wt-header__settings" onClick={()=>setShowSettings(true)} title="Audio Settings">&#9881;</button>
      </header>
      {showSettings && <SettingsPanel onClose={()=>setShowSettings(false)} />}
      {showCh4 && (
        <button type="button" className="wt-notice" onClick={() => setCh4Seen(true)} aria-live="polite">
          <span className="wt-notice__title">Chapter IV</span>
          <span className="wt-notice__text">One Betray card is not enough this time. It takes two.</span>
        </button>
      )}
      {(waitingInClash || battleEnding) && (
        <BattleUnderway played={battleEnding ? team.length : played} total={team.length} ending={battleEnding} needsTwo={needsTwo} />
      )}

      <div className="wt-dock">{renderMain()}</div>

      {!reveal && (
        <aside className="wt-col wt-col--left">
          <PuzzleMap chapterScores={chapterScores} currentChapter={chapter} />
          <MissionLog history={missionHistory} />
        </aside>
      )}
      {!reveal && (
        <aside className="wt-col wt-col--right">
          {/* Intel only — no role card, player can see their role on the role reveal screen */}
          <IntelPanel myIntel={myIntel} players={players} />
        </aside>
      )}
    </div>
  );
}
