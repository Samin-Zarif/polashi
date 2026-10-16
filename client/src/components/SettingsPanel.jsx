// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Sound settings
// Three sliders (everything, music, sound effects) in the war room's style: dark smoked
// panel, antique-brass accents, Cinzel capitals. Changes apply at once and are remembered.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { getVolumes, setVolume, subscribe } from '../hooks/useAudioStore';
import './SettingsPanel.css';

function VolumeSlider({ label, channel, volumes, onChange, autoFocus }) {
  const pct = Math.round(volumes[channel] * 100);
  const id = `sound-${channel}`;
  return (
    <div className="sound-row">
      <div className="sound-row__head">
        <label className="sound-row__label" htmlFor={id}>{label}</label>
        <span className="sound-row__value">{pct}%</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={pct}
        autoFocus={autoFocus}
        onChange={e => onChange(channel, Number(e.target.value) / 100)}
        className="sound-row__slider"
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  );
}

export default function SettingsPanel({ onClose }) {
  const [volumes, setVolumes] = useState(getVolumes());
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // follow changes made elsewhere, and close with Escape
  useEffect(() => subscribe(v => setVolumes(v)), []);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleChange = (channel, value) => {
    setVolume(channel, value);
    setVolumes(getVolumes());
  };

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      {/* the layer centres the panel, so the panel's own entrance animation can't move it */}
      <div className="settings-layer">
        <div className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <h3 className="settings-panel__title" id="settings-title">Sound</h3>
          <div className="settings-panel__rows">
            <VolumeSlider label="Everything" channel="master" volumes={volumes} onChange={handleChange} autoFocus />
            <VolumeSlider label="Music" channel="music" volumes={volumes} onChange={handleChange} />
            <VolumeSlider label="Sound effects" channel="sfx" volumes={volumes} onChange={handleChange} />
          </div>
          <div className="settings-panel__footer">
            <button type="button" className="settings-panel__done" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </>
  );
}
