// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Council vote: the letter and the seals
//
// The proposed team arrives as a letter in an envelope: the envelope drops onto the table,
// its flap turns over and the letter slides out towards you. Zarif's two seals stand either
// side: green to approve, red to reject. The seal under the mouse lifts and glows; the chosen
// one swings over, stamps the letter and leaves its mark in wax (a tick in green wax, a cross
// in red), and the vote is sent at the moment it strikes.
//
// No 3D drawing at all: the seals and the wax are pictures rendered from Zarif's 3D seal
// models, the letter is a page element tilted onto the table, and everything moves with the
// browser's own animations. It appears at once and costs next to nothing.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VOTE_IMAGES, preloadVoteImages } from './warRoomAssets';
import './SealVote.css';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const KEYS = ['YES', 'NO'];
const NAME = { YES: 'Approve', NO: 'Reject' };
const DONE = { YES: 'Approved', NO: 'Rejected' };

// ── The table the letter lies on, seen at an angle ────────────────────────────
// Everything is laid out in "design px" on a fixed stage, which is then scaled to fit the
// screen. The table is tilted back by TILT and seen with perspective PERSP.
const TILT = (36 * Math.PI) / 180, PERSP = 1700;
const SIN = Math.sin(TILT), COS = Math.cos(TILT);
const LETTER_W = 440, LETTER_H = 616;          // the letter on the table
const SPOT_DY = 178;                           // the seal lands this far below the letter's centre
const ENV_W = 470, ENV_H = 641, FLAP_D = 265;  // the envelope and its flap
const WAX = 184;                               // the wax picture's size on the letter
// the seal pictures: 414 x 640 px, the stamping face's centre at (207, 472), its front edge at y 571
const SPRITE = { w: 414, h: 640, bx: 207, by: 472.3, front: 571.1 };
const SEAL_H = 270;                            // a seal's height on the stage (where the table isn't foreshortened)
// wide screens: the seals stand either side of the letter; tall screens: in front of it
const LAYOUTS = {
  wide: { w: 1200, h: 820, ox: 600, oy: 410, letterY: 0, rest: { YES: [-420, 110], NO: [420, 110] }, envFrom: -150 },
  tall: { w: 640, h: 1250, ox: 320, oy: 520, letterY: -40, rest: { YES: [-136, 470], NO: [136, 470] }, envFrom: -190 },
};

// a point on the table (table px, y towards you) → where it shows on the stage, and how much
// larger things look there
function onTable(L, x, y) {
  const k = PERSP / (PERSP - y * SIN);
  return { x: L.ox + x * k, y: L.oy + y * COS * k, k };
}

