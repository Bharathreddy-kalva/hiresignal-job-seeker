// Shared dark left panel — photo + overlay + SVG network nodes

// Node positions as % of panel width/height
const NODES = [
  { cx: 18, cy: 22 },
  { cx: 55, cy: 14 },
  { cx: 80, cy: 32 },
  { cx: 35, cy: 50 },
  { cx: 70, cy: 58 },
  { cx: 20, cy: 72 },
  { cx: 58, cy: 80 },
  { cx: 85, cy: 75 },
];

// Which nodes to connect with lines (index pairs)
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [2, 4],
  [3, 5], [3, 4], [4, 7], [5, 6], [6, 7],
];

function NetworkSVG() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {/* Connection lines */}
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a].cx} y1={NODES[a].cy}
          x2={NODES[b].cx} y2={NODES[b].cy}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.4"
        />
      ))}
      {/* Nodes */}
      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r="1.2"
          fill="rgba(255,255,255,0.25)"
        />
      ))}
    </svg>
  );
}

export function AuthLeftPanel() {
  return (
    <div
      className="auth-left"
      style={{
        width: '50%',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        backgroundImage:
          "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0,
      }}
    >
      {/* Dark gradient overlay on top of photo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,58,95,0.78) 100%)',
        zIndex: 1,
      }} />

      {/* SVG network / nodes overlay */}
      <NetworkSVG />

      {/* ── Content sits above overlay (z-index 3) ─────────────────────── */}

      {/* HS. logo — top-left */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 3 }}>
        <p style={{
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '26px',
          letterSpacing: '-0.03em',
          marginBottom: '2px',
        }}>
          HS.
        </p>
        <p style={{
          color: '#94a3b8',
          fontSize: '13px',
          fontFamily: '"ui-monospace","SFMono-Regular","Menlo",monospace',
        }}>
          HireSignal
        </p>
      </div>

      {/* Center headline */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 3rem',
        zIndex: 3,
      }}>
        <h1 style={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 'clamp(1.7rem, 2.6vw, 2.5rem)',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          maxWidth: '380px',
          marginBottom: '16px',
        }}>
          Know which companies are worth applying to.
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '15px',
          lineHeight: 1.65,
          maxWidth: '340px',
        }}>
          Real-time signals from GitHub, job boards &amp; news
        </p>
      </div>

      {/* Footer — bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '2rem',
        zIndex: 3,
      }}>
        <p style={{
          color: '#475569',
          fontSize: '12px',
          fontFamily: '"ui-monospace","SFMono-Regular","Menlo",monospace',
        }}>
          © 2026 HireSignal · Built by Bharath Reddy Kalva
        </p>
      </div>
    </div>
  );
}
