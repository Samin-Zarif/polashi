// POLASHI - War Tent Phase 2 Main Game UI
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import SwordClash from '../components/SwordClash';
import '../components/SwordClash.css';
import { startBackgroundMusic } from '../hooks/useBgMusic';
import SettingsPanel from '../components/SettingsPanel';
import '../components/SettingsPanel.css';
import { AssetImage, BackgroundImage } from '../components/AssetImage';
import { IMAGES, SOUNDS } from '../assets/assetManifest';
import { useSound, playSound } from '../hooks/useSound';
import './WarTent.css';

const ROLE_ICONS = {
  MIR_MODON: 'S', MOHON_LAL: 'B', LOYAL_SOLDIER: 'L',
  MIR_JAFAR: 'A', GHASETI_BEGUM: 'D', RAY_DURLABH: 'H',
  OMICHAND: 'O', EIC_CONSPIRATOR: 'E',
};
const CHAPTER_ICONS = ['I', 'II', 'III', 'IV', 'V'];
const TEAM_SIZES = {
  5:[null,2,3,2,3,3], 6:[null,2,3,4,3,4], 7:[null,2,3,3,4,4],
  8:[null,3,4,4,5,5], 9:[null,3,4,4,5,5], 10:[null,3,4,4,5,5],
};

function PhaseBanner({ phase, leaderName, teamSize, rejectionCount, isLeader }) {
  const title = { TEAM_PROPOSAL:'Team Proposal', TEAM_VOTE:'Council Vote', MISSION_CLASH:'The Clash', ROUND_RESULT:'Chapter Result' }[phase] || phase;
  const icon  = { TEAM_PROPOSAL:'crown', TEAM_VOTE:'vote', MISSION_CLASH:'swords', ROUND_RESULT:'scroll' }[phase] || '';
  let desc = '';
  if (phase === 'TEAM_PROPOSAL') desc = isLeader ? `Choose ${teamSize} commanders for this chapter.` : `${leaderName} is choosing ${teamSize} commanders.`;
  if (phase === 'TEAM_VOTE') desc = 'All commanders must vote on the proposed team.';
  if (phase === 'MISSION_CLASH') desc = 'Approved commanders — submit your action card.';
  if (phase === 'ROUND_RESULT') desc = 'The battlefield speaks…';
  return (
    <div className="wt-phase-banner">
      <span className="wt-phase-banner__icon">{icon === 'crown' ? '♜' : icon === 'vote' ? '☐' : icon === 'swords' ? '⚔' : '⎙'}</span>
      <div className="wt-phase-banner__text">
        <div className="wt-phase-banner__title">{title}</div>
        <div className="wt-phase-banner__desc">{desc}</div>
      </div>
      {rejectionCount > 0 && <div className="wt-phase-banner__rejection">{rejectionCount} / 5 rejections</div>}
    </div>
  );
}

