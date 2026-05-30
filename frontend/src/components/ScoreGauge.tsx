import { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
}

const R = 80;
const CIRC = 2 * Math.PI * R;
const TRACK = CIRC * 0.75;
const GAP   = CIRC - TRACK;

function getColor(s: number) {
  if (s >= 71) return '#16a34a';
  if (s >= 41) return '#d97706';
  return '#dc2626';
}

function getLabel(s: number) {
  if (s >= 71) return 'Strong';
  if (s >= 41) return 'Moderate';
  return 'Weak';
}

export default function ScoreGauge({ score, size = 200 }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    let start: number | null = null;
    const duration = 1400;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [score]);

  const color = getColor(score);
  const arcLen = TRACK * (display / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 200 200" style={{ width: `${size}px`, height: `${size}px`, overflow: 'visible' }}>
        {/* Background track */}
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeDasharray={`${TRACK} ${GAP}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        {/* Score arc */}
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${arcLen} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
          style={{ transition: 'stroke 0.4s ease' }}
        />
        {/* Score number */}
        <text x="100" y="90" textAnchor="middle"
          fill="#0f172a" fontSize="44" fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {display}
        </text>
        {/* /100 */}
        <text x="100" y="114" textAnchor="middle"
          fill="#94a3b8" fontSize="13"
          fontFamily="Inter, system-ui, sans-serif">
          / 100
        </text>
        {/* Label */}
        <text x="100" y="146" textAnchor="middle"
          fill={color} fontSize="10" fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="2">
          {getLabel(score).toUpperCase()} SIGNAL
        </text>
      </svg>
    </div>
  );
}
