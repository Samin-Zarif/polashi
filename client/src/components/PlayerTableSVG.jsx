// POLASHI - War Table, single-SVG fallback renderer (used when WebGL is unavailable)
// The whole scene is ONE SVG. Far players are drawn BEFORE the tabletop so the
// wood hides their lower bodies (they sit behind the table). Near players are
// drawn AFTER it, overlapping the front rim. Hands rest on the wood.
import './PlayerTableSVG.css';

const VB_W = 1000, VB_H = 600;           // scene viewBox
const TCX = 500, TCY = 318;              // table centre
const TRX = 356, TRY = 128;              // table radii
const EDGE = 24;                          // table thickness

function seatGeom(i, n) {
  const a = (i / n) * 2 * Math.PI + Math.PI / 2;   // seat 0 = front centre
  const depth = (Math.sin(a) + 1) / 2;             // 0 far … 1 near
  const s = 0.62 + 0.55 * depth;                   // figure scale
  const rimX = TCX + TRX * Math.cos(a);
  const rimY = TCY + TRY * Math.sin(a);
  // anchor = bottom-centre of the figure
  const ax = TCX + (TRX + 6) * Math.cos(a);
  const ay = rimY + (depth > 0.6 ? 66 * s : 30 * s);
  // hands rest on the wood, just inside the rim, toward the centre
  const hx = TCX + (TRX - 34) * Math.cos(a);
  const hy = TCY + (TRY - 16) * Math.sin(a);
  return { a, depth, s, ax, ay, hx, hy, near: depth > 0.6 };
}

// Front-facing figure (far side) — lower body will be hidden by the tabletop
function FigFront({ s }) {
  return (
    <g transform={`scale(${s})`}>
      {/* chair back behind */}
      <rect x="-34" y="-118" width="68" height="76" rx="10" className="wt3b-chair"/>
      <rect x="-28" y="-112" width="56" height="64" rx="7" className="wt3b-chair2"/>
      {/* torso */}
      <path d="M-36 6 C-36 -46 -20 -70 0 -70 C20 -70 36 -46 36 6 L36 14 L-36 14 Z" className="wt3b-body"/>
      {/* top-light so it reads 3D */}
      <path d="M-30 -40 C-24 -60 -12 -68 0 -68 C12 -68 24 -60 30 -40 C18 -50 -18 -50 -30 -40 Z" className="wt3b-lite"/>
      {/* neck + head */}
      <rect x="-7" y="-84" width="14" height="12" className="wt3b-body"/>
      <circle cx="0" cy="-96" r="17" className="wt3b-body"/>
      <ellipse cx="-5" cy="-102" rx="9" ry="6" className="wt3b-lite"/>
    </g>
  );
}

// Back-facing figure (near side) — chair back faces the camera
function FigBack({ s }) {
  return (
    <g transform={`scale(${s})`}>
      {/* shoulders + head first */}
      <path d="M-40 4 C-40 -52 -22 -76 0 -76 C22 -76 40 -52 40 4 L40 10 L-40 10 Z" className="wt3b-body"/>
      <circle cx="0" cy="-92" r="18" className="wt3b-body"/>
      <ellipse cx="0" cy="-101" rx="11" ry="7" className="wt3b-lite"/>
      {/* tall chair back between camera and person */}
      <rect x="-42" y="-64" width="84" height="76" rx="9" className="wt3b-chairfront"/>
      <rect x="-35" y="-57" width="70" height="62" rx="6" className="wt3b-chairfront2"/>
    </g>
  );
}

