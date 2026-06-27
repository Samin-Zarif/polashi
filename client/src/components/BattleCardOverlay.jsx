// POLASHI — Battle Card Overlay
// Overlays the table, cards pop in from centre, hover + select animations

import { useState, useEffect } from 'react';
import { playSound } from '../hooks/useSound';
import { SOUNDS } from '../assets/assetManifest';
import './BattleCardOverlay.css';

export default function BattleCardOverlay({ isEIC, onSubmit, submitted }) {
  const [animIn, setAnimIn]   = useState(false);
  const [chosen, setChosen]   = useState(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handlePick = (card) => {
    if (chosen || submitted) return;
    setChosen(card);
    // Brief flip animation, then submit
    playSound(card === 'LOYAL' ? SOUNDS.VOTE_YES : SOUNDS.VOTE_NO, { volume: 0.9 });
    setTimeout(() => {
      setFlipped(true);
      setTimeout(() => onSubmit(card), 600);
    }, 200);
  };

  if (submitted) return null;

  return (
    <div className={`bc-overlay ${animIn ? 'bc-overlay--in' : ''}`}>
      <div className="bc-overlay__backdrop" />
      <div className="bc-overlay__panel">
        <p className="bc-overlay__eyebrow">The Clash</p>
        <h2 className="bc-overlay__title">Choose your action</h2>
        <p className="bc-overlay__sub">This choice is secret. Only the outcome will be revealed.</p>

        <div className="bc-overlay__cards">
          {/* Loyal card */}
          <div
            className={`bc-card bc-card--loyal ${chosen === 'LOYAL' ? 'bc-card--chosen' : ''} ${chosen && chosen !== 'LOYAL' ? 'bc-card--unchosen' : ''}`}
            onClick={() => handlePick('LOYAL')}
            role="button"
          >
            <div className="bc-card__inner">
              <div className="bc-card__front">
                <div className="bc-card__emblem">
                  <svg viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="36" stroke="#2ecc71" strokeWidth="2" fill="rgba(30,92,46,0.2)"/>
                    <circle cx="40" cy="40" r="28" stroke="#2ecc71" strokeWidth="1" strokeDasharray="4 3" fill="none"/>
                    {/* Sword pointing up */}
                    <rect x="38" y="10" width="4" height="40" rx="1" fill="#2ecc71"/>
                    <rect x="26" y="46" width="28" height="5" rx="2" fill="#27ae60"/>
                    <rect x="36" y="51" width="8" height="16" rx="2" fill="#1a6e3a"/>
                    <ellipse cx="40" cy="68" rx="5" ry="4" fill="#2ecc71"/>
                    {/* Glow line on blade */}
                    <line x1="40" y1="12" x2="40" y2="44" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="bc-card__name">Loyal</div>
                <div className="bc-card__faction">Serve the Nawab</div>
                <div className="bc-card__desc">Submit a loyal card. The chapter succeeds unless a traitor betrays it.</div>
              </div>
            </div>
            <div className="bc-card__hover-glow bc-card__hover-glow--loyal" />
          </div>

          {/* Betrayal card — EIC only */}
          {isEIC && (
            <div
              className={`bc-card bc-card--betrayal ${chosen === 'BETRAYAL' ? 'bc-card--chosen' : ''} ${chosen && chosen !== 'BETRAYAL' ? 'bc-card--unchosen' : ''}`}
              onClick={() => handlePick('BETRAYAL')}
              role="button"
            >
              <div className="bc-card__inner">
                <div className="bc-card__front">
                  <div className="bc-card__emblem">
                    <svg viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="36" stroke="#e74c3c" strokeWidth="2" fill="rgba(139,26,26,0.2)"/>
                      <circle cx="40" cy="40" r="28" stroke="#e74c3c" strokeWidth="1" strokeDasharray="4 3" fill="none"/>
                      {/* Dagger pointing down */}
                      <rect x="38" y="14" width="4" height="38" rx="1" fill="#e74c3c" transform="rotate(180 40 40)"/>
                      <rect x="26" y="29" width="28" height="5" rx="2" fill="#c0392b"/>
                      <rect x="36" y="13" width="8" height="16" rx="2" fill="#7a1a1a"/>
                      <ellipse cx="40" cy="12" rx="5" ry="4" fill="#e74c3c"/>
                      <line x1="40" y1="68" x2="40" y2="36" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      {/* Drop of blood */}
                      <ellipse cx="40" cy="72" rx="2.5" ry="3.5" fill="#e74c3c" opacity="0.7"/>
                    </svg>
                  </div>
                  <div className="bc-card__name">Betray</div>
                  <div className="bc-card__faction">Serve the Company</div>
                  <div className="bc-card__desc">Submit a betrayal card. The chapter fails, regardless of others.</div>
                </div>
              </div>
              <div className="bc-card__hover-glow bc-card__hover-glow--betrayal" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
