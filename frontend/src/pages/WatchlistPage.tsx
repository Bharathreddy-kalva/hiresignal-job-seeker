import { ArrowLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WatchlistEntry } from '../lib/api';
import { getWatchlist, removeFromWatchlist } from '../lib/api';

// ── design tokens ─────────────────────────────────────────────────────────────
const TEXT   = '#0f172a';
const MUTED  = '#64748b';
const SUBTLE = '#94a3b8';
const BLUE   = '#2563eb';
const BORDER = '1px solid #e2e8f0';
const MONO   = '"ui-monospace","SFMono-Regular","Menlo","Consolas",monospace';
const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const LS_EMAIL_KEY = 'hs_email';

function scoreColor(s: number) {
  if (s >= 71) return '#16a34a';
  if (s >= 41) return '#d97706';
  return '#dc2626';
}

function verdictLabel(s: number) {
  if (s >= 71) return 'Strong Signal';
  if (s >= 41) return 'Moderate Signal';
  return 'Weak Signal';
}

// ── component ─────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState(() => localStorage.getItem(LS_EMAIL_KEY) ?? '');
  const [input, setInput]       = useState(email);
  const [entries, setEntries]   = useState<WatchlistEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchList = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await getWatchlist(input.trim());
      setEntries(data);
      setEmail(input.trim());
      localStorage.setItem(LS_EMAIL_KEY, input.trim());
    } catch {
      setError('Failed to load watchlist. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if email is already in localStorage
  useEffect(() => {
    if (email) { void fetchList(); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = async (companyName: string) => {
    setRemoving(companyName);
    await removeFromWatchlist(email, companyName);
    setEntries((prev) => prev.filter((e) => e.companyName !== companyName));
    setRemoving(null);
  };

  return (
    <div className="dot-grid" style={{ minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav style={{ background: '#ffffff', borderBottom: BORDER, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
          >
            <ArrowLeft size={15} color={SUBTLE} />
            <span style={{ color: BLUE, fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em' }}>HS.</span>
          </button>
          <span style={{ color: SUBTLE, fontSize: '13px' }}>My Watchlist</span>
        </div>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '36px 32px 32px' }}>
          <h1 style={{ color: TEXT, fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.025em', marginBottom: '6px' }}>
            My Watchlist
          </h1>
          <p style={{ color: MUTED, fontSize: '14px', marginBottom: '20px' }}>
            Track companies and receive weekly score updates by email.
          </p>

          {/* Email form */}
          <form onSubmit={(e) => { void fetchList(e); }} style={{ display: 'flex', gap: '8px', maxWidth: '480px' }}>
            <input
              type="email"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter your email to see your watchlist"
              style={{
                flex: 1,
                padding: '11px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: TEXT,
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 20px',
                background: loading ? '#f1f5f9' : TEXT,
                color: loading ? SUBTLE : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Loading…' : 'View →'}
            </button>
          </form>
          {error && (
            <p style={{ fontFamily: MONO, color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>{error}</p>
          )}
        </div>
      </div>

      {/* ── Watchlist entries ────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '36px 32px 80px' }}>

        {!loading && email && entries.length === 0 && (
          <div style={{ ...CARD, padding: '32px', textAlign: 'center' }}>
            <p style={{ color: MUTED, fontSize: '15px', marginBottom: '6px' }}>
              No companies on your watchlist yet.
            </p>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '12px' }}>
              Search for a company and click "+ Watch" to add it.
            </p>
          </div>
        )}

        {entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '4px' }}>
              WATCHING {entries.length} {entries.length === 1 ? 'COMPANY' : 'COMPANIES'}
            </p>

            {entries.map((entry) => {
              const score   = entry.score ?? 0;
              const hasData = entry.score !== null;

              return (
                <div
                  key={entry.companyName}
                  style={{
                    ...CARD,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Company + verdict */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <p style={{ color: TEXT, fontWeight: 700, fontSize: '15px', marginBottom: '3px' }}>
                      {entry.companyName}
                    </p>
                    <p style={{ fontFamily: MONO, color: hasData ? scoreColor(score) : SUBTLE, fontSize: '11px' }}>
                      {hasData ? verdictLabel(score) : 'No score yet — search to generate one'}
                    </p>
                  </div>

                  {/* Score */}
                  {hasData && (
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <span style={{ color: scoreColor(score), fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>
                        {score}
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: '13px' }}>/100</span>
                    </div>
                  )}

                  {/* Mini score breakdown */}
                  {hasData && (
                    <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                      {[
                        { label: 'GitHub', val: entry.githubScore ?? 0, color: BLUE },
                        { label: 'Jobs',   val: entry.jobsScore   ?? 0, color: '#10b981' },
                        { label: 'News',   val: entry.newsScore   ?? 0, color: '#7c3aed' },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '9px', letterSpacing: '0.06em', marginBottom: '2px' }}>{label.toUpperCase()}</p>
                          <p style={{ color, fontWeight: 700, fontSize: '13px' }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/results?name=${encodeURIComponent(entry.companyName)}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '7px 12px',
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: MUTED,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE; (e.currentTarget as HTMLButtonElement).style.color = BLUE; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
                    >
                      Analyze <ArrowUpRight size={12} />
                    </button>
                    <button
                      onClick={() => { void handleRemove(entry.companyName); }}
                      disabled={removing === entry.companyName}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '7px 10px',
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        color: removing === entry.companyName ? SUBTLE : '#dc2626',
                        cursor: removing === entry.companyName ? 'not-allowed' : 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', marginTop: '8px' }}>
              Weekly updates sent every Monday at 9 AM · Scores cached for 1 hour
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
