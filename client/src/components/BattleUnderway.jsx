// POLASHI — Battle underway: the rain at Palashi
// Full screen for the players who wait while the team plays its cards. Zarif's painting of the
// field in silhouette, split in two: the storm sky (which drifts, with cloud shadows rolling over
// it and lightning behind the army) and the field (the war elephant, the guns, the camp and the
// regiments). Over it: heavy rain in curtains, splashing on the ground; smoke drifting; the fires
// flickering and throwing sparks; musket volleys and far guns along the lines. Every card played
// is one of the Nawab's guns at the front left firing: a boom, a blaze at the muzzle, a puff of
// smoke and a small jolt (no one learns anything new: the count of cards played was already shown).
// When the last card is in, the rain stops dead and the guns fall silent; then the result.
// It rained at Palashi: the Nawab's powder was soaked while the Company had covered theirs.
//
// No 3D: pictures moved by the browser (CSS) and one plain canvas for the rain, sparks and
// lightning, so ten tabs on one computer stay light (a tab in the background doesn't draw at all).
import { useEffect, useRef } from 'react';
import { SOUNDS } from '../assets/assetManifest';
import { playSfx, effectiveVolume } from '../hooks/useAudioStore';
import { RAIN_IMAGES } from './warRoomAssets';
import './BattleUnderway.css';

const ASPECT = 2048 / 1144;  // the painting
const LEAN = 0.22;           // the rain blows to the left, like the painted rain (horizontal per vertical)
const GROUND = 0.62;         // where the field begins (fraction of the painting's height), for the splashes
// Where things are in the painting (fractions of the picture)
const FIRES = [[0.405, 0.616, 1], [0.666, 0.752, 1.2], [0.753, 0.767, 1.1], [0.754, 0.832, 1.3]];   // x, y, size
const TENTS = [[0.042, 0.704], [0.211, 0.718], [0.36, 0.717]];
// far guns on the horizon (their flash is behind the army, so nothing in front is lit through)
const FAR_GUNS = [[0.335, 0.598], [0.365, 0.592], [0.615, 0.598], [0.69, 0.596], [0.763, 0.595], [0.83, 0.612], [0.9, 0.6], [0.24, 0.596]];
// musket lines on the right
const MUSKETS = [[0.595, 0.708], [0.64, 0.692], [0.7, 0.7], [0.803, 0.762], [0.85, 0.722], [0.92, 0.735], [0.62, 0.66]];
// the Nawab's guns at the front left whose blast stays well clear of the elephant
const MUZZLES = [[0.2, 0.70], [0.161, 0.811], [0.309, 0.698], [0.278, 0.885]];
const SMOKES = [[0.555, 0.42, 64], [0.655, 0.5, 78], [0.745, 0.36, 56]];   // top, width, seconds to cross

