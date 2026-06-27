// POLASHI - War Tent Phase 2 Main Game UI
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import SwordClash from '../components/SwordClash';
import '../components/SwordClash.css';
import VoteOverlay from '../components/VoteOverlay';
import '../components/VoteOverlay.css';
import BattleCardOverlay from '../components/BattleCardOverlay';
import '../components/BattleCardOverlay.css';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import SettingsPanel from '../components/SettingsPanel';
import '../components/SettingsPanel.css';
import CinematicText from '../components/CinematicText';
import '../components/CinematicText.css';
import { AssetImage } from '../components/AssetImage';
import { IMAGES, SOUNDS } from '../assets/assetManifest';
import { useSound, playSound } from '../hooks/useSound';
import { pickVariant, getEndgameKey } from '../data/endgameText';
import './WarTent.css';

const ROLE_ICONS = {
  MIR_MODON:'S', MOHON_LAL:'B', LOYAL_SOLDIER:'L',
  MIR_JAFAR:'A', GHASETI_BEGUM:'D', RAY_DURLABH:'H',
  OMICHAND:'O', EIC_CONSPIRATOR:'E',
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
  if (phase==='ROUND_RESULT')  desc = 'The battlefield speaks\u2026';
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
    <div className="wt-map">
      <div className="wt-map__title">Palashi — Battle Map</div>
      <div className="wt-map__pieces">
        {chapterScores.map((score,i) => {
          const isCurrent = (i+1)===currentChapter && !score;
          return (
            <div key={i} className={`wt-map__piece${score?' '+score.toLowerCase():''}${isCurrent?' current':''}`}>
              <span className="wt-map__piece-num">Ch.{i+1}</span>
              <span className="wt-map__piece-icon">
                {score==='NAWAB'?'\u2705':score==='EIC'?'\u274C':CHAPTER_ICONS[i]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="wt-map__score">
        <span className="wt-map__score-nawab">Nawab: {nawab}</span>
        <span className="wt-map__score-eic">EIC: {eic}</span>
      </div>
    </div>
  );
}

// ── Mission Log ───────────────────────────────────────────────────────────────
function MissionLog({ history }) {
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [history.length]);
  return (
    <div className="wt-log">
      <div className="wt-log__title">Battle Log</div>
      <div className="wt-log__entries" ref={logRef}>
        {history.length===0 && <div className="wt-log__empty">No chapters fought yet.</div>}
        {history.map(entry => (
          <div key={entry.id} className={`wt-log__entry${entry.passed?' passed':''}${entry.outcome?' '+entry.outcome.toLowerCase()+'-win':''}`}>
            <div className="wt-log__entry-header">
              <span className="wt-log__chapter-badge">Chapter {entry.chapter}</span>
              <span className={`wt-log__verdict${entry.passed?' pass':' fail'}`}>{entry.passed?'\u2713 Approved':'\u2717 Rejected'}</span>
            </div>
            <div className="wt-log__line">Leader: <span>{entry.leaderName}</span></div>
            <div className="wt-log__line">Team: <span>{entry.team.join(', ')}</span></div>
            <div className="wt-log__line">Yes: {entry.yesVoters.map(n=><span key={n} className="yes">{n} </span>)}</div>
            <div className="wt-log__line">No: {entry.noVoters.map(n=><span key={n} className="no">{n} </span>)}</div>
            {entry.outcome && <div className={`wt-log__outcome ${entry.outcome.toLowerCase()}`}>{entry.outcome==='NAWAB'?'Nawab Victory':'EIC Sabotage'}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player Table (round or rectangular based on count) ────────────────────────
function PlayerTable({ players, myId, myIntel, phase, teamProposal, selectedIds, onToggleSelect, votes, votesRevealed }) {
  const isProposal = phase === 'TEAM_PROPOSAL';
  const safeIntel  = { redPlayerIds: myIntel?.redPlayerIds||[], yellowPlayerIds: myIntel?.yellowPlayerIds||[] };
  const isRound    = players.length < 6;

  const getCirclePos = (i, total) => {
    const a = (i/total)*2*Math.PI - Math.PI/2;
    const r = 42;
    return { left:`${50+r*Math.cos(a)}%`, top:`${50+r*Math.sin(a)}%` };
  };

  const renderSeat = (p, idx) => {
    const isMe       = p.id === myId;
    const isOnTeam   = teamProposal.includes(p.id);
    const isSelected = (selectedIds||[]).includes(p.id);
    const isRed      = safeIntel.redPlayerIds.includes(p.id);
    const isYellow   = safeIntel.yellowPlayerIds.includes(p.id);
    const selectable = isProposal && !!onToggleSelect;
    const cls = ['wt-seat',
      isMe?'is-me':'', p.isLeader?'is-leader':'',
      isOnTeam?'is-on-team':'', isSelected?'is-selected':'',
      p.hasVoted?'has-voted':'', selectable?'selectable':'',
      isRed?'intel-red':isYellow?'intel-yellow':'',
    ].filter(Boolean).join(' ');
    const style = isRound ? getCirclePos(idx, players.length) : {};
    return (
      <div key={p.id} className={cls} style={style}
        onClick={() => selectable && onToggleSelect(p.id)}
        role={selectable?'button':undefined}>
        {p.isLeader && <div className="wt-seat__leader-token">Leader</div>}
        <div className="wt-seat__avatar">
          {p.name.charAt(0).toUpperCase()}
          {(isOnTeam||isSelected) && <div className="wt-seat__checkmark">✓</div>}
        </div>
        <div className="wt-seat__name">{p.name}</div>
        {isMe && <div className="wt-seat__you-tag">(you)</div>}
        {p.roleMeta && <div className="wt-seat__you-tag">{p.roleMeta.displayName}</div>}
        {votesRevealed && votes && votes[p.id] && (
          <div className="wt-seat__voted-indicator"
            style={{color:votes[p.id]==='YES'?'var(--nawab-bright)':'var(--eic-bright)'}}>
            {votes[p.id]==='YES'?'✓ Yes':'✗ No'}
          </div>
        )}
        {phase==='TEAM_VOTE' && !votesRevealed && p.hasVoted && <div className="wt-seat__voted-indicator">Voted</div>}
      </div>
    );
  };

  const rectRows = () => {
    const topCount = Math.ceil(players.length / 2);
    const top    = players.slice(0, topCount);
    const bottom = players.slice(topCount);
    return (
      <>
        <div className="wt-rect-row">{top.map((p,i) => renderSeat(p,i))}</div>
        <div className="wt-rect-row">{bottom.map((p,i) => renderSeat(p,i+topCount))}</div>
      </>
    );
  };

  return (
    <div className="wt-table-wrap">
      <div className="wt-table-title">Commanders at the Table</div>
      <div className={`wt-table ${isRound ? 'wt-table--round' : 'wt-table--rect'}`}>
        {isRound ? players.map((p, idx) => renderSeat(p, idx)) : rectRows()}
        {isRound && <div className="wt-table__center-emblem">⚔</div>}
      </div>
    </div>
  );
}

// ── Proposal ──────────────────────────────────────────────────────────────────
function ProposalActions({ players, myId, gameState, requiredSize }) {
  const socket = useGameStore(s=>s.socket);
  const [selected, setSelected] = useState([]);
  useEffect(() => setSelected([]), [gameState.phase]);
  const leader   = players[gameState.leaderIndex];
  const isLeader = leader?.id === myId;
  const toggleSelect = id => {
    if (!isLeader) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : prev.length<requiredSize ? [...prev,id] : prev);
  };
  const handlePropose = () => { if (selected.length===requiredSize) socket.emit('propose_team',{teamIds:selected}); };

  if (!isLeader) return (
    <>
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase={gameState.phase}
        teamProposal={gameState.teamProposal} selectedIds={[]} votes={null} votesRevealed={false} />
      <div className="wt-action">
        <p className="wt-vote__waiting animate-flicker">Waiting for {leader?.name} to choose the team&hellip;</p>
      </div>
    </>
  );
  return (
    <>
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase={gameState.phase}
        teamProposal={gameState.teamProposal} selectedIds={selected} onToggleSelect={toggleSelect}
        votes={null} votesRevealed={false} />
      <div className="wt-action">
        <div className="wt-propose">
          <span className="wt-propose__count">Selected: <strong>{selected.length} / {requiredSize}</strong></span>
          <button className="btn btn-primary" onClick={handlePropose} disabled={selected.length!==requiredSize}>
            \u2694 Propose Team
          </button>
        </div>
      </div>
    </>
  );
}

// ── Vote ──────────────────────────────────────────────────────────────────────
function VoteActions({ players, myId, gameState }) {
  const socket = useGameStore(s=>s.socket);
  const [myVote, setMyVote] = useState(null);
  const { teamProposal, votes, votesRevealed, phase } = gameState;
  const me = players.find(p=>p.id===myId);
  const castVote = v => {
    if (me?.hasVoted||myVote) return;
    setMyVote(v);
    socket.emit('cast_vote',{vote:v});
    playSound(v==='YES'?SOUNDS.VOTE_YES:SOUNDS.VOTE_NO);
  };
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
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase={phase}
        teamProposal={teamProposal} selectedIds={[]} votes={votes} votesRevealed={votesRevealed} />
      <div className="wt-action">
        {votesRevealed ? (
          <div className="wt-vote-results">
            <div className={`wt-vote-results__verdict${yesCount>noCount?' pass':' fail'}`}>
              {yesCount>noCount?'\u2694 Team Approved':'\u2717 Team Rejected'}
            </div>
            <div className="wt-vote-results__breakdown">
              <span className="wt-vote-results__yes">\u2713 Yes: {yesCount}</span>
              <span className="wt-vote-results__no">\u2717 No: {noCount}</span>
            </div>
            {votes && (
              <div className="wt-vote-tally">
                {Object.entries(votes).map(([id,v]) => {
                  const name = players.find(p=>p.id===id)?.name||'?';
                  return <div key={id} className={`wt-vote-tally__item ${v.toLowerCase()}`}>{v==='YES'?'\u2713':'\u2717'} {name}</div>;
                })}
              </div>
            )}
          </div>
        ) : me?.hasVoted||myVote ? (
          <p className="wt-vote__waiting animate-flicker">
            Vote cast — waiting for others&hellip; ({players.filter(p=>p.hasVoted).length} / {players.length})
          </p>
        ) : (
          <div className="wt-vote">
            <button className={`wt-vote__btn yes${myVote==='YES'?' selected':''}`} onClick={()=>castVote('YES')} disabled={!!myVote}>
              <span className="wt-vote__btn-icon">\u2713</span>
              <span className="wt-vote__btn-label">Loyal to the Nawab</span>
            </button>
            <button className={`wt-vote__btn no${myVote==='NO'?' selected':''}`} onClick={()=>castVote('NO')} disabled={!!myVote}>
              <span className="wt-vote__btn-icon">\u2717</span>
              <span className="wt-vote__btn-label">Reject the Team</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Mission Clash ─────────────────────────────────────────────────────────────
function MissionClashActions({ players, myId, gameState }) {
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
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase="MISSION_CLASH"
        teamProposal={teamProposal} selectedIds={[]} votes={null} votesRevealed={false} />
      <div className="wt-action">
        {!isOnTeam ? (
          <SwordClash waiting={waiting} />
        ) : submitted || card ? (
          <p className="wt-mission__waiting animate-flicker">Card submitted — waiting&hellip; ({waiting} remaining)</p>
        ) : (
          <BattleCardOverlay
            isEIC={isEIC}
            onSubmit={submitCard}
            submitted={submitted || !!card}
          />
        )}
      </div>
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
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase="ROUND_RESULT"
        teamProposal={teamProposal} selectedIds={[]} votes={null} votesRevealed={false} />
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

// ── Assassination ─────────────────────────────────────────────────────────────
function AssassinationPhase({ gameState }) {
  const socket = useGameStore(s=>s.socket);
  const myId   = useGameStore(s=>s.myId);
  const { players, myRoleInfo } = gameState;
  const [selected, setSelected] = useState(null);
  useEffect(() => { playSound(SOUNDS.ASSASSINATION,{volume:0.8}); }, []);
  const isAssassin = myRoleInfo?.role==='MIR_JAFAR';
  const targets    = players.filter(p=>p.id!==myId);
  return (
    <div className="assassination">
      <p className="assassination__eyebrow">The Final Move</p>
      <h1 className="assassination__title">The Assassination</h1>
      <p className="assassination__desc">
        {isAssassin
          ? "The Nawab has won 3 chapters — but you have one last chance. Find Mir Modon and history changes forever."
          : "The EIC traitors are conferring. Mir Jafar is about to make his move. Stay calm."}
      </p>
      {isAssassin ? (
        <>
          <div className="assassination__targets">
            {targets.map(p => (
              <div key={p.id} className={`assassination__target${selected===p.id?' selected':''}`} onClick={()=>setSelected(p.id)}>
                <div className="assassination__target-avatar">{p.name.charAt(0).toUpperCase()}</div>
                {p.name}
              </div>
            ))}
          </div>
          <button className="btn btn-danger" onClick={()=>selected&&socket.emit('assassinate',{targetId:selected})}
            disabled={!selected} style={{padding:'16px 56px',fontSize:'1.05rem',letterSpacing:'0.15em'}}>
            Assassinate
          </button>
        </>
      ) : (
        <p className="assassination__waiting animate-flicker">Mir Jafar is choosing their target&hellip;</p>
      )}
    </div>
  );
}

// ── Game Over ─────────────────────────────────────────────────────────────────
function GameOverScreen({ gameState }) {
  const myId = useGameStore(s=>s.myId);
  const { winner, players } = gameState;
  // faction comes from myRoleInfo (always present), not public player list (faction stripped)
  const myFaction = gameState.myRoleInfo?.faction;
  const iWon = (winner === 'NAWAB' && myFaction === 'NAWAB') || (winner === 'EIC' && myFaction === 'EIC');
  const isNawab = winner==='NAWAB'; // used for colour/theme only

  // Pick cinematic text once on mount
  const segments = useMemo(() => {
    const key = getEndgameKey(winner, myFaction);
    return key ? pickVariant(key) : [];
  }, [winner, myFaction]);

  useEffect(() => {
    playSound(isNawab?SOUNDS.NAWAB_WINS:SOUNDS.EIC_WINS,{volume:0.9});
  }, []);

  return (
    <div className={`game-over${isNawab?' nawab':' eic'}`}>
      {/* Faction label */}
      <p className={`game-over__faction${isNawab?' nawab':' eic'}`}>
        {isNawab?'Nawab Pokkho':'EIC Pokkho'}
      </p>

      {/* Big title */}
      <h1 className={`game-over__title${isNawab?' nawab':' eic'}`}>
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
  const [showSettings, setShowSettings] = useState(false);
  const { phase, chapter, leaderIndex, rejectionCount, chapterScores,
          missionHistory, players, teamProposal, myRoleInfo, myIntel,
          votes, votesRevealed } = gameState;
  const leader      = players[leaderIndex];
  const isLeader    = leader?.id === myId;
  const requiredSize = TEAM_SIZES[players.length]?.[chapter]||2;

  if (phase==='ASSASSINATION') return <AssassinationPhase gameState={gameState} />;
  if (phase==='GAME_OVER')     return <GameOverScreen gameState={gameState} />;

  const renderMain = () => {
    if (phase==='TEAM_PROPOSAL') return <ProposalActions players={players} myId={myId} gameState={gameState} requiredSize={requiredSize} />;
    if (phase==='TEAM_VOTE')     return <VoteActions players={players} myId={myId} gameState={gameState} />;
    if (phase==='MISSION_CLASH') return <MissionClashActions players={players} myId={myId} gameState={gameState} />;
    if (phase==='ROUND_RESULT')  return <RoundResultView gameState={gameState} players={players} myId={myId} />;
    return null;
  };

  return (
    <div className="war-tent">
      <header className="wt-header">
        <span className="wt-header__brand">\u2694 Polashi</span>
        <div className="wt-header__chapter">
          <span className="wt-header__chapter-label">Chapter</span>
          <span className="wt-header__chapter-value">{chapter} / 5</span>
        </div>
        {myRoleInfo && (
          <div className="wt-header__role-pin">
            <span className="wt-header__role-icon">{ROLE_ICONS[myRoleInfo.role]||'?'}</span>
            <div className="wt-header__role-text">
              <span className="wt-header__role-name">{myRoleInfo.roleMeta.displayName}</span>
              <span className={`wt-header__role-faction${myRoleInfo.faction==='NAWAB'?' nawab':' eic'}`}>
                {myRoleInfo.faction==='NAWAB'?'Nawab Pokkho':'EIC Pokkho'}
              </span>
            </div>
          </div>
        )}
        <button className="settings-btn" onClick={()=>setShowSettings(true)} title="Audio Settings">&#9881;</button>
      </header>
      {showSettings && <SettingsPanel onClose={()=>setShowSettings(false)} />}
      <main className="wt-main">{renderMain()}</main>
      <aside className="wt-sidebar">
        {myRoleInfo && (() => {
          const { role, faction, roleMeta } = myRoleInfo;
          const isNawabRole = faction === 'NAWAB';
          const redNames    = myIntel?.redPlayerIds?.map(id => players.find(p=>p.id===id)?.name).filter(Boolean)||[];
          const yellowNames = myIntel?.yellowPlayerIds?.map(id => players.find(p=>p.id===id)?.name).filter(Boolean)||[];
          return (
            <div className="wt-my-role-card">
              <p className="wt-my-role-card__eyebrow">Your Role</p>
              <div className={`wt-my-role-card__faction ${isNawabRole?'nawab':'eic'}`}>
                {isNawabRole ? 'Nawab Pokkho' : 'EIC Pokkho'}
              </div>
              <div className="wt-my-role-card__icon">{ROLE_ICONS[role]||'?'}</div>
              <h3 className="wt-my-role-card__name">{roleMeta.displayName}</h3>
              <p className="wt-my-role-card__title">{roleMeta.title}</p>
              <p className="wt-my-role-card__desc">{roleMeta.description}</p>
              {(redNames.length > 0 || yellowNames.length > 0) && (
                <div className="wt-my-role-card__intel">
                  <p className="wt-my-role-card__intel-title">Your Intelligence</p>
                  {redNames.map(n => <div key={n} className="wt-my-role-card__intel-item red">• {n} — EIC Traitor</div>)}
                  {yellowNames.map(n => <div key={n} className="wt-my-role-card__intel-item yellow">◐ {n} — Suspect</div>)}
                </div>
              )}
            </div>
          );
        })()}
        <PuzzleMap chapterScores={chapterScores} currentChapter={chapter} />
        <MissionLog history={missionHistory} />
      </aside>
    </div>
  );
}
