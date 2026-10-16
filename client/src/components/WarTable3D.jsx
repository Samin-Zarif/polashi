// POLASHI - War Table: the war room.
//
// Zarif's painted picture of the empty room fills the panel, and the stone statues sit round
// the painted table in 3D (components/warRoom3D.js), one per player, evenly spaced. You always
// sit in the front chair, back to the camera. A statue lights up from within in its colour
// (red / yellow for what you know about them, warm white when the leader picks them, green
// when they are on the team), a ring glows on the table in front of picked and team statues,
// and while the leader is choosing, the statue under the mouse gets a pale-blue outline.
// Names float above the heads.
//
// The picture fills the whole panel: the statues are kept in the clear space between the
// floating panels (the `insets`), and past the picture's edges the room carries on as a soft
// reflection that fades into shadow, so there is never a black border.
//
// Nothing shows until the picture and the statues are loaded and the first frame is drawn;
// then the room fades in. If the browser can't draw it, the flat 2D table (PlayerTableSVG) is shown.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PlayerTableSVG } from './PlayerTableSVG';
import { WAR_ROOM as ROOM, seatFrames, seatToRoom, projectToPicture } from '../data/warRoom';
import { loadImage, canDrawWarRoom, loadWarRoom3D, statueLook } from './warRoomAssets';
import './WarTable3D.css';

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0, keepTorches: false };
const LABEL_ROOM = 36;   // space kept above the highest head for its name plate (CSS px)
const HEAD_TOP = 1.52;   // the tallest statue's head (m)
// top of each statue's head in its chair's frame (x, height, towards the table), metres
const CROWN = { A: [0, 1.52, -0.05], B: [0, 1.445, -0.1], W: [0, 1.38, 0.06] };

// ── Where each statue appears in the picture (picture px) ─────────────────────
//   top: above the tallest head (for framing)   box: statue and chair   bottom: the waist
function seatSpots(n) {
  return seatFrames(n).map(f => {
    const P = p => projectToPicture(seatToRoom(f, p));
    const xs = [], ys = [];
    for (const x of [-0.3, 0.3]) for (const y of [0, HEAD_TOP]) for (const z of [-0.3, 0.6]) {
      const [u, v] = P([x, y, z]); xs.push(u); ys.push(v);
    }
    return {
      frame: f,
      top: P([0, HEAD_TOP + 0.04, -0.05])[1],
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      bottom: P([0, 0.7, 0])[1],
    };
  });
}
// where a name plate goes: just above that statue's head
function plateSpot(spot, look) {
  const [x, y, z] = CROWN[look] || CROWN.A;
  return projectToPicture(seatToRoom(spot.frame, [x, y + 0.03, z]));
}

// ── Framing: where the picture goes on screen ─────────────────────────────────
// As big as possible while every statue (and its name) stays in the clear space between the
// panels. With keepTorches the wall torches at the top stay in view too. Within that, the
// picture is slid to cover the whole screen when it can.
function statueArea(spots) {
  const a = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const s of spots) {
    a.x0 = Math.min(a.x0, s.box[0]); a.x1 = Math.max(a.x1, s.box[2]);
    a.y0 = Math.min(a.y0, s.top); a.y1 = Math.max(a.y1, s.bottom);
  }
  a.x0 -= 12; a.x1 += 12;
  return a;
}
function preferCover(v, lo, hi, coverLo, coverHi) {
  const a = Math.max(lo, coverLo), b = Math.min(hi, coverHi);
  return a <= b ? Math.min(b, Math.max(a, v)) : v;
}
function computeLayout(W, H, insets, area) {
  const torchTop = insets.keepTorches ? ROOM.torchTop : null;      // picture px: top of the torch flames
  const availW = Math.max(60, W - insets.left - insets.right);
  const availH = Math.max(60, H - insets.top - insets.bottom - LABEL_ROOM);
  let s = Math.min(availW / (area.x1 - area.x0), availH / (area.y1 - area.y0));
  if (torchTop !== null) s = Math.min(s, Math.max(60, H - insets.bottom) / (area.y1 - torchTop));
  s = Math.max(s, 0.15);
  const dw = ROOM.width * s, dh = ROOM.height * s;
  const loX = insets.left - area.x0 * s, hiX = W - insets.right - area.x1 * s;
  const left = preferCover((loX + hiX) / 2, Math.min(loX, hiX), Math.max(loX, hiX), W - dw, 0);
  let loY = insets.top + LABEL_ROOM - area.y0 * s;
  const hiY = H - insets.bottom - area.y1 * s;
  if (torchTop !== null) loY = Math.max(loY, -torchTop * s);
  const top = preferCover((loY + hiY) / 2, Math.min(loY, hiY), Math.max(loY, hiY), H - dh, 0);
  return { s, left, top, W, H };
}

