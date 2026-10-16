// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — War room: loading and early download
// Kept apart from WarTable3D so screens can start downloading the room early (lobby,
// role reveal) and the war tent opens ready. The 3D part (three.js and the statue files)
// is a separate download, fetched only when the room is needed.
// ─────────────────────────────────────────────────────────────────────────────
import { WAR_ROOM } from '../data/warRoom';

// One download per picture, shared by everyone who asks for it.
const images = new Map();
export function loadImage(url) {
  if (!images.has(url)) {
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        // decode() finishes the JPEG decoding off the main thread, so the first frame doesn't stutter
        const done = () => resolve(img);
        if (img.decode) img.decode().then(done, done); else done();
      };
      img.onerror = () => { images.delete(url); reject(new Error('Could not load ' + url)); };
      img.src = url;
    });
    images.set(url, p);
  }
  return images.get(url);
}

// The 3D room code (three.js), downloaded once on first use.
let scene3D = null;
export function loadWarRoom3D() {
  if (!scene3D) {
    scene3D = import('./warRoom3D.js');
    scene3D.catch(() => { scene3D = null; });
  }
  return scene3D;
}

// The council vote's pictures: the seals and the wax (rendered from Zarif's 3D seal models),
// the letter and the envelope. Small (about 130 KB together) and fetched early, so the letter
// appears at once.
const VOTE_DIR = '/assets/images/vote/';
export const VOTE_IMAGES = {
  sealYes: VOTE_DIR + 'seal-approve.webp', sealNo: VOTE_DIR + 'seal-reject.webp',
  waxYes: VOTE_DIR + 'wax-approve.webp', waxNo: VOTE_DIR + 'wax-reject.webp',
  letter: VOTE_DIR + 'letter.webp', envelope: VOTE_DIR + 'envelope.webp',
  flapOuter: VOTE_DIR + 'flap-outer.webp', flapInner: VOTE_DIR + 'flap-inner.webp',
};
let votePreloaded = false;
export function preloadVoteImages() {
  if (votePreloaded) return;
  votePreloaded = true;
  Object.values(VOTE_IMAGES).forEach(url => loadImage(url).catch(() => {}));
}

// The rain at Palashi (the full-screen battle while the team plays its cards): Zarif's painting of
// the field in silhouette, split into its sky and its field so the clouds can move, plus the rain
// curtains, cloud shadows and smoke laid over it (about 300 KB together). Fetched early so the
// scene is ready when it opens.
const BATTLE_DIR = '/assets/images/battle/';
export const RAIN_IMAGES = {
  sky: BATTLE_DIR + 'battle-sky.webp', field: BATTLE_DIR + 'battle-field.webp', clouds: BATTLE_DIR + 'battle-clouds.webp',
  rainFar: BATTLE_DIR + 'rain-far.webp', rainNear: BATTLE_DIR + 'rain-near.webp',
  smoke: [BATTLE_DIR + 'smoke-0.webp', BATTLE_DIR + 'smoke-1.webp', BATTLE_DIR + 'smoke-2.webp'],
};
let rainPreloaded = false;
export function preloadRainImages() {
  if (rainPreloaded) return;
  rainPreloaded = true;
  Object.values(RAIN_IMAGES).flat().forEach(url => loadImage(url).catch(() => {}));
}

// True when this browser can draw the 3D room (WebGL 2).
let canDraw = null;
export function canDrawWarRoom() {
  if (canDraw === null) {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      canDraw = !!gl;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      canDraw = false;
    }
  }
  return canDraw;
}

// Start downloading the room (from the lobby / role reveal).
export function preloadWarRoom() {
  preloadVoteImages();                 // the vote's pictures are needed with or without 3D
  preloadRainImages();                 // and so is the rain at Palashi
  if (!canDrawWarRoom()) return;
  loadImage(WAR_ROOM.image).catch(() => {});
  loadWarRoom3D().then(m => m.preloadModels()).catch(() => {});
}

// Which statue a player sits as: 'A' bearded with a pagri, 'B' clean-shaven, or 'W' the woman.
// Each player chooses in the lobby, before any role is dealt, so a statue says nothing about
// anyone's role (it is cosmetic only).
export const STATUES = [
  { key: 'A', label: 'Turban',    image: '/assets/images/statues/statue-a.webp' },
  { key: 'B', label: 'Bare head', image: '/assets/images/statues/statue-b.webp' },
  { key: 'W', label: 'Queen',     image: '/assets/images/statues/statue-w.webp' },
];
export function statueLook(player) {
  const look = player?.look;
  if (look === 'A' || look === 'B' || look === 'W') return look;
  if (look === 1) return 'A';            // an older server: a coin toss, 1 or 0
  if (look === 0) return 'B';
  // no look at all: a fixed pick from the player's id
  let h = 0;
  for (const ch of String(player?.id || '')) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (h >>> 0) % 2 ? 'A' : 'B';
}
