import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CompanyAnalysis, CompareResult } from '../lib/api';
import { compareCompanies } from '../lib/api';

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

// ── helpers ───────────────────────────────────────────────────────────────────

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

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const BAR_COLORS = ['#2563eb', '#10b981', '#f59e0b'];

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontFamily: MONO, color: TEXT, fontSize: '11px', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '4px', width: `${value}%`, background: color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function CompanyColumn({
  data,
  isWinner,
  index,
}: {
  data: CompanyAnalysis;
  isWinner: boolean;
  index: number;
}) {
  const color = scoreColor(data.score);
  return (
    <div
      style={{
        ...CARD,
        padding: '24px',
        flex: 1,
        minWidth: '200px',
        position: 'relative',
        border: isWinner ? `2px solid ${BLUE}` : '1px solid #e2e8f0',
        transition: 'box-shadow 0.2s',
      }}
    >
      {isWinner && (
        <div style={{
          position: 'absolute',
          top: '-1px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: BLUE,
          color: '#ffffff',
          fontFamily: MONO,
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '3px 10px',
          borderRadius: '0 0 6px 6px',
        }}>
          BEST SIGNAL
        </div>
      )}

      <div style={{ marginTop: isWinner ? '12px' : '0' }}>
        <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.06em', marginBottom: '4px' }}>
          {String(index + 1).padStart(2, '0')}
        </p>
        <h2 style={{ color: TEXT, fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: 1.1 }}>
          {capitalize(data.company.name)}
        </h2>

        {/* Big score */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ color, fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{data.score}</span>
          <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>/100</span>
          <p style={{ fontFamily: MONO, color, fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', marginTop: '4px' }}>
            {verdictLabel(data.score).toUpperCase()}
          </p>
        </div>

        {/* Score bars */}
        <ScoreBar label="GITHUB"  value={data.scoreBreakdown.github} color={BAR_COLORS[0]} />
        <ScoreBar label="JOBS"    value={data.scoreBreakdown.jobs}   color={BAR_COLORS[1]} />
        <ScoreBar label="NEWS"    value={data.scoreBreakdown.news}   color="#7c3aed" />
      </div>
    </div>
  );
}

function CompareBarChart({ companies }: { companies: CompanyAnalysis[] }) {
  const names = companies.map((c) => capitalize(c.company.name));

  const chartData = [
    {
      signal: 'GitHub',
      ...Object.fromEntries(companies.map((c, i) => [names[i], c.scoreBreakdown.github])),
    },
    {
      signal: 'Jobs',
      ...Object.fromEntries(companies.map((c, i) => [names[i], c.scoreBreakdown.jobs])),
    },
    {
      signal: 'News',
      ...Object.fromEntries(companies.map((c, i) => [names[i], c.scoreBreakdown.news])),
    },
  ] as Record<string, string | number>[];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="signal"
          stroke="#e2e8f0"
          tick={{ fill: SUBTLE, fontSize: 11, fontFamily: MONO }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#e2e8f0"
          tick={{ fill: SUBTLE, fontSize: 11, fontFamily: MONO }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontFamily: MONO,
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Legend wrapperStyle={{ fontFamily: MONO, fontSize: '11px', paddingTop: '12px' }} />
        {names.map((name, i) => (
          <Bar key={name} dataKey={name} radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((_, j) => (
              <Cell key={j} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SkeletonCompare() {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '44px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...CARD, padding: '24px', flex: 1, minWidth: '200px' }}>
            <div style={{ height: '10px', width: '30px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '20px', width: '80%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '20px' }} />
            <div style={{ height: '48px', width: '60px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '20px' }} />
            {[0, 1, 2].map((j) => (
              <div key={j} style={{ marginBottom: '12px' }}>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '2px', marginBottom: '6px' }} />
                <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ ...CARD, height: '260px' }} />
      <div style={{ ...CARD, padding: '24px', height: '120px' }} />
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState(['', '', '']);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = inputs.map((s) => s.trim()).filter(Boolean);
    if (names.length < 2) {
      setError('Enter at least 2 company names to compare.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await compareCompanies(names));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const winnerIdx = result
    ? result.companies.reduce(
        (best, c, i, arr) => (c.score > arr[best].score ? i : best),
        0,
      )
    : -1;

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
          <span style={{ color: SUBTLE, fontSize: '13px' }}>Company Comparison</span>
        </div>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 32px 36px' }}>
          <h1 style={{ color: TEXT, fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.025em', marginBottom: '6px' }}>
            Company Comparison
          </h1>
          <p style={{ color: MUTED, fontSize: '15px' }}>Compare up to 3 companies side by side</p>
        </div>
      </div>

      {/* ── Search form ─────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '28px 32px' }}>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {inputs.map((val, i) => (
                <input
                  key={i}
                  value={val}
                  onChange={(e) => {
                    const next = [...inputs];
                    next[i] = e.target.value;
                    setInputs(next);
                  }}
                  placeholder={`Company ${i + 1}`}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    padding: '11px 16px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: TEXT,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              ))}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px 24px',
                  background: loading ? '#f1f5f9' : TEXT,
                  color: loading ? SUBTLE : '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Analyzing…' : 'Compare →'}
              </button>
            </div>
            {error && (
              <p style={{ fontFamily: MONO, color: '#dc2626', fontSize: '12px' }}>{error}</p>
            )}
            <p style={{ fontFamily: MONO, color: '#cbd5e1', fontSize: '11px' }}>
              try: stripe · openai · google
            </p>
          </form>
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && <SkeletonCompare />}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {result && !loading && (
        <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ── Company columns ──────────────────────────────────────────── */}
          <div className="animate-fade-in-up" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {result.companies.map((c, i) => (
              <CompanyColumn
                key={i}
                data={c}
                isWinner={i === winnerIdx}
                index={i}
              />
            ))}
          </div>

          {/* ── Grouped bar chart ────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-100" style={{ ...CARD, padding: '22px' }}>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '6px' }}>
              SIGNAL BREAKDOWN COMPARISON
            </p>
            <p style={{ color: SUBTLE, fontSize: '12px', marginBottom: '18px' }}>
              GitHub, Jobs, and News scores by company
            </p>
            <CompareBarChart companies={result.companies} />
          </div>

          {/* ── AI comparison ────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-200"
            style={{
              ...CARD,
              padding: '24px',
              background: '#f8faff',
              borderLeft: `3px solid ${BLUE}`,
              borderRadius: '0 12px 12px 0',
            }}
          >
            <p style={{ color: TEXT, fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>AI Comparison</p>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', marginBottom: '14px' }}>
              Groq · llama-3.1-8b-instant
            </p>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '10px' }}>
              AI ANALYSIS
            </p>
            <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.75, fontStyle: 'italic' }}>
              {result.comparison}
            </p>
          </div>

          {/* ── Footer note ──────────────────────────────────────────────── */}
          <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', textAlign: 'right' }}>
            Scores cached for 1 hour · Results may vary with live data
          </p>

        </main>
      )}
    </div>
  );
}
