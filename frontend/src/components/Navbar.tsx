import { ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  companyName: string;
  score?: number;
}

function scoreColor(s: number) {
  if (s >= 71) return '#10b981';
  if (s >= 41) return '#f59e0b';
  return '#ef4444';
}

export default function Navbar({ companyName, score }: Props) {
  const navigate = useNavigate();
  return (
    <header
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              'rgba(59,130,246,0.08)')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'none')
          }
        >
          <ArrowLeft size={16} color="#64748b" />
          <Zap size={18} color="#3b82f6" />
          <span
            style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}
          >
            HireSignal
          </span>
        </button>

        {/* Company */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 500,
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Analyzing:
          </span>
          <span
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: '15px',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {companyName}
          </span>
          {score !== undefined && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                color: scoreColor(score),
                background: `${scoreColor(score)}18`,
                border: `1px solid ${scoreColor(score)}40`,
              }}
            >
              {score}/100
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
