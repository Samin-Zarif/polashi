// POLASHI — Battle Card Overlay
// The secret choice in the clash. Each card is a dark lacquered card with a fine gold frame
// and a round painted medallion (after the round Ganjifa playing cards of Mughal Bengal):
// an Indian talwar for the Nawab, a British flintlock pistol for betrayal.
import { useState, useEffect } from 'react';
import { playSound } from '../hooks/useSound';
import { SOUNDS } from '../assets/assetManifest';
import './BattleCardOverlay.css';

// Loyal: a traditional Indian talwar, nearly upright: disc pommel with its dome and knob, a grip
// that swells in the middle, knobbed cross-guard with a langet, a knuckle-guard, and a curved
// single-edged blade that widens a little before its point. In gold leaf.
function LoyalEmblem() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bc-talwar" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#e2c98f" stopOpacity="0.38" />
          <stop offset="1" stopColor="#e2c98f" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* scaled to fill the medallion, centred */}
      <g transform="matrix(1.08 0 0 1.08 -2.49 -4.11)">
        {/* blade: curved, single-edged, swelling a little before the point */}
        <path d="M37.08 61.95 L37.36 60.99 L37.68 60.04 L38.02 59.10 L38.38 58.17 L38.75 57.24 L39.11 56.32 L39.45 55.39 L39.78 54.46 L40.10 53.53 L40.43 52.60 L40.77 51.68 L41.11 50.76 L41.46 49.85 L41.82 48.94 L42.19 48.03 L42.56 47.13 L42.94 46.24 L43.33 45.35 L43.73 44.46 L44.14 43.58 L44.55 42.70 L44.97 41.82 L45.39 40.95 L45.83 40.09 L46.27 39.23 L46.72 38.37 L47.18 37.52 L47.64 36.67 L48.12 35.83 L48.60 34.99 L49.09 34.15 L49.58 33.33 L50.09 32.50 L50.60 31.68 L51.12 30.87 L51.65 30.06 L52.18 29.25 L52.73 28.45 L53.28 27.65 L53.82 26.85 L54.36 26.04 L54.91 25.24 L55.45 24.43 L56.00 23.63 L56.55 22.82 L57.12 22.02 L57.69 21.23 L58.28 20.45 L58.88 19.67 L59.50 18.91 L60.13 18.15 L60.81 17.44 L61.54 16.77 L62.30 16.13 L63.06 15.49 L63.80 14.82 L64.72 14.34 L65.76 13.98 L66.79 13.62 L67.83 13.28 L68.87 12.94 L69.91 12.62 L70.96 12.30 L72.00 12.00 L72.00 12.00 L71.52 12.91 L71.06 13.83 L70.60 14.75 L70.16 15.66 L69.73 16.58 L69.31 17.49 L68.91 18.41 L68.43 19.25 L67.83 19.96 L67.26 20.70 L66.71 21.45 L66.15 22.19 L65.55 22.89 L64.94 23.58 L64.33 24.27 L63.73 24.96 L63.12 25.65 L62.52 26.34 L61.92 27.03 L61.33 27.73 L60.75 28.43 L60.17 29.14 L59.61 29.86 L59.06 30.58 L58.52 31.32 L58.00 32.07 L57.49 32.82 L56.99 33.58 L56.49 34.34 L56.00 35.10 L55.52 35.87 L55.04 36.64 L54.57 37.42 L54.11 38.20 L53.66 38.99 L53.21 39.78 L52.77 40.57 L52.33 41.37 L51.91 42.17 L51.49 42.98 L51.07 43.79 L50.67 44.61 L50.27 45.43 L49.88 46.25 L49.49 47.08 L49.11 47.92 L48.74 48.75 L48.38 49.60 L48.03 50.44 L47.68 51.30 L47.34 52.15 L47.00 53.01 L46.67 53.88 L46.36 54.75 L46.04 55.62 L45.74 56.50 L45.45 57.38 L45.18 58.28 L44.95 59.18 L44.72 60.09 L44.51 61.01 L44.29 61.93 L44.07 62.84 L43.84 63.76 Z" fill="url(#bc-talwar)" stroke="#c4a56a" strokeWidth="1.5" strokeLinejoin="miter" strokeMiterlimit="8" />
        <path d="M43.21 58.64 L43.48 57.73 L43.77 56.82 L44.07 55.93 L44.38 55.03 L44.70 54.14 L45.02 53.26 L45.35 52.38 L45.69 51.51 L46.04 50.64 L46.39 49.77 L46.75 48.91 L47.12 48.05 L47.50 47.20 L47.88 46.35 L48.27 45.50 L48.67 44.66 L49.07 43.83 L49.48 43.00 L49.90 42.17 L50.33 41.35 L50.76 40.53 L51.20 39.72 L51.65 38.91 L52.11 38.10 L52.57 37.30 L53.04 36.51 L53.51 35.71 L54.00 34.93 L54.49 34.14 L54.99 33.37 L55.49 32.59 L56.01 31.82 L56.53 31.05 L57.05 30.29 L57.59 29.54 L58.14 28.79 L58.70 28.05 L59.26 27.31" stroke="#15120d" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M39.71 58.57 L40.05 57.65 L40.38 56.73 L40.71 55.81 L41.03 54.89 L41.35 53.97 L41.67 53.05 L42.01 52.14 L42.35 51.23 L42.70 50.33 L43.05 49.43 L43.41 48.54 L43.78 47.65 L44.16 46.77 L44.55 45.89 L44.94 45.01 L45.34 44.14 L45.75 43.27 L46.16 42.41 L46.59 41.55 L47.02 40.69 L47.45 39.84 L47.90 39.00 L48.35 38.16 L48.81 37.32 L49.28 36.49 L49.76 35.66 L50.24 34.84 L50.73 34.02 L51.23 33.21 L51.73 32.40 L52.25 31.59 L52.77 30.79 L53.30 30.00 L53.84 29.21 L54.38 28.42 L54.92 27.63 L55.46 26.85 L56.01 26.06 L56.56 25.27 L57.12 24.49 L57.68 23.71 L58.25 22.93 L58.83 22.16 L59.42 21.39 L60.02 20.64 L60.64 19.89 L61.27 19.15 L61.93 18.43 L62.62 17.75 L63.34 17.09 L64.07 16.43 L64.77 15.75 L65.60 15.20 L66.50 14.72 L67.41 14.24 L68.32 13.78" stroke="#e2c98f" strokeOpacity="0.85" strokeWidth="0.6" strokeLinecap="round" />
        {/* knuckle-guard */}
        <path d="M30.27 62.10 C23.99 64.67 23.87 74.47 28.08 78.08" stroke="#c4a56a" strokeWidth="2.1" strokeLinecap="round" />
        {/* cross-guard with round knobs, and the langet running up the blade */}
        <path d="M30.27 62.10 L50.17 67.41" stroke="#c4a56a" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="30.27" cy="62.10" r="3" fill="#c4a56a" />
        <circle cx="50.17" cy="67.41" r="3" fill="#c4a56a" />
        <path d="M38.53 62.96 L43.03 54.23 L43.16 64.20 Z" fill="#c4a56a" />
        {/* grip, swelling in the middle */}
        <path d="M37.78 65.76 L37.12 66.71 L36.50 67.66 L35.92 68.63 L35.41 69.62 L34.98 70.62 L34.66 71.66 L34.43 72.72 L34.29 73.80 L34.24 74.91 L34.26 76.04 L34.33 77.18 L34.43 78.32 L39.07 79.56 L39.72 78.61 L40.35 77.66 L40.93 76.69 L41.44 75.71 L41.86 74.70 L42.19 73.67 L42.42 72.61 L42.56 71.52 L42.60 70.41 L42.58 69.29 L42.51 68.15 L42.42 67.00 Z" fill="#15120d" stroke="#c4a56a" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M37.06 66.92 L42.47 68.36" stroke="#c4a56a" strokeWidth="1.1" />
        <path d="M34.38 76.97 L39.79 78.41" stroke="#c4a56a" strokeWidth="1.1" />
        {/* disc pommel, its dome and knob */}
        <ellipse cx="36.28" cy="80.68" rx="9.6" ry="3.2" transform="rotate(-165.1 36.28 80.68)" fill="#c4a56a" />
        <ellipse cx="35.64" cy="83.10" rx="4.7" ry="2.8" transform="rotate(-165.1 35.64 83.10)" fill="#c4a56a" />
        <circle cx="34.76" cy="86.38" r="1.9" fill="#c4a56a" />
      </g>
    </svg>
  );
}