function PuzzleMap({ chapterScores, currentChapter }) {
  const nawab = chapterScores.filter(s => s === 'NAWAB').length;
  const eic   = chapterScores.filter(s => s === 'EIC').length;
  return (
    <div className="wt-map">
      <div className="wt-map__title">Palashi — Battle Map</div>
      <div className="wt-map__pieces">
        {chapterScores.map((score, i) => {
          const isCurrent = (i + 1) === currentChapter && !score;
          return (
            <div key={i} className={`wt-map__piece${score ? ' ' + score.toLowerCase() : ''}${isCurrent ? ' current' : ''}`}>
              <span className="wt-map__piece-num">Ch.{i+1}</span>
              <span className="wt-map__piece-icon">
                {score === 'NAWAB' ? '✅' : score === 'EIC' ? '❌' : CHAPTER_ICONS[i]}
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

function MissionLog({ history }) {
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [history.length]);
  return (
    <div className="wt-log">
      <div className="wt-log__title">Battle Log</div>
      <div className="wt-log__entries" ref={logRef}>
        {history.length === 0 && <div className="wt-log__empty">No chapters fought yet.</div>}
        {history.map(entry => (
          <div key={entry.id} className={`wt-log__entry${entry.passed ? ' passed' : ''}${entry.outcome ? ' ' + entry.outcome.toLowerCase() + '-win' : ''}`}>
            <div className="wt-log__entry-header">
              <span className="wt-log__chapter-badge">Chapter {entry.chapter}</span>
              <span className={`wt-log__verdict${entry.passed ? ' pass' : ' fail'}`}>{entry.passed ? '✓ Approved' : '✗ Rejected'}</span>
            </div>
            <div className="wt-log__line">Leader: <span>{entry.leaderName}</span></div>
            <div className="wt-log__line">Team: <span>{entry.team.join(', ')}</span></div>
            <div className="wt-log__line">Yes: {entry.yesVoters.map(n => <span key={n} className="yes">{n} </span>)}</div>
            <div className="wt-log__line">No: {entry.noVoters.map(n => <span key={n} className="no">{n} </span>)}</div>
            {entry.outcome && <div className={`wt-log__outcome ${entry.outcome.toLowerCase()}`}>{entry.outcome === 'NAWAB' ? 'Nawab Victory' : 'EIC Sabotage'}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerTable({ players, myId, myIntel, phase, teamProposal, selectedIds, onToggleSelect, votes, votesRevealed }) {
  const isProposal = phase === 'TEAM_PROPOSAL';
  const safeIntel = { redPlayerIds: myIntel?.redPlayerIds || [], yellowPlayerIds: myIntel?.yellowPlayerIds || [] };
  const getPos = (i, total) => {
    const a = (i / total) * 2 * Math.PI - Math.PI / 2;
    const r = 42;
    return { left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` };
  };
  return (
    <div className="wt-table-wrap">
      <div className="wt-table-title">Commanders at the Table</div>
      <div className="wt-table">
        {players.map((p, idx) => {
          const isMe       = p.id === myId;
          const isOnTeam   = teamProposal.includes(p.id);
          const isSelected = (selectedIds || []).includes(p.id);
          const isRed      = safeIntel.redPlayerIds.includes(p.id);
          const isYellow   = safeIntel.yellowPlayerIds.includes(p.id);
          const selectable = isProposal && !!onToggleSelect;
          const cls = ['wt-seat', isMe?'is-me':'', p.isLeader?'is-leader':'', isOnTeam?'is-on-team':'',
            isSelected?'is-selected':'', p.hasVoted?'has-voted':'', selectable?'selectable':'',
            isRed?'intel-red':isYellow?'intel-yellow':''].filter(Boolean).join(' ');
          return (
            <div key={p.id} className={cls} style={getPos(idx, players.length)} onClick={() => selectable && onToggleSelect(p.id)} role={selectable?'button':undefined}>
              {p.isLeader && <div className="wt-seat__leader-token">Leader</div>}
              <div className="wt-seat__avatar">
                {p.name.charAt(0).toUpperCase()}
                {(isOnTeam || isSelected) && <div className="wt-seat__checkmark">✓</div>}
              </div>
              <div className="wt-seat__name">{p.name}</div>
              {isMe && <div className="wt-seat__you-tag">(you)</div>}
              {p.roleMeta && <div className="wt-seat__you-tag">{p.roleMeta.displayName}</div>}
              {votesRevealed && votes && votes[p.id] && (
                <div className="wt-seat__voted-indicator" style={{ color: votes[p.id]==='YES'?'var(--nawab-bright)':'var(--eic-bright)' }}>
                  {votes[p.id] === 'YES' ? '✓ Yes' : '✗ No'}
                </div>
              )}
              {phase === 'TEAM_VOTE' && !votesRevealed && p.hasVoted && <div className="wt-seat__voted-indicator">Voted</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProposalActions({ players, myId, gameState, requiredSize }) {
  const socket = useGameStore(s => s.socket);
  const [selected, setSelected] = useState([]);
  useEffect(() => setSelected([]), [gameState.phase]);
  const leader   = players[gameState.leaderIndex];
  const isLeader = leader?.id === myId;

  const toggleSelect = id => {
    if (!isLeader) return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < requiredSize ? [...prev, id] : prev);
  };
  const handlePropose = () => { if (selected.length === requiredSize) socket.emit('propose_team', { teamIds: selected }); };

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
        teamProposal={gameState.teamProposal} selectedIds={selected} onToggleSelect={toggleSelect} votes={null} votesRevealed={false} />
      <div className="wt-action">
        <div className="wt-propose">
          <span className="wt-propose__count">Selected: <strong>{selected.length} / {requiredSize}</strong></span>
          <button className="btn btn-primary" onClick={handlePropose} disabled={selected.length !== requiredSize}>
            ⚔ Propose Team
          </button>
        </div>
      </div>
    </>
  );
}

function VoteActions({ players, myId, gameState }) {
  const socket = useGameStore(s => s.socket);
  const [myVote, setMyVote] = useState(null);
  const { teamProposal, votes, votesRevealed, phase } = gameState;
  const me = players.find(p => p.id === myId);
  const castVote = v => { if (me?.hasVoted || myVote) return; setMyVote(v); socket.emit('cast_vote', { vote: v }); playSound(v === 'YES' ? SOUNDS.VOTE_YES : SOUNDS.VOTE_NO); };
  useEffect(() => { if (votesRevealed && votes) { const y = Object.values(votes).filter(v => v === 'YES').length; const n = Object.values(votes).filter(v => v === 'NO').length; playSound(y > n ? SOUNDS.VOTE_PASS : SOUNDS.VOTE_FAIL); } }, [votesRevealed]);
  const yesCount = votes ? Object.values(votes).filter(v => v === 'YES').length : 0;
  const noCount  = votes ? Object.values(votes).filter(v => v === 'NO').length  : 0;
  return (
    <>
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase={phase}
        teamProposal={teamProposal} selectedIds={[]} votes={votes} votesRevealed={votesRevealed} />
      <div className="wt-action">
        {votesRevealed ? (
          <div className="wt-vote-results">
            <div className={`wt-vote-results__verdict${yesCount > noCount ? ' pass' : ' fail'}`}>
              {yesCount > noCount ? '⚔ Team Approved' : '✗ Team Rejected'}
            </div>
            <div className="wt-vote-results__breakdown">
              <span className="wt-vote-results__yes">✓ Yes: {yesCount}</span>
              <span className="wt-vote-results__no">✗ No: {noCount}</span>
            </div>
            {votes && (
              <div className="wt-vote-tally">
                {Object.entries(votes).map(([id, v]) => {
                  const name = players.find(p => p.id === id)?.name || '?';
                  return <div key={id} className={`wt-vote-tally__item ${v.toLowerCase()}`}>{v === 'YES' ? '✓' : '✗'} {name}</div>;
                })}
              </div>
            )}
          </div>
        ) : me?.hasVoted || myVote ? (
          <p className="wt-vote__waiting animate-flicker">
            Vote cast — waiting for others&hellip; ({players.filter(p => p.hasVoted).length} / {players.length})
          </p>
        ) : (
          <div className="wt-vote">
            <button className={`wt-vote__btn yes${myVote === 'YES' ? ' selected' : ''}`} onClick={() => castVote('YES')} disabled={!!myVote}>
              <span className="wt-vote__btn-icon">✓</span>Yes
            </button>
            <button className={`wt-vote__btn no${myVote === 'NO' ? ' selected' : ''}`} onClick={() => castVote('NO')} disabled={!!myVote}>
              <span className="wt-vote__btn-icon">✗</span>No
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function MissionClashActions({ players, myId, gameState }) {
  const socket = useGameStore(s => s.socket);
  const [card, setCard] = useState(null);
  const { teamProposal, myRoleInfo } = gameState;
  const isOnTeam  = teamProposal.includes(myId);
  const isEIC     = myRoleInfo?.faction === 'EIC';
  const me        = players.find(p => p.id === myId);
  const submitted = me?.missionCardSubmitted;
  const submitCard = c => { if (card || submitted) return; setCard(c); socket.emit('submit_mission_card', { card: c }); };
  const waiting   = teamProposal.length - players.filter(p => teamProposal.includes(p.id) && p.missionCardSubmitted).length;
  return (
    <>
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase="MISSION_CLASH"
        teamProposal={teamProposal} selectedIds={[]} votes={null} votesRevealed={false} />
      <div className="wt-action">
        {!isOnTeam ? (
          <div className="wt-clash">
            <div className="wt-clash__swords">
              <span className="wt-clash__sword-left">⚔</span>
              <span className="wt-clash__spark">✨</span>
              <span className="wt-clash__sword-right">⚔</span>
            </div>
            <p className="wt-clash__label animate-flicker">Battle underway&hellip; {waiting} card{waiting !== 1 ? 's' : ''} remaining</p>
          </div>
        ) : submitted || card ? (
          <p className="wt-mission__waiting animate-flicker">Card submitted — waiting&hellip; ({waiting} remaining)</p>
        ) : (
          <div className="wt-mission">
            <p className="wt-mission__prompt">Choose your action, commander</p>
            <div className="wt-mission__cards">
              <button className={`wt-mission__card loyal${card === 'LOYAL' ? ' selected' : ''}`} onClick={() => submitCard('LOYAL')}>
                <span className="wt-mission__card-icon">⚔</span>Loyal
              </button>
              {isEIC && (
                <button className={`wt-mission__card betrayal${card === 'BETRAYAL' ? ' selected' : ''}`} onClick={() => submitCard('BETRAYAL')}>
                  <span className="wt-mission__card-icon">🗡</span>Betrayal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function RoundResultView({ gameState, players, myId }) {
  const { missionResults, teamProposal } = gameState;
  const { play } = useSound();
  useEffect(() => { if (missionResults) { playSound(missionResults.nawabWon ? SOUNDS.MISSION_SUCCESS : SOUNDS.MISSION_FAIL, { volume: 0.8 }); } }, [missionResults?.nawabWon]);
  if (!missionResults) return null;
  const { betrayalCount, nawabWon } = missionResults;
  return (
    <>
      <PlayerTable players={players} myId={myId} myIntel={gameState.myIntel} phase="ROUND_RESULT"
        teamProposal={teamProposal} selectedIds={[]} votes={null} votesRevealed={false} />
      <div className="wt-action">
        <div className="wt-result">
          <div className={`wt-result__verdict${nawabWon ? ' nawab' : ' eic'}`}>
            {nawabWon ? 'Chapter Secured' : 'Chapter Sabotaged'}
          </div>
          <div className="wt-result__betrayals">
            {betrayalCount === 0 ? "No betrayals — the Nawab's army stood firm." : `${betrayalCount} betrayal card${betrayalCount > 1 ? 's' : ''} revealed.`}
          </div>
        </div>
      </div>
    </>
  );
}

function AssassinationPhase({ gameState }) {
  const socket = useGameStore(s => s.socket);
  const myId   = useGameStore(s => s.myId);
  const { players, myRoleInfo } = gameState;
  const [selected, setSelected] = useState(null);
  const { play } = useSound();
  useEffect(() => { playSound(SOUNDS.ASSASSINATION, { volume: 0.8 }); }, []);
  const isAssassin = myRoleInfo?.role === 'MIR_JAFAR';
  const targets    = players.filter(p => p.id !== myId);
  const handleAssassinate = () => { if (selected) socket.emit('assassinate', { targetId: selected }); };
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
              <div key={p.id} className={`assassination__target${selected === p.id ? ' selected' : ''}`} onClick={() => setSelected(p.id)}>
                <div className="assassination__target-avatar">{p.name.charAt(0).toUpperCase()}</div>
                {p.name}
              </div>
            ))}
          </div>
          <button className="btn btn-danger" onClick={handleAssassinate} disabled={!selected} style={{ padding: '14px 48px' }}>
            Assassinate
          </button>
        </>
      ) : (
        <p className="assassination__waiting animate-flicker">Mir Jafar is choosing their target&hellip;</p>
      )}
    </div>
  );
}

function GameOverScreen({ gameState }) {
  const { winner, players, assassinationTarget, chapterScores } = gameState;
  const { play } = useSound();
  useEffect(() => { playSound(isNawab ? SOUNDS.NAWAB_WINS : SOUNDS.EIC_WINS, { volume: 0.9 }); }, []);
  const isNawab = winner === 'NAWAB';
  let reason = '';
  if (isNawab) reason = "The Nawab's loyal commanders secured 3 chapters and protected Mir Modon. Bengal stands!";
  else if ((chapterScores || []).filter(s => s === 'EIC').length >= 3) reason = "The EIC traitors sabotaged 3 chapters from within. The Nawab falls.";
  else if (assassinationTarget) {
    const t = players.find(p => p.id === assassinationTarget);
    reason = `Mir Jafar correctly identified and assassinated ${t?.name} — Mir Modon. History is rewritten.`;
  } else reason = "The EIC claimed victory.";
  return (
    <div className={`game-over${isNawab ? ' nawab' : ' eic'}`}>
      <p className={`game-over__faction${isNawab ? ' nawab' : ' eic'}`}>{isNawab ? 'Nawab Pokkho Wins' : 'EIC Pokkho Wins'}</p>
      <h1 className={`game-over__title${isNawab ? ' nawab' : ' eic'}`}>{isNawab ? 'Victory!' : 'Defeat'}</h1>
      <p className="game-over__reason">{reason}</p>
      <div className="game-over__roles">
        {players.map(p => (
          <div key={p.id} className="game-over__player-card">
            <div className="game-over__player-name">{p.name}</div>
            {p.roleMeta && <div className={`game-over__player-role${p.faction ? ' ' + p.faction.toLowerCase() : ''}`}>{p.roleMeta.displayName}</div>}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ padding: '14px 48px' }}>Play Again</button>
    </div>
  );
}

export default function WarTent({ gameState }) {
  const myId = useGameStore(s => s.myId);
  const [showSettings, setShowSettings] = useState(false);
  const { phase, chapter, leaderIndex, rejectionCount, chapterScores, missionHistory, players, teamProposal, myRoleInfo, myIntel, votes, votesRevealed } = gameState;
  const leader      = players[leaderIndex];
  const isLeader    = leader?.id === myId;
  const requiredSize = TEAM_SIZES[players.length]?.[chapter] || 2;

  if (phase === 'ASSASSINATION') return <AssassinationPhase gameState={gameState} />;
  if (phase === 'GAME_OVER')     return <GameOverScreen gameState={gameState} />;

  const renderMain = () => {
    if (phase === 'TEAM_PROPOSAL') return <ProposalActions players={players} myId={myId} gameState={gameState} requiredSize={requiredSize} />;
    if (phase === 'TEAM_VOTE')     return <VoteActions players={players} myId={myId} gameState={gameState} />;
    if (phase === 'MISSION_CLASH') return <MissionClashActions players={players} myId={myId} gameState={gameState} />;
    if (phase === 'ROUND_RESULT')  return <RoundResultView gameState={gameState} players={players} myId={myId} />;
    return null;
  };

  return (
    <div className="war-tent">
      {/* ASSET: War tent background — add /public/assets/images/war-tent-bg.jpg and it loads automatically */}
      <header className="wt-header">
        <span className="wt-header__brand">⚔ Polashi</span>
        <div className="wt-header__chapter">
          <span className="wt-header__chapter-label">Chapter</span>
          <span className="wt-header__chapter-value">{chapter} / 5</span>
        </div>
        {myRoleInfo && (
          <div className="wt-header__role-pin">
            <span className="wt-header__role-icon">{ROLE_ICONS[myRoleInfo.role] || '?'}</span>
            <div className="wt-header__role-text">
              <span className="wt-header__role-name">{myRoleInfo.roleMeta.displayName}</span>
              <span className={`wt-header__role-faction${myRoleInfo.faction === 'NAWAB' ? ' nawab' : ' eic'}`}>
                {myRoleInfo.faction === 'NAWAB' ? 'Nawab Pokkho' : 'EIC Pokkho'}
              </span>
            </div>
          </div>
        )}
        <button className="settings-btn" onClick={() => setShowSettings(true)} title="Audio Settings">&#9881;</button>
      </header>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <main className="wt-main">
        <PhaseBanner phase={phase} leaderName={leader?.name} teamSize={requiredSize} rejectionCount={rejectionCount} isLeader={isLeader} />
        {renderMain()}
      </main>
      <aside className="wt-sidebar">
        <PuzzleMap chapterScores={chapterScores} currentChapter={chapter} />
        <MissionLog history={missionHistory} />
      </aside>
    </div>
  );
}
