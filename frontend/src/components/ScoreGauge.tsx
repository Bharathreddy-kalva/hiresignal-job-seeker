import { useEffect, useState } from 'react';

interface Props {
  score: number;
}

const R = 80;
const CIRC = 2 * Math.PI * R; // 502.655
const TRACK = CIRC * 0.75;    // 376.99  (270° arc)
const GAP   = CIRC - TRACK;   // 125.66  (90° hidden at bottom)

function getColor(s: number) {
  if (s >= 71) return '#10b981';
  if (s >= 41) return '#f59e0b';
  return '#ef4444';
}

function getLabel(s: number) {
  if (s >= 71) return 'Strong';
  if (s >= 41) return 'Moderate';
  return 'Weak';
}

export default function ScoreGauge({ score }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    let start: number | null = null;
    const duration = 1600;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [score]);

  const color = getColor(score);
  const arcLen = TRACK * (display / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg
        viewBox="0 0 200 200"
        style={{ width: '240px', height: '240px', overflow: 'visible' }}
      >
        <defs>
          <filter id="score-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Outer ring gradient */}
          <radialGradient id="ring-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.05" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow backdrop */}
        <circle cx="100" cy="100" r="96" fill="url(#ring-bg)" />

        {/* Background track */}
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke="#1e293b"
          strokeWidth="13"
          strokeDasharray={`${TRACK} ${GAP}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />

        {/* Score arc */}
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeDasharray={`${arcLen} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
          filter="url(#score-glow)"
          style={{ transition: 'stroke 0.4s ease' }}
        />

        {/* Score number */}
        <text
          x="100" y="92"
          textAnchor="middle"
          fill="white"
          fontSize="46"
          fontWeight="800"
          fontFamily="'Geist Variable', system-ui, sans-serif"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {display}
        </text>

        {/* /100 */}
        <text
          x="100" y="116"
          textAnchor="middle"
          fill="#475569"
          fontSize="14"
          fontFamily="'Geist Variable', system-ui, sans-serif"
        >
          / 100
        </text>

        {/* Signal label */}
        <text
          x="100" y="148"
          textAnchor="middle"
          fill={color}
          fontSize="11"
          fontWeight="700"
          fontFamily="'Geist Variable', system-ui, sans-serif"
          letterSpacing="2"
        >
          {getLabel(score).toUpperCase()} SIGNAL
        </text>
      </svg>
    </div>
  );
}