// Betray: a British flintlock pistol of the 1750s, muzzle raised: walnut stock to near the
// muzzle, brass nose cap and butt cap, ramrod, trigger guard, and the lock with its cock,
// flint and frizzen. In gold leaf.
function BetrayalEmblem() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bc-barrel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2c98f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#e2c98f" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {/* scaled to fill the medallion, centred */}
      <g transform="matrix(1.08 0 0 1.08 -5.62 -2.92)">
        <g transform="translate(10 39) rotate(17 40 10)">
          {/* barrel, with a swell at the muzzle */}
          <path d="M0 -2.7 L3.4 -2.7 L4.4 -2.1 L57 -2.7 L57 2.7 L4.4 2.1 L3.4 2.7 L0 2.7 Z" fill="url(#bc-barrel)" stroke="#c4a56a" strokeWidth="1.2" strokeLinejoin="round" />
          {/* walnut stock: fore-end under the barrel, the wrist and the curved grip */}
          <path d="M7 0.7 L50 0.7 L57.5 0.3 C61.5 0.8 65.5 3.6 69.5 8.6 C72.5 12.6 74.5 16.6 77 20 L73.6 26 C70.6 23.6 67.6 19.6 64.6 15.6 C62 12.4 59.8 10.4 57.2 9.2 C55 7 52.5 5.6 49 5.2 L7 4.9 Z" fill="#2a1b0e" stroke="#c4a56a" strokeWidth="1.2" strokeLinejoin="round" />
          {/* ramrod, its pipes and the brass nose cap */}
          <path d="M8.5 3.7 L43 3.7" stroke="#c4a56a" strokeWidth="0.8" strokeOpacity="0.85" />
          <path d="M19 0.9 L19 4.7 M33 0.9 L33 4.7" stroke="#c4a56a" strokeWidth="1.3" />
          <rect x="6.3" y="0.4" width="2.2" height="4.8" fill="#c4a56a" />
          {/* brass butt cap */}
          <ellipse cx="75.8" cy="23.6" rx="5.6" ry="4.4" transform="rotate(-48 75.8 23.6)" fill="#c4a56a" />
          {/* trigger guard and trigger */}
          <path d="M46 5 C47.5 11.5 57 13 60 8.6" stroke="#c4a56a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M54.6 5.4 C53.6 7.2 53.9 8.7 55.2 9.8" stroke="#c4a56a" strokeWidth="1.4" strokeLinecap="round" />
          {/* the flintlock: lock plate, pan, frizzen, and the cock holding its flint */}
          <g transform="translate(51 0) scale(1.25) translate(-51 0)">
          <path d="M41.5 0.9 C46 -0.3 58 -0.3 64 1.9 C58 4.3 46 4.3 41.5 2.7 Z" fill="#c4a56a" />
          <rect x="45.6" y="-1.1" width="5.4" height="1.6" fill="#c4a56a" />
          <path d="M47.4 -0.6 L48.2 -8 L50.6 -8.2 L50.2 -0.8 Z" fill="#c4a56a" />
          <path d="M58.2 1.2 C61.4 -1.6 60.6 -5.4 57.2 -6.8" stroke="#c4a56a" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M57.6 -5.6 L53.2 -5.9 L53.2 -9.2 L57.8 -9 Z" fill="#c4a56a" />
          <path d="M53.3 -8.4 L51.3 -8.1 L51.3 -6.6 L53.3 -6.4 Z" fill="#15120d" stroke="#c4a56a" strokeWidth="0.6" />
          </g>
        </g>
      </g>
    </svg>
  );
}

