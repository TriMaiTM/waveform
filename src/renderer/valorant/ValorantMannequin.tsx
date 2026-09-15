import React from 'react'

interface ValorantMannequinProps {
  headDamage: number;
  bodyDamage: number;
  legDamage: number;
  rangeText?: string;
}

export default function ValorantMannequin({ headDamage, bodyDamage, legDamage, rangeText }: ValorantMannequinProps) {
  // Format damage nicely
  const fmt = (val: number) => {
    if (!val && val !== 0) return '—';
    return Number.isInteger(val) ? String(val) : val.toFixed(1);
  };

  return (
    <div className="val-mannequin-container">
      {rangeText && (
        <div className="val-mannequin-range-badge">
          <span>KHOẢNG CÁCH:</span> <strong>{rangeText}</strong>
        </div>
      )}

      <div className="val-mannequin-stage">
        {/* Technical Target Grid Overlay */}
        <div className="val-mannequin-grid-bg" />

        <svg 
          className="val-mannequin-svg" 
          viewBox="0 0 260 360" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Target Silhouette Definition */}
          {/* HEAD ZONE */}
          <g className="val-dummy-part val-dummy-head">
            <path
              d="M130 35 C118 35 110 44 110 58 C110 74 117 88 130 90 C143 88 150 74 150 58 C150 44 142 35 130 35 Z"
              fill="rgba(255, 70, 85, 0.25)"
              stroke="#ff4655"
              strokeWidth="2"
            />
            {/* Head Crosshair */}
            <circle cx="130" cy="62" r="5" fill="none" stroke="#ff4655" strokeWidth="1.5" />
            <line x1="130" y1="52" x2="130" y2="72" stroke="#ff4655" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="120" y1="62" x2="140" y2="62" stroke="#ff4655" strokeWidth="1" strokeDasharray="2 2" />
          </g>

          {/* NECK */}
          <rect x="125" y="90" width="10" height="10" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1.5" />

          {/* BODY / TORSO & ARMS ZONE */}
          <g className="val-dummy-part val-dummy-body">
            {/* Torso */}
            <path
              d="M105 100 L155 100 L150 185 L110 185 Z"
              fill="rgba(0, 240, 255, 0.2)"
              stroke="#00f0ff"
              strokeWidth="2"
            />
            {/* Left Arm */}
            <path
              d="M102 102 L80 160 L92 165 L108 120 Z"
              fill="rgba(0, 240, 255, 0.15)"
              stroke="#00f0ff"
              strokeWidth="1.5"
            />
            {/* Right Arm */}
            <path
              d="M158 102 L180 160 L168 165 L152 120 Z"
              fill="rgba(0, 240, 255, 0.15)"
              stroke="#00f0ff"
              strokeWidth="1.5"
            />
            {/* Center chest target crosshair */}
            <circle cx="130" cy="135" r="7" fill="none" stroke="#00f0ff" strokeWidth="1.5" />
            <line x1="130" y1="120" x2="130" y2="150" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="115" y1="135" x2="145" y2="135" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" />
          </g>

          {/* PELVIS / GROIN */}
          <path
            d="M110 185 L150 185 L144 212 L116 212 Z"
            fill="rgba(0, 240, 255, 0.18)"
            stroke="#00f0ff"
            strokeWidth="1.5"
          />

          {/* LEGS ZONE */}
          <g className="val-dummy-part val-dummy-legs">
            {/* Left Leg */}
            <path
              d="M116 212 L106 315 L122 315 L128 212 Z"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Right Leg */}
            <path
              d="M144 212 L154 315 L138 315 L132 212 Z"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Feet */}
            <path d="M102 315 L122 315 L120 326 L98 326 Z" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M158 315 L138 315 L140 326 L162 326 Z" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="1.5" />
          </g>

          {/* CALLOUT LINES (TECHNICAL POINTERS) */}
          {/* Head Pointer Line */}
          <polyline points="150,62 185,62 205,62" stroke="#ff4655" strokeWidth="1.5" />
          <circle cx="205" cy="62" r="3" fill="#ff4655" />

          {/* Body Pointer Line */}
          <polyline points="150,135 185,135 205,135" stroke="#00f0ff" strokeWidth="1.5" />
          <circle cx="205" cy="135" r="3" fill="#00f0ff" />

          {/* Leg Pointer Line */}
          <polyline points="144,260 185,260 205,260" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="205" cy="260" r="3" fill="#38bdf8" />
        </svg>

        {/* FLOATING DAMAGE LABELS (CHAMFERED TACTICAL TAGS) */}
        <div className="val-dummy-callout val-callout-head">
          <div className="val-callout-zone">HEAD</div>
          <div className="val-callout-val head">{fmt(headDamage)}</div>
          <div className="val-callout-sub">Sát thương đầu</div>
        </div>

        <div className="val-dummy-callout val-callout-body">
          <div className="val-callout-zone">BODY</div>
          <div className="val-callout-val body">{fmt(bodyDamage)}</div>
          <div className="val-callout-sub">Sát thương thân</div>
        </div>

        <div className="val-dummy-callout val-callout-legs">
          <div className="val-callout-zone">LEGS</div>
          <div className="val-callout-val legs">{fmt(legDamage)}</div>
          <div className="val-callout-sub">Sát thương chân</div>
        </div>
      </div>
    </div>
  );
}