// ── The stamp, moment by moment ───────────────────────────────────────────────
// p: how far from its place to the letter (0..1), lift: px above the table, rot: degrees,
// sx / sy: the squash when it strikes. side: -1 for the seal on the left, +1 on the right.
const ease = { out: u => 1 - (1 - u) ** 3, in: u => u * u * u, inOut: u => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2) };
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const STAMP_MS = 1600, IMPACT_MS = 720, CLOSE_MS = 2150;
function stampState(ms, side) {
  const lean = -side;                          // lean towards the letter
  let p = 0, lift = 0, rot = 0, sx = 1, sy = 1;
  if (ms < 240) {                              // picked up
    const u = ease.out(ms / 240);
    lift = 60 * u; rot = lean * 8 * u;
  } else if (ms < 540) {                       // carried over the letter in an arc
    const u = (ms - 240) / 300, e = ease.inOut(u);
    p = e; lift = 60 + 60 * e + 34 * Math.sin(Math.PI * u); rot = lean * 8 * (1 - e);
  } else if (ms < 640) {                       // a breath above it
    p = 1; lift = 120 + 12 * ease.out((ms - 540) / 100);
  } else if (ms < IMPACT_MS) {                 // down hard
    p = 1; lift = 132 * (1 - ease.in((ms - 640) / (IMPACT_MS - 640)));
  } else if (ms < 980) {                       // pressed: a squash, then rocked once
    p = 1;
    const sq = Math.sin(Math.PI * seg(ms, IMPACT_MS, 800));
    sx = 1 + 0.03 * sq; sy = 1 - 0.06 * sq;
    const r = seg(ms, 800, 980);
    rot = 2.4 * Math.sin(2 * Math.PI * r) * (1 - r);
  } else if (ms < 1260) {                      // lifted off the wax
    p = 1; lift = 110 * ease.out((ms - 980) / 280);
  } else {                                     // carried home
    const u = seg(ms, 1260, STAMP_MS), e = ease.inOut(u);
    p = 1 - e; lift = 110 * (1 - e) + 26 * Math.sin(Math.PI * u); rot = -lean * 6 * Math.sin(Math.PI * u);
  }
  return { p, lift, rot, sx, sy };
}
// The stamp as keyframes every 16 ms: the seal (on the stage) and its shadow (on the table)
function stampKeyframes(L, key) {
  const rest = L.rest[key], spot = [0, L.letterY + SPOT_DY];
  const R = onTable(L, ...rest);
  const side = Math.sign(rest[0]) || 1;
  const seal = [], shadow = [];
  for (let ms = 0; ms <= STAMP_MS; ms += 16) {
    const s = stampState(ms, side);
    const gx = rest[0] + (spot[0] - rest[0]) * s.p, gy = rest[1] + (spot[1] - rest[1]) * s.p;
    const G = onTable(L, gx, gy);
    const k = G.k / R.k;
    const offset = ms / STAMP_MS;
    seal.push({ offset, transform: `translate(${(G.x - R.x).toFixed(1)}px, ${(G.y - R.y - s.lift * G.k).toFixed(1)}px) rotate(${s.rot.toFixed(2)}deg) scale(${(k * s.sx).toFixed(4)}, ${(k * s.sy).toFixed(4)})` });
    shadow.push({ offset, transform: `translate(${(gx - rest[0]).toFixed(1)}px, ${(gy - rest[1]).toFixed(1)}px) scale(${(1 + s.lift / 170).toFixed(3)})`, opacity: +(1 / (1 + s.lift / 40)).toFixed(3) });
  }
  seal[seal.length - 1].offset = 1; shadow[shadow.length - 1].offset = 1;
  return { seal, shadow };
}

// The space the letter and seals may use: the clear middle of the screen between the side
// panels (wide screens), or the whole screen (narrow ones).
function sealRect(insets, stacked) {
  const W = window.innerWidth, H = window.innerHeight;
  const top = insets?.top ?? 0;
  if (stacked || !insets) return { left: 0, top, width: W, height: H - top };
  const r = { left: insets.left, top, width: W - insets.left - insets.right, height: H - top - 12 };
  return r.width < 640 ? { left: 0, top, width: W, height: H - top - 12 } : r;
}