const CARDS = {
  LOYAL:    { cls: 'loyal',    Emblem: LoyalEmblem,    name: 'Loyal',  faction: 'Serve the Nawab' },
  BETRAYAL: { cls: 'betrayal', Emblem: BetrayalEmblem, name: 'Betray', faction: 'Serve the Company' },
};

export default function BattleCardOverlay({ isEIC, onSubmit, submitted, needsTwo = false }) {
  const [animIn, setAnimIn] = useState(false);
  const [chosen, setChosen] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handlePick = (card) => {
    if (chosen || submitted) return;
    setChosen(card);
    playSound(SOUNDS.CARD_PICK || SOUNDS.VOTE_YES, { volume: 0.9 });
    setTimeout(() => onSubmit(card), 650);
  };

  if (submitted) return null;
  const choices = isEIC ? ['LOYAL', 'BETRAYAL'] : ['LOYAL'];

  return (
    <div className={`bc-overlay ${animIn ? 'bc-overlay--in' : ''}`}>
      <div className="bc-overlay__backdrop" />
      <div className="bc-overlay__panel">
        <p className="bc-overlay__eyebrow">The Clash</p>
        <h2 className="bc-overlay__title">Choose Your Action</h2>
        <p className="bc-overlay__sub">This choice is secret. Only the outcome will be revealed.</p>
        {needsTwo && <p className="bc-overlay__note">It takes two Betray cards to sabotage this chapter.</p>}

        <div className="bc-overlay__cards">
          {choices.map(key => {
            const c = CARDS[key];
            const state = chosen === key ? ' is-chosen' : chosen ? ' is-unchosen' : '';
            return (
              <button
                key={key} type="button"
                className={`bc-card bc-card--${c.cls}${state}`}
                onClick={() => handlePick(key)}
                disabled={!!chosen}
              >
                <span className="bc-card__face">
                  <span className="bc-card__medallion"><c.Emblem /></span>
                  <span className="bc-card__name">{c.name}</span>
                  <span className="bc-card__faction">{c.faction}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
