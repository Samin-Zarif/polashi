// POLASHI — Real SVG Sword Clash Animation
// Two actual sword shapes that clash together with sparks

export default function SwordClash({ waiting }) {
  return (
    <div className="sword-clash">
      <div className="sword-clash__arena">

        {/* ── Nawab Sword (green, swings from left) ── */}
        <div className="sword-clash__sword sword-clash__sword--left">
          <svg viewBox="0 0 40 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blade */}
            <polygon points="18,0 22,0 24,120 16,120" fill="url(#bladeGreen)" />
            {/* Blade edge highlight */}
            <line x1="20" y1="2" x2="20" y2="118" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"/>
            {/* Guard */}
            <rect x="6" y="118" width="28" height="8" rx="2" fill="#2ecc71" />
            <rect x="8" y="120" width="24" height="4" rx="1" fill="#27ae60" />
            {/* Grip */}
            <rect x="15" y="126" width="10" height="28" rx="2" fill="#8B6914" />
            <line x1="15" y1="130" x2="25" y2="130" stroke="#6B4F10" strokeWidth="1"/>
            <line x1="15" y1="135" x2="25" y2="135" stroke="#6B4F10" strokeWidth="1"/>
            <line x1="15" y1="140" x2="25" y2="140" stroke="#6B4F10" strokeWidth="1"/>
            <line x1="15" y1="145" x2="25" y2="145" stroke="#6B4F10" strokeWidth="1"/>
            {/* Pommel */}
            <ellipse cx="20" cy="156" rx="7" ry="5" fill="#2ecc71"/>
            <ellipse cx="20" cy="155" rx="5" ry="3" fill="#27ae60"/>
            {/* Gradient def */}
            <defs>
              <linearGradient id="bladeGreen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7effc0" />
                <stop offset="40%" stopColor="#e8ffe8" />
                <stop offset="100%" stopColor="#2ecc71" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Sparks in the middle ── */}
        <div className="sword-clash__sparks">
          <div className="sword-clash__spark sword-clash__spark--1"/>
          <div className="sword-clash__spark sword-clash__spark--2"/>
          <div className="sword-clash__spark sword-clash__spark--3"/>
          <div className="sword-clash__spark sword-clash__spark--4"/>
          <div className="sword-clash__spark sword-clash__spark--5"/>
          <div className="sword-clash__spark sword-clash__spark--6"/>
          <div className="sword-clash__glow"/>
        </div>

        {/* ── EIC Sword (red, swings from right) ── */}
        <div className="sword-clash__sword sword-clash__sword--right">
          <svg viewBox="0 0 40 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="18,0 22,0 24,120 16,120" fill="url(#bladeRed)" />
            <line x1="20" y1="2" x2="20" y2="118" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"/>
            <rect x="6" y="118" width="28" height="8" rx="2" fill="#e74c3c" />
            <rect x="8" y="120" width="24" height="4" rx="1" fill="#c0392b" />
            <rect x="15" y="126" width="10" height="28" rx="2" fill="#5a1a1a" />
            <line x1="15" y1="130" x2="25" y2="130" stroke="#3d1010" strokeWidth="1"/>
            <line x1="15" y1="135" x2="25" y2="135" stroke="#3d1010" strokeWidth="1"/>
            <line x1="15" y1="140" x2="25" y2="140" stroke="#3d1010" strokeWidth="1"/>
            <line x1="15" y1="145" x2="25" y2="145" stroke="#3d1010" strokeWidth="1"/>
            <ellipse cx="20" cy="156" rx="7" ry="5" fill="#e74c3c"/>
            <ellipse cx="20" cy="155" rx="5" ry="3" fill="#c0392b"/>
            <defs>
              <linearGradient id="bladeRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff9999" />
                <stop offset="40%" stopColor="#ffe8e8" />
                <stop offset="100%" stopColor="#e74c3c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <p className="sword-clash__label">
        Battle underway &mdash; {waiting} card{waiting !== 1 ? 's' : ''} remaining
      </p>
    </div>
  );
}
