// POLASHI — Sound Manager (SFX channel)
import { useRef, useEffect } from 'react';
import { playSfx } from './useAudioStore';

export function useSound() {
  const currentAmbience = useRef(null);

  const play = (src, { loop = false, volume } = {}) => {
    if (!src) return;
    try {
      const audio = playSfx(src, volume);
      if (audio) { audio.loop = loop; }
      if (loop) currentAmbience.current = audio;
      return audio;
    } catch {}
  };

  const stop = (src) => {
    if (!src) return;
    try {
      // find from sfxCache via playSfx with volume 0 trick — just pause directly
      const a = new Audio(); // dummy fallback
    } catch {}
  };

  const stopAmbience = () => {
    if (currentAmbience.current) {
      currentAmbience.current.pause();
      currentAmbience.current.currentTime = 0;
      currentAmbience.current = null;
    }
  };

  useEffect(() => () => stopAmbience(), []);
  return { play, stop, stopAmbience };
}

// One-shot SFX helper
export function playSound(src, options = {}) {
  return playSfx(src, options.volume);
}
