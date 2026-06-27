// POLASHI — Vote Overlay
// Hijacks the screen with a cinematic vote panel

import { useState, useEffect } from 'react';
import { playSound } from '../hooks/useSound';
import { SOUNDS } from '../assets/assetManifest';
import './VoteOverlay.css';

export default function VoteOverlay({ onVote, hasVoted, myVote, players, votes, votesRevealed, teamProposal }) {
  const [animIn, setAnimIn] = useState(false);
  const [chosen, setChosen] = useState(null);

  useEffect(() => {
    // Animate in after mount
    const t = setTimeout(() => setAnimIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleVote = (v) => {
    if (hasVoted || chosen) return;
    setChosen(v);
    playSound(v === 'YES' ? SOUNDS.VOTE_YES : SOUNDS.VOTE_NO);
    onVote(v);
  };

  const yesCount = votes ? Object.values(votes).filter(v => v === 'YES').length : 0;
  const noCount  = votes ? Object.values(votes).filter(v => v === 'NO').length  : 0;
  const votedCount = players.filter(p => p.hasVoted).length;

  const teamNames = teamProposal.map(id => players.find(p => p.id === id)?.name).filter(Boolean);

  return (
    <div className={`vote-overlay ${animIn ? 'vote-overlay--in' : ''}`}>
      <div className="vote-overlay__backdrop" />

      <div className="vote-overlay__panel">
        {/* Corner ornaments */}
        <div className="vote-overlay__corner vote-overlay__corner--tl" />
        <div className="vote-overlay__corner vote-overlay__corner--tr" />
        <div className="vote-overlay__corner vote-overlay__corner--bl" />
        <div className="vote-overlay__corner vote-overlay__corner--br" />

        {!votesRevealed ? (
          <>
            <p className="vote-overlay__eyebrow">Council Vote</p>
            <h2 className="vote-overlay__title">Approve this team?</h2>

            <div className="vote-overlay__team">
              {teamNames.map(name => (
                <div key={name} className="vote-overlay__team-member">{name}</div>
              ))}
            </div>

            {hasVoted || chosen ? (
              <div className="vote-overlay__waiting">
                <div className={`vote-overlay__cast vote-overlay__cast--${(chosen||myVote||'').toLowerCase()}`}>
                  {chosen === 'YES' || myVote === 'YES' ? 'You voted Yes' : 'You voted No'}
                </div>
                <p className="vote-overlay__tally animate-flicker">
                  {votedCount} / {players.length} voted
                </p>
              </div>
            ) : (
              <div className="vote-overlay__buttons">
                <button
                  className="vote-overlay__btn vote-overlay__btn--yes"
                  onClick={() => handleVote('YES')}
                >
                  <div className="vote-overlay__btn-icon">
                    <svg viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="rgba(30,92,46,0.3)"/>
                      <path d="M11 20 L17 27 L29 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="vote-overlay__btn-label">Approve</span>
                  <span className="vote-overlay__btn-sub">Send the team</span>
                </button>

                <div className="vote-overlay__divider">or</div>

                <button
                  className="vote-overlay__btn vote-overlay__btn--no"
                  onClick={() => handleVote('NO')}
                >
                  <div className="vote-overlay__btn-icon">
                    <svg viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="rgba(139,26,26,0.3)"/>
                      <line x1="13" y1="13" x2="27" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      <line x1="27" y1="13" x2="13" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="vote-overlay__btn-label">Reject</span>
                  <span className="vote-overlay__btn-sub">Demand a new team</span>
                </button>
              </div>
            )}
          </>
        ) : (
          // Votes revealed
          <VoteResult yesCount={yesCount} noCount={noCount} votes={votes} players={players} />
        )}
      </div>
    </div>
  );
}

function VoteResult({ yesCount, noCount, votes, players }) {
  const passed = yesCount > noCount;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    playSound(passed ? SOUNDS.VOTE_PASS : SOUNDS.VOTE_FAIL);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`vote-result ${show ? 'vote-result--in' : ''}`}>
      <div className={`vote-result__verdict ${passed ? 'pass' : 'fail'}`}>
        {passed ? 'Team Approved' : 'Team Rejected'}
      </div>
      <div className="vote-result__counts">
        <span className="vote-result__yes">{yesCount} Yes</span>
        <span className="vote-result__sep">/</span>
        <span className="vote-result__no">{noCount} No</span>
      </div>
      <div className="vote-result__tally">
        {votes && Object.entries(votes).map(([id, v]) => {
          const name = players.find(p => p.id === id)?.name || '?';
          return (
            <div key={id} className={`vote-result__tally-item ${v.toLowerCase()}`}>
              {v === 'YES' ? '\u2713' : '\u2717'} {name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