// Measures the panel so the picture, the names and the mouse all use the same numbers.
function usePanelSize(ref) {
  const [size, setSize] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize(s => (s && s.W === r.width && s.H === r.height ? s : { W: r.width, H: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const QUIET = { tone: [0, 0, 0, 0], hover: 0, rings: [0, 0] };

// ── The room ──────────────────────────────────────────────────────────────────
function Room({
  onFail, insets = NO_INSETS,
  players, myId, myIntel, phase, teamProposal, selectedIds, onToggleSelect, selectableIds, votes, votesRevealed,
}) {
  const wrapRef = useRef(null);
  const hostRef = useRef(null);
  const roomRef = useRef(null);
  const [base, setBase] = useState(null);       // { mod, models } once the room is running
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(-1);
  const size = usePanelSize(wrapRef);

  // who sits where: you in the front chair (seat 0), everyone else round the table in order
  const n = players.length;
  const spots = useMemo(() => seatSpots(n), [n]);
  const area = useMemo(() => statueArea(spots), [spots]);
  const insetsKey = `${insets.top}|${insets.right}|${insets.bottom}|${insets.left}|${insets.keepTorches ? 1 : 0}`;
  const layout = useMemo(() => {
    if (!size) return null;
    const [top, right, bottom, left, torches] = insetsKey.split('|').map(Number);
    return computeLayout(size.W, size.H, { top, right, bottom, left, keepTorches: !!torches }, area);
  }, [size, insetsKey, area]);

  const myIndex = Math.max(0, players.findIndex(p => p.id === myId));
  const red = myIntel?.redPlayerIds || [];
  const yellow = myIntel?.yellowPlayerIds || [];
  const team = teamProposal || [];
  const picked = selectedIds || [];
  // the leader picks the team; in the assassination Mir Jafar picks his mark (selectableIds: who can be picked)
  const selectable = (phase === 'TEAM_PROPOSAL' || phase === 'ASSASSINATION') && !!onToggleSelect;
  const canPick = (p) => selectable && !!p && (!selectableIds || selectableIds.includes(p.id));
  const seated = players.map((p, i) => ({
    p,
    seat: (i - myIndex + n) % n,
    isMe: p.id === myId,
    isRed: red.includes(p.id),
    isYellow: yellow.includes(p.id),
    isSelected: picked.includes(p.id),
    isOnTeam: team.includes(p.id),
  }));
  const bySeat = [];
  seated.forEach(s => { bySeat[s.seat] = s; });
  const hovered = selectable ? hover : -1;

  // which statue each seat gets, and how it should look now (the room eases towards it)
  const looks = bySeat.map(s => statueLook(s?.p));
  const looksKey = looks.join('');
  const targets = bySeat.map(s => {
    if (!s) return QUIET;
    const tone = [0, 0, 0, 0];
    const t = s.isRed ? 0 : s.isYellow ? 1 : s.isSelected ? 2 : s.isOnTeam ? 3 : -1;
    if (t >= 0) tone[t] = 1;
    return { tone, hover: s.seat === hovered ? 1 : 0, rings: [s.isSelected ? 1 : 0, s.isOnTeam && !s.isSelected ? 1 : 0] };
  });
  // handed to the room after every render
  useLayoutEffect(() => {
    const room = roomRef.current;
    if (!room || !layout) return;
    room.setView(layout);
    room.setTargets(targets);
    room.setHover(hovered);
  });

  // Load the picture, the 3D code and the statues; start drawing. The canvas is made fresh on every mount.
  // A tab in the background downloads everything but builds the room only once it is looked at,
  // so several tabs (or windows) on one computer don't all build their rooms at the same moment.
  useEffect(() => {
    let alive = true, raf = 0, room = null, canvas = null, onShow = null;
    const lost = (e) => { e.preventDefault(); if (alive) onFail('the graphics card reset'); };
    const whenVisible = () => new Promise(resolve => {
      if (document.visibilityState === 'visible') { resolve(); return; }
      onShow = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', onShow); onShow = null; resolve(); } };
      document.addEventListener('visibilitychange', onShow);
    });
    Promise.all([loadImage(ROOM.image), loadWarRoom3D()])
      .then(([picture, mod]) => Promise.all(['chair', 'A', 'B'].map(k => mod.loadModel(k)))
        .then(([chair, A, B]) => ({ picture, mod, models: { chair, A, B } })))
      .then(loaded => whenVisible().then(() => loaded))
      .then(({ picture, mod, models }) => {
        if (!alive || !hostRef.current) return;
        canvas = document.createElement('canvas');
        canvas.className = 'wtd-canvas';
        canvas.addEventListener('webglcontextlost', lost, false);
        hostRef.current.appendChild(canvas);
        room = mod.createWarRoom3D(canvas, picture);
        roomRef.current = room;
        setBase({ mod, models });
        let last = 0, shown = false, busy = true;
        const loop = (now) => {
          raf = requestAnimationFrame(loop);
          // ~60 frames a second while something changes, fewer when the room is at rest, and fewer
          // still while the council letter covers it (so the letter's animation has the graphics
          // card to itself)
          const covered = document.body.classList.contains('sv-letter-open');
          if (shown && document.body.classList.contains('bu-open')) return;   // hidden behind the battle (the rain at Palashi)
          if (shown && now - last < (busy ? 15.5 : covered ? 80 : 32)) return;
          const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
          last = now;
          if (!room.ready()) return;
          busy = room.frame(now / 1000, dt);
          if (!shown && room.drawn()) {      // fade in once the first real picture is drawn
            shown = true;
            requestAnimationFrame(() => { if (alive) setReady(true); });
          }
        };
        raf = requestAnimationFrame(loop);
      })
      .catch(err => { if (alive) onFail(err?.message || err); });
    return () => {
      alive = false;
      if (onShow) document.removeEventListener('visibilitychange', onShow);
      cancelAnimationFrame(raf);
      roomRef.current = null;
      try { room?.dispose(); } catch { /* already gone */ }
      if (canvas) { canvas.removeEventListener('webglcontextlost', lost); canvas.remove(); }
    };
  }, [onFail]);

  // Seat the statues (again when the players or their looks change; the queen's statue is
  // fetched if it wasn't already).
  useEffect(() => {
    const room = roomRef.current;
    if (!room || !base) return undefined;
    let alive = true;
    const seatList = looksKey.split('');
    const needsWoman = seatList.includes('W');
    room.setSeats(seatList, base.models);        // shows a man until the woman is loaded
    if (needsWoman) {
      base.mod.loadModel('W').then(W => {
        if (alive && roomRef.current === room) room.setSeats(seatList, { ...base.models, W });
      }).catch(() => { /* keep the man */ });
    }
    return () => { alive = false; };
  }, [base, looksKey]);

  // ── Mouse / touch: which statue is under the pointer ──
  const seatAt = useCallback((clientX, clientY) => {
    const el = wrapRef.current, room = roomRef.current;
    if (!el || !room) return -1;
    const r = el.getBoundingClientRect();
    return room.pick(clientX - r.left, clientY - r.top);
  }, []);
  const handleMove = (e) => {
    if (!selectable || e.target.closest?.('.wtd-name')) return;
    let k = seatAt(e.clientX, e.clientY);
    if (k >= 0 && !canPick(bySeat[k]?.p)) k = -1;
    if (k !== hover) setHover(k);
  };
  const handleLeave = () => { if (hover !== -1) setHover(-1); };
  const handleClick = (e) => {
    if (!selectable || e.target.closest?.('.wtd-name')) return;
    const k = seatAt(e.clientX, e.clientY);
    if (k >= 0 && canPick(bySeat[k]?.p)) onToggleSelect(bySeat[k].p.id);
  };

  return (
    <div
      ref={wrapRef}
      className={`wtd-wrap${ready ? ' is-ready' : ''}${selectable ? ' is-choosing' : ''}${hovered >= 0 ? ' is-pointing' : ''}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={handleClick}
    >
      <div className="wtd-loading" aria-hidden={ready}>The council gathers&hellip;</div>
      <div ref={hostRef} className="wtd-stage" />
      {layout && (
        <div className="wtd-labels">
          {seated.slice().sort((a, b) => a.seat - b.seat).map(({ p, seat, isMe, isRed, isYellow, isSelected, isOnTeam }) => {
            const s = spots[seat];
            if (!s) return null;
            const voteValue = votes ? votes[p.id] : null;
            const cls = [
              'wtd-name',
              isMe ? 'is-me' : '',
              isRed ? 'intel-red' : isYellow ? 'intel-yellow' : '',
              isSelected ? 'is-selected' : '',
              isOnTeam ? 'is-on-team' : '',
              seat === hovered ? 'is-hovered' : '',
            ].filter(Boolean).join(' ');
            const [ax, ay] = plateSpot(s, looks[seat]);
            const style = { left: layout.left + ax * layout.s, top: layout.top + ay * layout.s };
            const inner = (
              <>
                {p.isLeader && phase !== 'ASSASSINATION' && phase !== 'GAME_OVER' && <span className="wtd-name__leader">Leader</span>}
                <span className="wtd-name__text">{p.name}{isMe ? ' (you)' : ''}</span>
                {p.roleMeta && <span className={`wtd-name__role ${p.faction === 'EIC' ? 'eic' : 'nawab'}`}>{p.roleMeta.displayName}</span>}
                {phase === 'TEAM_VOTE' && !votesRevealed && p.hasVoted && <span className="wtd-name__tag">Voted</span>}
                {votesRevealed && voteValue && (
                  <span className={`wtd-name__tag ${voteValue === 'YES' ? 'yes' : 'no'}`}>
                    {voteValue === 'YES' ? '✓ Yes' : '✗ No'}
                  </span>
                )}
              </>
            );
            return canPick(p) ? (
              <button
                key={p.id} type="button" className={cls + ' is-button'} style={style}
                aria-pressed={isSelected}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(p.id); }}
                onPointerEnter={() => setHover(seat)}
                onPointerLeave={() => setHover(-1)}
                onFocus={() => setHover(seat)}
                onBlur={() => setHover(-1)}
              >
                {inner}
              </button>
            ) : (
              <div key={p.id} className={cls} style={style}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Root: the 3D room, or the flat 2D table when it can't be drawn ────────────
export default function WarTable3D(props) {
  const { insets = NO_INSETS } = props;
  const [failed, setFailed] = useState(false);
  const handleFail = useCallback((why) => {
    console.warn('[WarTable] 3D room unavailable, showing the flat table instead:', why);
    setFailed(true);
  }, []);

  if (failed || !canDrawWarRoom()) {
    return (
      <div className="wtd-fallback" style={{ paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom, paddingLeft: insets.left }}>
        <PlayerTableSVG {...props} />
      </div>
    );
  }
  return <Room {...props} onFail={handleFail} />;
}
