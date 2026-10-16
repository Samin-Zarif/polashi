// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Global Audio Store
// Single source of truth for all volume levels.
// All sound playback reads from here so sliders affect everything instantly.
// ─────────────────────────────────────────────────────────────────────────────

// Until the player moves the music slider, the music follows the game: at a normal level from
// the first page through the card and night screens, then quietly (5%) once the war tent opens.
const MUSIC_FULL  = 0.4;
const MUSIC_QUIET = 0.05;

// Global volume state — plain object so it works outside React
const audioState = {
  master: 1.0,         // multiplier applied to everything
  music:  MUSIC_FULL,  // background music
  sfx:    0.75,        // vote clicks, mission cards, etc.
  musicChosen: false,  // true once the player has set the music slider themselves
  // subscribers
  _listeners: [],
};
// v3: the music follows the game until the player picks a level; older saved settings are not carried over
const STORE_KEY = 'polashi_volumes_v3';
let fadeTimer = null;   // the running fade between the two levels

export function getVolumes() {
  return {
    master: audioState.master,
    music:  audioState.music,
    sfx:    audioState.sfx,
  };
}

function notify() {
  audioState._listeners.forEach(fn => fn({ ...getVolumes() }));
}

export function setVolume(channel, value) {
  const v = Math.max(0, Math.min(1, value));
  audioState[channel] = v;
  if (channel === 'music') {
    audioState.musicChosen = true;   // the player's level now holds everywhere
    clearInterval(fadeTimer);
  }

  // Apply immediately
  if (channel === 'master' || channel === 'music') {
    applyMusicVolume();
  }

  // Persist to localStorage
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      master: audioState.master,
      music:  audioState.music,
      sfx:    audioState.sfx,
      musicChosen: audioState.musicChosen,
    }));
  } catch {}

  notify();
}

export function loadSavedVolumes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (saved.master !== undefined) audioState.master = saved.master;
    if (saved.sfx    !== undefined) audioState.sfx    = saved.sfx;
    if (saved.musicChosen && saved.music !== undefined) {
      audioState.music = saved.music;
      audioState.musicChosen = true;
    }
  } catch {}
}

// Where the game is sets the music level, unless the player has chosen one: 'full' before
// the war tent, 'quiet' in it. The change fades over two seconds.
export function setMusicScene(scene) {
  if (audioState.musicChosen) return;
  const target = scene === 'quiet' ? MUSIC_QUIET : MUSIC_FULL;
  const start = audioState.music;
  if (Math.abs(target - start) < 0.001) return;
  clearInterval(fadeTimer);
  const t0 = Date.now();
  fadeTimer = setInterval(() => {
    const k = Math.min(1, (Date.now() - t0) / 2000);   // by the clock, so a busy page still ends on time
    audioState.music = start + (target - start) * k;
    applyMusicVolume();
    notify();
    if (k >= 1) clearInterval(fadeTimer);
  }, 50);
}

export function subscribe(fn) {
  audioState._listeners.push(fn);
  return () => { audioState._listeners = audioState._listeners.filter(f => f !== fn); };
}

// Effective volume = channel * master
export function effectiveVolume(channel) {
  return audioState[channel] * audioState.master;
}

// the player's saved levels apply from the start (the sliders show them before any music plays)
loadSavedVolumes();

// ── Music control ─────────────────────────────────────────────────────────────
let bgAudio = null;
let waitingForClick = false;

// Starts the background music (once; later calls do nothing while it plays). Browsers only
// allow sound after the player has clicked or typed on the page, so if it is blocked it
// starts at the next click or key press instead.
export function startBackgroundMusic() {
  try {
    if (!bgAudio) {
      bgAudio = new Audio('/assets/sounds/bg-music.mp3');
      bgAudio.loop = true;
      bgAudio.preload = 'auto';
    }
    bgAudio.volume = Math.max(0, Math.min(1, effectiveVolume('music')));
    if (!bgAudio.paused) return;
    bgAudio.play().catch(() => {
      if (waitingForClick) return;
      waitingForClick = true;
      const retry = () => {
        waitingForClick = false;
        window.removeEventListener('pointerdown', retry);
        window.removeEventListener('keydown', retry);
        startBackgroundMusic();
      };
      window.addEventListener('pointerdown', retry);
      window.addEventListener('keydown', retry);
    });
  } catch {}
}

export function applyMusicVolume() {
  if (bgAudio) bgAudio.volume = Math.max(0, Math.min(1, effectiveVolume('music')));
}

// ── SFX playback (respects master + sfx volumes) ─────────────────────────────
const sfxCache = {};

export function playSfx(src, overrideVolume) {
  if (!src) return;
  try {
    if (!sfxCache[src]) sfxCache[src] = new Audio(src);
    const audio = sfxCache[src];
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, overrideVolume ?? effectiveVolume('sfx')));
    audio.play().catch(() => {});
    return audio;
  } catch {}
}