function listNames(names) {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ── The vote ──────────────────────────────────────────────────────────────────
// letter: { leaderName, teamNames, chapter, proposalNo, maxProposals }
// onVote(k) is called once, when the seal strikes; onClosed() when the letter has gone.
export default function SealVote({ letter, onVote, onClosed, insets, stacked, hidden, onPeek }) {
  const [rect, setRect] = useState(() => sealRect(insets, stacked));
  const [canChoose, setCanChoose] = useState(false);
  const [choice, setChoice] = useState(null);
  const [sealed, setSealed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hover, setHover] = useState(null);
  // the moving parts (each animated directly by the browser)
  const letterEl = useRef(null), joltEl = useRef(null), envEl = useRef(null), flapInEl = useRef(null), flapOutEl = useRef(null);
  const bodyEl = { YES: useRef(null), NO: useRef(null) }, shadowEl = { YES: useRef(null), NO: useRef(null) };
  const cb = useRef({ onVote, onClosed });
  useLayoutEffect(() => { cb.current = { onVote, onClosed }; });

  // follow the window's size
  useLayoutEffect(() => {
    const update = () => setRect(sealRect(insets, stacked));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [insets, stacked]);

  const L = rect.width / rect.height < 0.95 ? LAYOUTS.tall : LAYOUTS.wide;
  const tall = L === LAYOUTS.tall;
  const scale = Math.min(rect.width / L.w, rect.height / L.h);
  const stageX = rect.left + (rect.width - L.w * scale) / 2;
  const stageY = rect.top + (rect.height - L.h * scale) / 2;

  // where the seals stand, on the stage
  const seals = useMemo(() => Object.fromEntries(KEYS.map(k => {
    const at = onTable(L, ...L.rest[k]);
    const h = SEAL_H * at.k, f = h / SPRITE.h;
    return [k, {
      at,
      body: { left: at.x - SPRITE.bx * f, top: at.y - SPRITE.by * f, width: SPRITE.w * f, height: h },
      origin: `${SPRITE.bx * f}px ${SPRITE.by * f}px`,
      labelY: at.y + (SPRITE.front - SPRITE.by) * f + 14,
    }];
  })), [L]);

  // ── the opening: envelope down, flap over, letter out, seals in (about 0.9 s) ──
  useLayoutEffect(() => {
    preloadVoteImages();
    const run = [];
    const go = (ref, frames, opts) => { if (ref.current) run.push(ref.current.animate(frames, { fill: 'both', ...opts })); };
    const T = 920, at = ms => ms / T;
    const drop = 'cubic-bezier(0.2, 0.8, 0.2, 1)', away = 'cubic-bezier(0.5, 0, 0.75, 0.4)';
    const startDy = L.envFrom - L.letterY;
    // the letter rides in the envelope, then slides out towards you
    go(letterEl, [
      { offset: 0, transform: `translateY(${startDy - 40}px)`, opacity: 0, easing: drop },
      { offset: at(250), transform: `translateY(${startDy - 2}px)`, opacity: 0 },
      { offset: at(280), transform: `translateY(${startDy}px)`, opacity: 1 },
      { offset: at(560), transform: `translateY(${startDy}px)`, opacity: 1, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' },
      { offset: 1, transform: 'translateY(0px)', opacity: 1 },
    ], { duration: T });
    // the envelope drops in, then backs away and fades as the letter comes out
    go(envEl, [
      { offset: 0, transform: 'translateY(-40px)', opacity: 0, easing: drop },
      { offset: at(280), transform: 'translateY(0px)', opacity: 1 },
      { offset: at(560), transform: 'translateY(0px)', opacity: 1, easing: away },
      { offset: at(760), transform: 'translateY(-300px)', opacity: 1 },
      { offset: 1, transform: 'translateY(-560px)', opacity: 0 },
    ], { duration: T });
    // the flap turns over: its outside folds away, then its inside opens out towards you
    go(flapOutEl, [
      { offset: 0, transform: 'scaleY(1)' },
      { offset: at(280), transform: 'scaleY(1)', easing: 'ease-in' },
      { offset: at(420), transform: 'scaleY(0)' },
      { offset: 1, transform: 'scaleY(0)' },
    ], { duration: T });
    go(flapInEl, [
      { offset: 0, transform: 'translateY(-40px) scaleY(0)', opacity: 0, easing: drop },
      { offset: at(280), transform: 'translateY(0px) scaleY(0)', opacity: 1 },
      { offset: at(420), transform: 'translateY(0px) scaleY(0)', opacity: 1, easing: 'ease-out' },
      { offset: at(560), transform: 'translateY(0px) scaleY(1)', opacity: 1, easing: away },
      { offset: at(760), transform: 'translateY(-300px) scaleY(1)', opacity: 1 },
      { offset: 1, transform: 'translateY(-560px) scaleY(1)', opacity: 0 },
    ], { duration: T });
    // the seals drop into place, one after the other
    KEYS.forEach((k, i) => {
      const delay = 640 + i * 70;
      go(bodyEl[k], [
        { offset: 0, transform: 'translateY(-90px)', opacity: 0 },
        { offset: 0.7, transform: 'translateY(4px)', opacity: 1 },
        { offset: 0.85, transform: 'translateY(-3px)', opacity: 1 },
        { offset: 1, transform: 'translateY(0px)', opacity: 1 },
      ], { duration: 320, delay, easing: 'cubic-bezier(0.55, 0, 0.6, 1)' });
      go(shadowEl[k], [
        { offset: 0, transform: 'scale(1.6)', opacity: 0 },
        { offset: 0.7, transform: 'scale(1)', opacity: 1 },
        { offset: 1, transform: 'scale(1)', opacity: 1 },
      ], { duration: 320, delay });
    });
    const ready = setTimeout(() => setCanChoose(true), 820);
    return () => { clearTimeout(ready); run.forEach(a => a.cancel()); };
    // the opening plays once per letter (and again only if the layout flips between wide and tall)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tall]);

  // the room's name plates step back while the letter is open (they return when it is put
  // aside, and as it closes)
  useEffect(() => {
    if (hidden || closing) return undefined;
    document.body.classList.add('sv-letter-open');
    return () => document.body.classList.remove('sv-letter-open');
  }, [hidden, closing]);

  // timers that must not outlive the letter
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => {
    if (!closing) return undefined;
    const t = setTimeout(() => cb.current.onClosed?.(), 480);
    return () => clearTimeout(t);
  }, [closing]);

  const choose = k => {
    if (choice || !canChoose) return;
    setChoice(k);
    const { seal, shadow } = stampKeyframes(L, k);
    bodyEl[k].current?.animate(seal, { duration: STAMP_MS, fill: 'forwards' });
    shadowEl[k].current?.animate(shadow, { duration: STAMP_MS, fill: 'forwards' });
    // the moment it strikes: the wax, a jolt through the letter, the vote
    later(() => {
      setSealed(true);
      joltEl.current?.animate([{ transform: 'translateY(3px)' }, { transform: 'translateY(0px)' }], { duration: 180, easing: 'ease-out' });
      cb.current.onVote?.(k);
    }, IMPACT_MS);
    later(() => setClosing(true), CLOSE_MS);
  };

  const { leaderName, teamNames, chapter, proposalNo, maxProposals } = letter;
  const last = proposalNo >= maxProposals;
  const full = stacked || rect.left === 0;
  const spotX = LETTER_W / 2, spotY = LETTER_H / 2 + SPOT_DY;
  const names = teamNames.length ? teamNames : ['—'];
  // smaller names for a long list, so they always clear the seal's place
  const nameSize = names.length >= 5 ? 26 : names.length === 4 ? 29 : 32;
  const cls = ['seal-vote', full ? 'is-full' : '', canChoose ? 'is-ready' : '',
    choice ? 'is-chosen' : '', closing ? 'is-closing' : '', hidden ? 'is-hidden' : ''].filter(Boolean).join(' ');
  const centre = onTable(L, 0, L.letterY);
  const letterFoot = onTable(L, 0, L.letterY + LETTER_H / 2).y;

  return createPortal(
    <div className={cls} role="region" aria-label="Council vote" data-hover={!choice && canChoose && hover ? hover : undefined}
      style={{ '--cx': `${stageX + centre.x * scale}px`, '--cy': `${stageY + centre.y * scale}px` }}>
      <div className="seal-vote__veil" />
      <p className="seal-vote__sr">
        Chapter {chapter}. {last ? 'Last proposal: if the council refuses, the Company wins.' : `Proposal ${proposalNo} of ${maxProposals}.`}
        {' '}{leaderName} proposes {listNames(teamNames)}.
      </p>

      <div className="sv-stage" style={{ width: L.w, height: L.h, transform: `translate(${stageX}px, ${stageY}px) scale(${scale})` }}>
        {/* the table: everything lying on it is tilted back together */}
        <div className="sv-table" style={{ left: L.ox, top: L.oy, transform: `perspective(${PERSP}px) rotateX(${TILT}rad)` }}>
          <img ref={flapInEl} className="sv-flap sv-flap--in" src={VOTE_IMAGES.flapInner} alt="" draggable="false"
            style={{ left: -ENV_W / 2, top: L.envFrom + ENV_H / 2, width: ENV_W, height: FLAP_D }} />
          <div ref={letterEl} className="sv-letter"
            style={{ left: -LETTER_W / 2, top: L.letterY - LETTER_H / 2, width: LETTER_W, height: LETTER_H }}>
            <div ref={joltEl} className="sv-letter__page">
              <img className="sv-letter__paper" src={VOTE_IMAGES.letter} alt="" draggable="false" />
              <div className="sv-letter__text" aria-hidden="true">
                <p className="sv-letter__chapter">Chapter {ROMAN[chapter - 1] || chapter}</p>
                {last
                  ? <p className="sv-letter__proposal is-last">Last proposal. If the council<br />refuses, the Company wins.</p>
                  : <p className="sv-letter__proposal">Proposal {proposalNo} of {maxProposals}</p>}
                <p className="sv-letter__rule"><span /></p>
                <p className="sv-letter__lead">{leaderName} proposes</p>
                <ul className="sv-letter__names">
                  {names.map((n, i) => (
                    <li key={`${n}-${i}`} style={{ fontSize: Math.min(nameSize, Math.floor(330 / (Math.max(4, [...n].length) * 0.8))) }}>{n}</li>
                  ))}
                </ul>
              </div>
              <i className="sv-letter__ring" style={{ left: spotX, top: spotY }} />
              {choice && (
                <img className={`sv-wax${sealed ? ' is-on' : ''}`} src={choice === 'YES' ? VOTE_IMAGES.waxYes : VOTE_IMAGES.waxNo} alt=""
                  draggable="false" style={{ left: spotX - WAX / 2, top: spotY - WAX / 2, width: WAX, height: WAX }} />
              )}
            </div>
          </div>
          <div ref={envEl} className="sv-env"
            style={{ left: -ENV_W / 2, top: L.envFrom - ENV_H / 2, width: ENV_W, height: ENV_H }}>
            <img className="sv-env__back" src={VOTE_IMAGES.envelope} alt="" draggable="false" />
            <img ref={flapOutEl} className="sv-flap sv-flap--out" src={VOTE_IMAGES.flapOuter} alt="" draggable="false"
              style={{ left: 0, top: ENV_H - FLAP_D, width: ENV_W, height: FLAP_D }} />
          </div>
          {KEYS.map(k => (
            <div key={k} ref={shadowEl[k]} className={`sv-shadow sv-shadow--${k.toLowerCase()}${choice && choice !== k ? ' is-unchosen' : ''}`}
              style={{ left: L.rest[k][0], top: L.rest[k][1] }}><span /></div>
          ))}
        </div>

        {KEYS.map(k => {
          const s = seals[k];
          const hitW = Math.max(170, s.body.width);
          const hitLeft = s.at.x - hitW / 2;
          return (
            <button key={k} type="button"
              className={`sv-seal sv-seal--${k.toLowerCase()}${choice === k ? ' is-chosen' : choice ? ' is-unchosen' : ''}`}
              style={{ left: hitLeft, top: s.body.top, width: hitW, height: s.labelY + 34 - s.body.top, '--away': `${Math.sign(L.rest[k][0]) * 16}px` }}
              disabled={!canChoose || !!choice} aria-label={`${NAME[k]} the team`} onClick={() => choose(k)}
              onPointerEnter={() => setHover(k)} onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(k)} onBlur={() => setHover(null)}>
              <span ref={bodyEl[k]} className="sv-seal__body"
                style={{ left: s.body.left - hitLeft, top: 0, width: s.body.width, height: s.body.height, transformOrigin: s.origin }}>
                <span className="sv-seal__lift" style={{ transformOrigin: s.origin }}>
                  <img className="sv-seal__img" src={k === 'YES' ? VOTE_IMAGES.sealYes : VOTE_IMAGES.sealNo} alt="" draggable="false" />
                </span>
              </span>
              <span className="sv-seal__name" style={{ top: s.labelY - s.body.top }}>{choice === k && sealed ? DONE[k] : NAME[k]}</span>
            </button>
          );
        })}
      </div>

      {onPeek && !choice && canChoose && (
        <button type="button" className="seal-vote__peek" onClick={onPeek}
          style={{ left: stageX + centre.x * scale, top: stageY + (tall ? L.h - 50 : Math.min(L.h - 30, letterFoot + 26)) * scale }}>
          View the table
        </button>
      )}
    </div>,
    document.body,
  );
}
