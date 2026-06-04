'use client'

const HERO_ICON_POSITIONS = [
  { x: 360, y: 106, side: 'left', line: 'top' },
  { x: 360, y: 140, side: 'left', line: 'upper' },
  { x: 360, y: 225, side: 'left', line: 'bottom' },
  { x: 1155, y: 106, side: 'right', line: 'top' },
  { x: 1155, y: 194, side: 'right', line: 'lower' },
  { x: 1155, y: 225, side: 'right', line: 'bottom' },
]

function HeroLineIcon({ x, y }) {
  return (
    <g className="hero-line-icon" transform={`translate(${x}, ${y})`} filter="url(#hero-icon-shadow)">
      <circle r="14" fill="#FF9B7A" stroke="#FFC7A8" strokeWidth="2" />
      <g fill="white" stroke="none">
        <path d="M-8-8h16v16H-8z M-8-5h16v2H-8z M-8 5h16v2H-8z" />
      </g>
    </g>
  )
}

export default function HeroLines() {
  return (
    <svg
      className="w-full h-auto min-w-0 object-contain scale-110 lines-svg"
      viewBox="0 0 1515 334"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id="hero-line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hero-icon-shadow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#E85D2E" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Base lines — always fully visible */}
      <path
        className="hero-line-base"
        d="M54 0.930664C616.85 222.415 932.185 221.771 1494 0.930664"
        stroke="#FFC7A8"
        strokeWidth="2"
      />
      <path
        className="hero-line-base"
        d="M54 332.431C616.85 111.443 932.185 112.085 1494 332.431"
        stroke="#FFC7A8"
        strokeWidth="2"
      />
      <line className="hero-line-base" y1="166.931" x2="1515" y2="166.931" stroke="#FFC7A8" strokeWidth="2" />
      <path
        className="hero-line-base"
        d="M49 242.931C611.839 142.179 927.172 143.685 1489 242.931"
        stroke="#FFC7A8"
        strokeWidth="2"
      />
      <path
        className="hero-line-base"
        d="M49 91.9307C611.839 192.682 927.172 191.176 1489 91.9307"
        stroke="#FFC7A8"
        strokeWidth="2"
      />
      {/* Glow — expands from center outward */}
      <path
        className="hero-line-glow hero-line-glow-0"
        d="M54 0.930664C616.85 222.415 932.185 221.771 1494 0.930664"
        stroke="#FF9B7A"
        strokeWidth="4"
        filter="url(#hero-line-glow)"
        pathLength="1000"
      />
      <path
        className="hero-line-glow hero-line-glow-1"
        d="M54 332.431C616.85 111.443 932.185 112.085 1494 332.431"
        stroke="#FF9B7A"
        strokeWidth="4"
        filter="url(#hero-line-glow)"
        pathLength="1000"
      />
      <line
        className="hero-line-glow hero-line-glow-center"
        y1="166.931"
        x2="1515"
        y2="166.931"
        stroke="#FF9B7A"
        strokeWidth="4"
        filter="url(#hero-line-glow)"
        pathLength="1000"
      />
      <path
        className="hero-line-glow hero-line-glow-2"
        d="M49 242.931C611.839 142.179 927.172 143.685 1489 242.931"
        stroke="#FF9B7A"
        strokeWidth="4"
        filter="url(#hero-line-glow)"
        pathLength="1000"
      />
      <path
        className="hero-line-glow hero-line-glow-3"
        d="M49 91.9307C611.839 192.682 927.172 191.176 1489 91.9307"
        stroke="#FF9B7A"
        strokeWidth="4"
        filter="url(#hero-line-glow)"
        pathLength="1000"
      />
      {HERO_ICON_POSITIONS.map((pos, i) => (
        <HeroLineIcon key={i} x={pos.x} y={pos.y} />
      ))}
    </svg>
  )
}
