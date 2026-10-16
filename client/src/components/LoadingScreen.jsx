// POLASHI — Cinematic Loading Screen
// Full-screen: slowly zooming background (Ken Burns), ornate rotating seal,
// flickering status line. Shown while connecting to the server.

import { IMAGES } from '../assets/assetManifest';
import './LoadingScreen.css';

export default function LoadingScreen({ label = 'Entering the war tent' }) {
  return (
    <div className="loadscreen">
      {/* Ken Burns background — uses landing art if present, gradient otherwise */}
      <div
        className="loadscreen__bg"
        style={{ backgroundImage: `url(${IMAGES.LANDING_BG})` }}
      />
      <div className="loadscreen__tint" />
      <div className="loadscreen__vignette" />

      <div className="loadscreen__center">
        {/* Rotating double-ring seal with crossed swords */}
        <div className="loadscreen__seal">
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <g className="loadscreen__ring loadscreen__ring--outer">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#c9913a" strokeWidth="1.6"
                strokeDasharray="10 7" strokeLinecap="round"/>
            </g>
            <g className="loadscreen__ring loadscreen__ring--inner">
              <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(201,145,58,0.55)" strokeWidth="1"
                strokeDasharray="4 6" strokeLinecap="round"/>
            </g>
            <line x1="38" y1="38" x2="82" y2="82" stroke="#e8b84b" strokeWidth="2.6" strokeLinecap="round"/>
            <line x1="82" y1="38" x2="38" y2="82" stroke="#e8b84b" strokeWidth="2.6" strokeLinecap="round"/>
            <circle cx="60" cy="60" r="5" fill="#c9913a"/>
            <circle cx="60" cy="60" r="2.2" fill="#e8b84b"/>
          </svg>
        </div>
        <div className="loadscreen__title">Polashi</div>
        <div className="loadscreen__label">{label}<span className="loadscreen__dots"/></div>
      </div>
    </div>
  );
}
