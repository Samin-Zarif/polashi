// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Settings Panel (Audio Controls)
// Three Palashi-themed sliders: Master, Music, SFX
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getVolumes, setVolume, subscribe } from '../hooks/useAudioStore';
import './SettingsPanel.css';

function VolumeSlider({ label, icon, channel, volumes, onChange }) {
  const value = volumes[channel];
  const pct   = Math.round(value * 100);

  return (
    <div className="settings-slider">
      <div className="settings-slider__header">
        <span className="settings-slider__icon">{icon}</span>
        <span className="settings-slider__label">{label}</span>
        <span className="settings-slider__value">{pct}%</span>
      </div>

      <div className="settings-slider__track-wrap">
        {/* Filled portion of track */}
        <div
          className="settings-slider__fill"
          style={{ width: `${pct}%` }}
        />
        {/* The actual range input — invisible but handles interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={pct}
          onChange={e => onChange(channel, e.target.value / 100)}
          className="settings-slider__input"
          aria-label={label}
        />
        {/* Palashi-themed thumb — a crossed swords medallion */}
        <div
          className="settings-slider__thumb"
          style={{ left: `${pct}%` }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer circle */}
            <circle cx="12" cy="12" r="11" fill="#1a1510" stroke="#c9913a" strokeWidth="1.5"/>
            {/* Left sword */}
            <line x1="5" y1="19" x2="19" y2="5" stroke="#c9913a" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Right sword */}
            <line x1="19" y1="19" x2="5" y2="5" stroke="#c9913a" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Centre gem */}
            <circle cx="12" cy="12" r="2.5" fill="#c9913a"/>
            <circle cx="12" cy="12" r="1.2" fill="#e8b84b"/>
            {/* Guard marks */}
            <line x1="8"  y1="12" x2="16" y2="12" stroke="#7a5a1f" strokeWidth="1" strokeLinecap="round"/>
            <line x1="12" y1="8"  x2="12" y2="16" stroke="#7a5a1f" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Tick marks */}
      <div className="settings-slider__ticks">
        {[0, 25, 50, 75, 100].map(t => (
          <span key={t} className={`settings-slider__tick ${pct >= t ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default function SettingsPanel({ onClose }) {
  const [volumes, setVolumes] = useState(getVolumes());

  // Subscribe to external volume changes
  useEffect(() => {
    const unsub = subscribe(v => setVolumes(v));
    return unsub;
  }, []);

  const handleChange = (channel, value) => {
    setVolume(channel, value);
    setVolumes(getVolumes());
  };

  return (
    <>
      {/* Backdrop */}
      <div className="settings-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="settings-panel animate-scale">
        {/* Header */}
        <div className="settings-panel__header">
          <div className="settings-panel__title-row">
            <div className="settings-panel__ornament">&#9830;</div>
            <h3 className="settings-panel__title">War Tent Settings</h3>
            <div className="settings-panel__ornament">&#9830;</div>
          </div>
          <div className="settings-panel__subtitle">Audio Controls</div>
        </div>

        {/* Sliders */}
        <div className="settings-panel__body">
          <VolumeSlider
            label="Master Volume"
            icon="&#9836;"
            channel="master"
            volumes={volumes}
            onChange={handleChange}
          />
          <div className="settings-panel__divider" />
          <VolumeSlider
            label="Background Music"
            icon="&#9835;"
            channel="music"
            volumes={volumes}
            onChange={handleChange}
          />
          <div className="settings-panel__divider" />
          <VolumeSlider
            label="Sound Effects"
            icon="&#9881;"
            channel="sfx"
            volumes={volumes}
            onChange={handleChange}
          />
        </div>

        {/* Footer */}
        <div className="settings-panel__footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