export function PlayerTableSVG({ players, myId, myIntel, phase, teamProposal, selectedIds, onToggleSelect, selectableIds, votes, votesRevealed }) {
  // the leader picks the team; in the assassination Mir Jafar picks his mark (only the Nawab's side)
  const isProposal = phase === 'TEAM_PROPOSAL' || phase === 'ASSASSINATION';
  const safeIntel  = { redPlayerIds: myIntel?.redPlayerIds||[], yellowPlayerIds: myIntel?.yellowPlayerIds||[] };
  const n = players.length;

  const seats = players.map((p, i) => {
    const g = seatGeom(i, n);
    const isMe       = p.id === myId;
    const isOnTeam   = teamProposal.includes(p.id);
    const isSelected = (selectedIds||[]).includes(p.id);
    const isRed      = safeIntel.redPlayerIds.includes(p.id);
    const isYellow   = safeIntel.yellowPlayerIds.includes(p.id);
    const selectable = isProposal && !!onToggleSelect && (!selectableIds || selectableIds.includes(p.id));
    const cls = ['wt3b-fig',
      isMe?'is-me':'', p.isLeader?'is-leader':'',
      isOnTeam?'is-on-team':'', isSelected?'is-selected':'',
      selectable?'selectable':'',
      isRed?'intel-red':isYellow?'intel-yellow':'',
    ].filter(Boolean).join(' ');
    return { p, ...g, isMe, selectable, cls };
  });

  const far  = seats.filter(s => !s.near).sort((a,b) => a.ay - b.ay);
  const near = seats.filter(s =>  s.near).sort((a,b) => a.ay - b.ay);

  const octPts = Array.from({length:8}, (_,k)=>{
    const a = (k/8)*2*Math.PI - Math.PI/8;
    return `${TCX + TRX*0.62*Math.cos(a)},${TCY + TRY*0.62*Math.sin(a)}`;
  }).join(' ');

  const renderFig = (st) => (
    <g key={st.p.id} className={st.cls}
      transform={`translate(${st.ax} ${st.ay})`}
      onClick={() => st.selectable && onToggleSelect(st.p.id)}
      role={st.selectable ? 'button' : undefined}>
      {st.near ? <FigBack s={st.s}/> : <FigFront s={st.s}/>}
      {(teamProposal.includes(st.p.id) || (selectedIds||[]).includes(st.p.id)) && (
        <g transform={`translate(${26*st.s} ${-6*st.s}) scale(${st.s})`}>
          <circle r="12" className="wt3b-check"/>
          <path d="M-5 0 L-1 4 L6 -4" stroke="#0d0a05" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
    </g>
  );

  return (
    <div className="wt-table-wrap">
      <div className="wt3b-stage">
        <svg className="wt3b-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="wt3bWood" cx="42%" cy="26%" r="85%">
              <stop offset="0%"  stopColor="#7d5a28"/>
              <stop offset="45%" stopColor="#4a3819"/>
              <stop offset="100%" stopColor="#1d150b"/>
            </radialGradient>
            <linearGradient id="wt3bEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#2c2010"/>
              <stop offset="100%" stopColor="#0e0a05"/>
            </linearGradient>
            <radialGradient id="wt3bFloor" cx="50%" cy="50%" r="60%">
              <stop offset="0%"  stopColor="rgba(201,145,58,0.14)"/>
              <stop offset="100%" stopColor="rgba(201,145,58,0)"/>
            </radialGradient>
          </defs>

          {/* floor light pool */}
          <ellipse cx={TCX} cy={TCY + 90} rx={TRX + 130} ry={TRY + 110} fill="url(#wt3bFloor)"/>

          {/* FAR players — the tabletop will cover their lower half */}
          {far.map(renderFig)}

          {/* table thickness, then top */}
          <ellipse cx={TCX} cy={TCY + EDGE} rx={TRX} ry={TRY} fill="url(#wt3bEdge)" stroke="rgba(201,145,58,0.25)" strokeWidth="1"/>
          <ellipse cx={TCX} cy={TCY} rx={TRX} ry={TRY} fill="url(#wt3bWood)" stroke="#8a6a2f" strokeWidth="2.5"/>
          <ellipse cx={TCX} cy={TCY} rx={TRX-14} ry={TRY-8} fill="none" stroke="rgba(201,145,58,0.18)" strokeWidth="1"/>
          <polygon points={octPts} fill="none" stroke="rgba(201,145,58,0.14)" strokeWidth="1.2"/>
          <ellipse cx={TCX} cy={TCY} rx={TRX*0.2} ry={TRY*0.2} fill="none" stroke="rgba(201,145,58,0.16)" strokeWidth="1"/>
          <text x={TCX} y={TCY+10} textAnchor="middle" fontSize="30" fill="rgba(201,145,58,0.14)">⚔</text>

          {/* per-seat panel slots on the wood */}
          {seats.map(st => (
            <rect key={'slot'+st.p.id}
              x={TCX + (TRX-58)*Math.cos(st.a) - 22} y={TCY + (TRY-26)*Math.sin(st.a) - 9}
              width="44" height="18" rx="3"
              fill="rgba(0,0,0,0.25)" stroke="rgba(201,145,58,0.18)" strokeWidth="0.8"/>
          ))}

          {/* hands of far players resting on the wood */}
          {far.map(st => (
            <g key={'h'+st.p.id} className={st.cls} pointerEvents="none">
              <ellipse cx={st.hx - 15*st.s} cy={st.hy} rx={7.5*st.s} ry={4.2*st.s} className="wt3b-body"/>
              <ellipse cx={st.hx + 15*st.s} cy={st.hy} rx={7.5*st.s} ry={4.2*st.s} className="wt3b-body"/>
            </g>
          ))}

          {/* NEAR players — drawn over the front rim */}
          {near.map(renderFig)}
        </svg>

        {/* Name plaques (HTML for crisp text) — % mapped to the viewBox */}
        {seats.map(st => {
          const headTop = st.ay - (st.near ? 112 : 116) * st.s;
          return (
            <div key={'n'+st.p.id}
              className={`wt3b-name ${st.cls.replace('wt3b-fig','')}`}
              style={{ left: `${st.ax/VB_W*100}%`, top: `${headTop/VB_H*100}%` }}>
              {st.p.isLeader && phase !== 'ASSASSINATION' && phase !== 'GAME_OVER' && <span className="wt3b-name__leader">Leader</span>}
              <span className="wt3b-name__text">{st.p.name}{st.isMe ? ' (you)' : ''}</span>
              {st.p.roleMeta && <span className={`wt3b-name__tag ${st.p.faction==='EIC'?'no':'yes'}`}>{st.p.roleMeta.displayName}</span>}
              {phase==='TEAM_VOTE' && !votesRevealed && st.p.hasVoted && <span className="wt3b-name__tag">Voted</span>}
              {votesRevealed && votes && votes[st.p.id] && (
                <span className={`wt3b-name__tag ${votes[st.p.id]==='YES'?'yes':'no'}`}>
                  {votes[st.p.id]==='YES' ? '✓ Yes' : '✗ No'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerTableSVG;
