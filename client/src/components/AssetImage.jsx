// ─────────────────────────────────────────────────────────────────────────────
// POLASHI — Asset Image Component
// Shows the image if the file exists, falls back to a styled placeholder.
// Drop your image file in and it appears automatically — no code changes needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

/**
 * <AssetImage src={IMAGES.ROLES.MIR_MODON} alt="Mir Modon" fallback="👁" />
 *
 * Props:
 *   src       — path from assetManifest.js
 *   alt       — alt text
 *   fallback  — text/emoji shown when image is missing
 *   className — extra CSS class
 *   style     — inline styles
 */
export function AssetImage({ src, alt = '', fallback = '', className = '', style = {} }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span
        className={`asset-fallback ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          opacity: 0.6,
          userSelect: 'none',
          ...style,
        }}
        aria-label={alt}
      >
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

/**
 * <BackgroundImage src={IMAGES.LANDING_BG} className="landing__bg" />
 *
 * Renders as a div with background-image. Falls back to transparent (CSS handles the gradient).
 */
export function BackgroundImage({ src, className = '', children, style = {} }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Preload the image
  if (src && !loaded && !failed) {
    const img = new Image();
    img.onload  = () => setLoaded(true);
    img.onerror = () => setFailed(true);
    img.src = src;
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        ...(loaded && !failed ? {
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}),
      }}
    >
      {children}
    </div>
  );
}
