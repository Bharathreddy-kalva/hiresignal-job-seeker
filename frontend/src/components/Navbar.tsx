import { ArrowLeft } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  companyName: string;
  score?: number;
}

function scoreColor(s: number) {
  if (s >= 71) return '#16a34a';
  if (s >= 41) return '#d97706';
  return '#dc2626';
}

function scoreBg(s: number) {
  if (s >= 71) return '#f0fdf4';
  if (s >= 41) return '#fffbeb';
  return '#fef2f2';
}

export default function Navbar({ companyName, score }: Props) {
  const navigate = useNavigate();
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo / back to dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
        >
          <ArrowLeft size={15} color="#94a3b8" />
          <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>HS.</span>
        </button>

        {/* Center — company + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Analyzing:</span>
          <span style={{
            color: '#0f172a',
            fontWeight: 600,
            fontSize: '14px',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {companyName}
          </span>
          {score !== undefined && (
            <span style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              color: scoreColor(score),
              background: scoreBg(score),
              border: `1px solid ${scoreColor(score)}30`,
            }}>
              {score}/100
            </span>
          )}
        </div>

        {/* Right — user avatar */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
