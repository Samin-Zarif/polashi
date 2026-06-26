// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Global Audio Store
// Single source of truth for all volume levels.
// All sound playback reads from here so sliders affect everything instantly.
// ─────────────────────────────────────────────────────────────────────────────

// Global volume state — plain object so it works outside React
const audioState = {
  master: 0.8,   // multiplier applied to everything
  music:  0.4,   // background music
  sfx:    0.75,  // vote clicks, mission cards, etc.
  // subscribers
  _listeners: [],
};

export function getVolumes() {
  return {
    master: audioState.master,
    music:  audioState.music,
    sfx:    audioState.sfx,
  };
}

export function setVolume(channel, value) {
  const v = Math.max(0, Math.min(1, value));
  audioState[channel] = v;

  // Apply immediately
  if (channel === 'master' || channel === 'music') {
    applyMusicVolume();
  }

  // Persist to localStorage
  try {
    localStorage.setItem('polashi_volumes', JSON.stringify({
      master: audioState.master,
      music:  audioState.music,
      sfx:    audioState.sfx,
    }));
  } catch {}

  // Notify React subscribers
  audioState._listeners.forEach(fn => fn({ ...getVolumes() }));
}

export function loadSavedVolumes() {
  try {
    const saved = JSON.parse(localStorage.getItem('polashi_volumes') || '{}');
    if (saved.master !== undefined) audioState.master = saved.master;
    if (saved.music  !== undefined) audioState.music  = saved.music;
    if (saved.sfx    !== undefined) audioState.sfx    = saved.sfx;
  } catch {}
}

export function subscribe(fn) {
  audioState._listeners.push(fn);
  return () => { audioState._listeners = audioState._listeners.filter(f => f !== fn); };
}

// Effective volume = channel * master
export function effectiveVolume(channel) {
  return audioState[channel] * audioState.master;
}

// ── Music control ─────────────────────────────────────────────────────────────
let bgAudio = null;
let bgStarted = false;

export function startBackgroundMusic() {
  if (bgStarted) return;
  bgStarted = true;
  loadSavedVolumes();
  try {
    bgAudio = new Audio('/assets/sounds/bg-music.mp3');
    bgAudio.loop   = true;
    bgAudio.volume = effectiveVolume('music');
    bgAudio.play().catch(() => {});
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
