// POLASHI — Cinematic Text Reveal
// Segments appear one by one with 1.5s delays, fading in from below.

import { useState, useEffect } from 'react';
import './CinematicText.css';

export default function CinematicText({ segments, className = '' }) {
  const [visible, setVisible] = useState(0); // how many segments shown so far

  useEffect(() => {
    setVisible(0);
    if (!segments || segments.length === 0) return;

    // Reveal first segment immediately, then one every 2s
    const timers = segments.map((_, i) => {
      return setTimeout(() => {
        setVisible(i + 1);
      }, i * 2000);
    });

    return () => timers.forEach(clearTimeout);
  }, [segments]);

  if (!segments || segments.length === 0) return null;

  return (
    <div className={`cinematic-text ${className}`}>
      {segments.map((seg, i) => {
        const text    = typeof seg === 'object' ? seg.text : seg;
        const isRed   = typeof seg === 'object' && seg.red;
        const shown   = i < visible;
        return (
          <span
            key={i}
            className={`cinematic-text__seg ${shown ? 'visible' : ''} ${isRed ? 'red' : ''}`}
            style={{ transitionDelay: '0ms' }} // delay handled by timeout, not CSS
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