export default function BattleUnderway({ played = 0, total = 0, ending = false, needsTwo = false }) {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);
  const farRef = useRef(null);
  const nearRef = useRef(null);
  const boltRef = useRef(null);
  const shots = useRef(0);
  const raining = useRef(true);
  const ambience = useRef(null);
  const strike = useRef(null);          // the canvas draws a lightning bolt while this is set

  // ── The canvas: rain in curtains and drops, splashes on the field, sparks from the fires, bolts ──
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    let w = 0, h = 0, drops = [], raf = 0, last = 0, fade = 1, stoppedAt = 0;
    let splashes = [], sparks = [], splashDue = 0, sparkDue = 0;
    const curtains = [], offset = [0, 0, 0, 0];
    // three depths of drops: far (fine, slow), middle, near (long, fast, bright)
    const LAYERS = [
      { len: [9, 15], v: [820, 1050], width: 0.8, alpha: 0.2 },
      { len: [17, 27], v: [1150, 1450], width: 1.1, alpha: 0.3 },
      { len: [30, 48], v: [1600, 2000], width: 1.6, alpha: 0.42 },
    ];
    const stage = () => {                               // where the painting sits on the canvas
      const sw = Math.max(w, h * ASPECT), sh = Math.max(h, w / ASPECT);
      return { x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh };
    };
    const spawn = (anywhere) => {
      const r = Math.random();
      const L = LAYERS[r < 0.5 ? 0 : r < 0.83 ? 1 : 2];
      const len = L.len[0] + Math.random() * (L.len[1] - L.len[0]);
      return { L, len, v: L.v[0] + Math.random() * (L.v[1] - L.v[0]),
        x: Math.random() * (w + 280) - 40, y: anywhere ? Math.random() * h : -60 - Math.random() * h * 0.25 };
    };
    // the rain curtains: two tiled textures, slid down and to the left
    [RAIN_IMAGES.rainFar, RAIN_IMAGES.rainNear].forEach((src, i) => {
      const img = new Image();
      img.onload = () => { curtains[i] = ctx.createPattern(img, 'repeat'); };
      img.src = src;
    });
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = Array.from({ length: Math.min(1100, Math.round((w * h) / 2100)) }, () => spawn(true));
    };
    const drawBolt = (now) => {
      const b = strike.current;
      if (!b) return;
      const t = (now - b.at) / 260;
      if (t > 1) { strike.current = null; return; }
      const s = stage();
      ctx.save();
      ctx.globalAlpha = (t < 0.15 ? 1 : t < 0.3 ? 0.35 : t < 0.45 ? 0.85 : 1 - t) * 0.9;
      ctx.strokeStyle = '#e8eeff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(170, 190, 255, 0.9)'; ctx.shadowBlur = 14;
      for (const seg of b.paths) {
        ctx.lineWidth = seg.width;
        ctx.beginPath();
        seg.pts.forEach(([px, py], k) => {
          const X = s.x + px * s.w, Y = s.y + py * s.h;
          if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        });
        ctx.stroke();
      }
      ctx.restore();
    };
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      // stops dead: gone a third of a second after the last card, by the clock (however slow the frames)
      if (!raining.current) { stoppedAt = stoppedAt || now; fade = Math.max(0, 1 - (now - stoppedAt) / 320); }
      ctx.clearRect(0, 0, w, h);
      const s = stage();
      if (fade > 0) {
        // curtains: the far sheet slower and denser, the near sheet faster
        curtains.forEach((pat, i) => {
          if (!pat) return;
          const speed = i ? 1500 : 950;
          offset[i * 2] = (offset[i * 2] - speed * LEAN * dt) % 512;
          offset[i * 2 + 1] = (offset[i * 2 + 1] + speed * dt) % 512;
          ctx.save();
          ctx.globalAlpha = (i ? 0.55 : 0.75) * fade;
          ctx.translate(offset[i * 2], offset[i * 2 + 1]);
          ctx.fillStyle = pat;
          ctx.fillRect(-offset[i * 2], -offset[i * 2 + 1], w, h);
          ctx.restore();
        });
        // drops, one stroke per depth
        ctx.lineCap = 'round';
        for (const L of LAYERS) {
          ctx.strokeStyle = `rgba(190, 204, 230, ${L.alpha * fade})`;
          ctx.lineWidth = L.width;
          ctx.beginPath();
          for (const d of drops) {
            if (d.L !== L) continue;
            d.y += d.v * dt; d.x -= d.v * LEAN * dt;
            if (d.y - d.len > h || d.x + d.len * LEAN < -40) Object.assign(d, spawn(false));
            ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * LEAN, d.y - d.len);
          }
          ctx.stroke();
        }
        // splashes on the field: little rings that open and fade
        splashDue += dt * 90;
        const groundTop = Math.max(0, s.y + GROUND * s.h);
        while (splashDue >= 1 && groundTop < h) {
          splashDue -= 1;
          const y = groundTop + Math.pow(Math.random(), 0.7) * (h - groundTop);
          const near = (y - groundTop) / Math.max(1, h - groundTop);          // bigger closer to us
          splashes.push({ x: Math.random() * w, y, r: 2 + near * 7, t: 0 });
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        splashes = splashes.filter(sp => (sp.t += dt / 0.28) < 1);
        for (const sp of splashes) {
          const r = sp.r * (0.3 + sp.t);
          ctx.moveTo(sp.x + r, sp.y); ctx.ellipse(sp.x, sp.y, r, r * 0.32, 0, 0, Math.PI * 2);
        }
        ctx.strokeStyle = `rgba(200, 212, 236, ${0.32 * fade})`;
        ctx.stroke();
      } else { splashes = []; }
      // sparks rising from the fires, carried left by the wind (they keep going after the rain stops)
      sparkDue += dt * 16;
      while (sparkDue >= 1) {
        sparkDue -= 1;
        const [fx, fy, fs] = FIRES[Math.floor(Math.random() * FIRES.length)];
        sparks.push({ x: s.x + fx * s.w + (Math.random() - 0.5) * 14 * fs, y: s.y + fy * s.h - 6,
          vx: -18 - Math.random() * 40, vy: -45 - Math.random() * 70, t: 0, life: 1 + Math.random() * 1.6, size: 0.8 + Math.random() * 1.4 });
      }
      sparks = sparks.filter(p => (p.t += dt) < p.life);
      for (const p of sparks) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 12 * dt;
        const a = (1 - p.t / p.life) * (0.6 + 0.4 * Math.sin(p.t * 30 + p.x));
        ctx.fillStyle = `rgba(255, ${170 + Math.round(60 * (1 - p.t / p.life))}, 90, ${Math.max(0, a)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      drawBolt(now);
    };
    size();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);

  // ── Short flashes: a glowing spot that appears and fades ──
  const flashAt = (host, cls, x, y, keyframes, duration) => {
    if (!host) return;
    const g = document.createElement('div');
    g.className = cls;
    g.style.left = `${x * 100}%`; g.style.top = `${y * 100}%`;
    host.appendChild(g);
    const a = g.animate(keyframes, { duration, easing: 'ease-out' });
    a.onfinish = () => g.remove();
  };
  const pulse = (peak) => [{ opacity: 0 }, { opacity: peak, offset: 0.08 }, { opacity: 0 }];

  // far guns along the horizon, every few seconds (behind the army)
  const farGun = () => {
    const [x, y] = FAR_GUNS[Math.floor(Math.random() * FAR_GUNS.length)];
    flashAt(farRef.current, 'bu-glow', x + (Math.random() - 0.5) * 0.02, y, pulse(0.65 + Math.random() * 0.35), 700 + Math.random() * 600);
    flashRef.current?.animate(pulse(0.05), { duration: 600, easing: 'ease-out' });
  };
  // a ragged musket volley down the line on the right (in front)
  const volley = () => {
    const n = 3 + Math.floor(Math.random() * 4);
    const start = Math.floor(Math.random() * MUSKETS.length);
    for (let i = 0; i < n; i++) {
      const [x, y] = MUSKETS[(start + i) % MUSKETS.length];
      setTimeout(() => flashAt(nearRef.current, 'bu-spark', x + (Math.random() - 0.5) * 0.03, y + (Math.random() - 0.5) * 0.02,
        pulse(1), 160 + Math.random() * 120), i * (60 + Math.random() * 110));
    }
  };
  // lightning behind the army: the sky lights up and a bolt splits the clouds (thunder follows)
  const lightning = () => {
    const left = Math.random() < 0.5;                    // never over the elephant in the middle
    const x0 = left ? 0.08 + Math.random() * 0.26 : 0.64 + Math.random() * 0.3;
    const pts = [[x0, 0.02 + Math.random() * 0.06]];
    const yEnd = 0.36 + Math.random() * 0.1;
    while (pts[pts.length - 1][1] < yEnd) {
      const [px, py] = pts[pts.length - 1];
      pts.push([px + (Math.random() - 0.55) * 0.028, py + 0.018 + Math.random() * 0.03]);
    }
    const paths = [{ pts, width: 2.2 }];
    for (let k = 0; k < 2; k++) {                        // a couple of forks
      const from = pts[2 + Math.floor(Math.random() * Math.max(1, pts.length - 4))];
      const fork = [from];
      for (let j = 0; j < 4; j++) {
        const [px, py] = fork[fork.length - 1];
        fork.push([px + (Math.random() - 0.3) * 0.03 * (left ? -1 : 1), py + 0.016 + Math.random() * 0.02]);
      }
      paths.push({ pts: fork, width: 1.1 });
    }
    strike.current = { at: performance.now(), paths };
    const host = boltRef.current;
    if (host) {
      host.style.setProperty('--bx', `${x0 * 100}%`);
      host.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.06 }, { opacity: 0.2, offset: 0.2 }, { opacity: 0.7, offset: 0.32 }, { opacity: 0 }],
        { duration: 900, easing: 'ease-out' });
    }
    setTimeout(() => playSfx(SOUNDS.THUNDER, effectiveVolume('sfx') * 0.7), 700 + Math.random() * 900);
  };

  // the background of the battle, until the field falls silent
  useEffect(() => {
    if (ending) return undefined;
    const timers = [];
    const loop = (fn, min, spread) => {
      const next = () => { timers.push(setTimeout(() => { fn(); next(); }, min + Math.random() * spread)); };
      next();
    };
    loop(farGun, 900, 2200);
    loop(volley, 1800, 3200);
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) loop(lightning, 6000, 9000);
    return () => timers.forEach(clearTimeout);
  }, [ending]);

  // every card played: one of the front guns fires; a boom, a blaze, smoke, and a small jolt
  const seen = useRef(played);
  useEffect(() => {
    if (played > seen.current && !ending) {
      playSfx(SOUNDS.CANNON_BOOM, effectiveVolume('sfx'));
      const [x, y] = MUZZLES[shots.current++ % MUZZLES.length];
      flashAt(nearRef.current, 'bu-glow bu-glow--near', x, y, pulse(0.9), 1100);
      flashAt(nearRef.current, 'bu-muzzle', x, y,
        [{ opacity: 0, transform: 'translate(-20%, -50%) rotate(-24deg) scale(0.6)' }, { opacity: 1, transform: 'translate(-20%, -50%) rotate(-24deg) scale(1)', offset: 0.12 },
         { opacity: 0, transform: 'translate(-20%, -50%) rotate(-24deg) scale(1.3)' }], 420);
      flashAt(nearRef.current, 'bu-puff', x + 0.02, y - 0.02,
        [{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' }, { opacity: 0.85, transform: 'translate(-50%, -50%) scale(0.7)', offset: 0.12 },
         { opacity: 0, transform: 'translate(-80%, -70%) scale(1.6)' }], 2600);
      flashRef.current?.animate(pulse(0.22), { duration: 900, easing: 'ease-out' });
      sceneRef.current?.animate([
        { transform: 'translate(0, 0)' }, { transform: 'translate(-2px, 1.5px)' }, { transform: 'translate(1.5px, -1px)' },
        { transform: 'translate(-0.8px, 0.5px)' }, { transform: 'translate(0, 0)' },
      ], { duration: 360, easing: 'ease-out' });
    }
    seen.current = played;
  }, [played, ending]);

  // the sound of the battle (and of the rain) while it lasts; silence at the end
  const stopAmbience = () => {
    const a = ambience.current;
    if (a) { a.pause(); a.currentTime = 0; a.loop = false; ambience.current = null; }
  };
  useEffect(() => {
    const a = playSfx(SOUNDS.CLASH_AMBIENCE, effectiveVolume('sfx') * 0.6);
    if (a) { a.loop = true; ambience.current = a; }
    return stopAmbience;
  }, []);
  useEffect(() => {
    if (ending) { raining.current = false; stopAmbience(); }
  }, [ending]);

  // the war room behind is completely covered, so it rests until the scene starts to fade away
  useEffect(() => {
    document.body.classList.add('bu-open');
    return () => document.body.classList.remove('bu-open');
  }, []);
  useEffect(() => {
    if (!ending) return undefined;
    const t = setTimeout(() => document.body.classList.remove('bu-open'), 1150);   // just before the fade
    return () => clearTimeout(t);
  }, [ending]);

  const remaining = Math.max(0, total - played);
  return (
    <div className={`bu-overlay${ending ? ' is-ending' : ''}`} role="status" aria-live="polite">
      <div className="bu-scene" ref={sceneRef}>
        {/* Zarif's painting, cut to fill any screen like a cover photo (the elephant stays in the middle) */}
        <div className="bu-stage">
          <img className="bu-sky" src={RAIN_IMAGES.sky} alt="" draggable="false" />
          <div className="bu-clouds" style={{ backgroundImage: `url(${RAIN_IMAGES.clouds})` }} />
          <div className="bu-lightning" ref={boltRef} />
          <div className="bu-far" ref={farRef} />
          <img className="bu-field" src={RAIN_IMAGES.field} alt="" draggable="false" />
          {FIRES.map(([x, y, s], i) => (
            <span key={'f' + i} className="bu-fire" style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--s': s, animationDelay: `${-i * 0.37}s` }} />
          ))}
          {TENTS.map(([x, y], i) => (
            <span key={'t' + i} className="bu-fire bu-fire--tent" style={{ left: `${x * 100}%`, top: `${y * 100}%`, animationDelay: `${-i * 0.61}s` }} />
          ))}
          {SMOKES.map(([top, width, secs], i) => (
            <div key={'s' + i} className="bu-smoke"
              style={{ top: `${top * 100}%`, width: `${width * 100}%`, backgroundImage: `url(${RAIN_IMAGES.smoke[i % RAIN_IMAGES.smoke.length]})`,
                '--travel': `${-(1 / width + 1) * 100}%`, animationDuration: `${secs}s`, animationDelay: `${-secs * (0.2 + i * 0.3)}s` }} />
          ))}
          <div className="bu-near" ref={nearRef} />
        </div>
        <canvas className="bu-rain" ref={canvasRef} />
      </div>
      <div className="bu-flash" ref={flashRef} />
      <div className="bu-text">
        <h2 className="bu-title">The battle is underway</h2>
        <p className="bu-count">
          {ending ? 'The guns fall silent.' : `${remaining} card${remaining !== 1 ? 's' : ''} remaining`}
        </p>
        {needsTwo && !ending && <p className="bu-note">It takes two Betray cards to sabotage this chapter.</p>}
      </div>
    </div>
  );
}
