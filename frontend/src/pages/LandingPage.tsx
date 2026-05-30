import { Activity, Database, Search, Sparkles } from 'lucide-react';
import { GitBranch, Briefcase, Newspaper } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── design tokens ─────────────────────────────────────────────────────────────
const BLUE   = '#2563eb';
const TEXT   = '#0f172a';
const MUTED  = '#64748b';
const SUBTLE = '#94a3b8';
const BORDER = '1px solid #e2e8f0';
const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

// ── data ──────────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Database,  label: '3 Data Sources',      desc: 'GitHub · Adzuna · NewsAPI' },
  { icon: Activity,  label: 'Real-time Scoring',   desc: 'Weighted 0–100 HireSignal score' },
  { icon: Sparkles,  label: 'AI-Powered Insights', desc: 'Groq llama summary per company' },
] as const;

const FEATURES = [
  {
    icon: GitBranch,
    title: 'GitHub Activity',
    desc: "Commit velocity across a company's public repositories tracked over 30, 60, and 90-day windows.",
    accent: BLUE,
  },
  {
    icon: Briefcase,
    title: 'Job Market Signals',
    desc: "Active posting counts from Adzuna. A surge in hiring often precedes growth that hasn't hit the news yet.",
    accent: '#10b981',
  },
  {
    icon: Newspaper,
    title: 'News Coverage',
    desc: 'The 5 most recent articles mentioning the company — press presence is a reliable proxy for momentum.',
    accent: '#7c3aed',
  },
] as const;

// Mock preview data shown in the hero right column
const MOCK = {
  company: 'Stripe',
  score: 82,
  bars: [
    { label: 'GitHub', value: 74, color: BLUE },
    { label: 'Jobs',   value: 90, color: '#10b981' },
    { label: 'News',   value: 80, color: '#7c3aed' },
  ],
};

// ── component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/results?name=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="dot-grid" style={{ minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav style={{ background: '#ffffff', borderBottom: BORDER, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: BLUE, fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>HS.</span>
            <span style={{ color: SUBTLE, fontSize: '13px' }}>HireSignal</span>
          </div>
          <span style={{ color: SUBTLE, fontSize: '13px' }}>company growth intelligence</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: BORDER, background: '#ffffff' }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '72px 32px 64px',
          display: 'flex',
          alignItems: 'center',
          gap: '64px',
          flexWrap: 'wrap',
        }}>
          {/* Left — text + search */}
          <div style={{ flex: 1, minWidth: '300px', maxWidth: '560px' }}>
            <p className="animate-fade-in-up" style={{ color: BLUE, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '18px' }}>
              Real-time · GitHub · Jobs · News
            </p>

            <h1 className="animate-fade-in-up delay-100" style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              marginBottom: '16px',
            }}>
              <span style={{ color: TEXT }}>Stop applying blindly.</span>
              <br />
              <span style={{ color: BLUE }}>Know which companies are actually growing.</span>
            </h1>

            <p className="animate-fade-in-up delay-200" style={{ color: MUTED, fontSize: '16px', lineHeight: 1.7, maxWidth: '460px', marginBottom: '32px' }}>
              HireSignal pulls live signals from GitHub, job boards, and news — then scores each company so you know exactly when to apply.
            </p>

            {/* Search form */}
            <form onSubmit={handleSubmit} className="animate-fade-in-up delay-300" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '520px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: SUBTLE, pointerEvents: 'none' }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Company name — e.g. Stripe, OpenAI"
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: TEXT,
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim()}
                  style={{
                    padding: '12px 20px',
                    background: query.trim() ? BLUE : '#f1f5f9',
                    color: query.trim() ? '#ffffff' : SUBTLE,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: query.trim() ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (query.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
                  onMouseLeave={e => { if (query.trim()) (e.currentTarget as HTMLButtonElement).style.background = BLUE; }}
                >
                  Analyze →
                </button>
              </div>
            </form>
            <p style={{ color: '#cbd5e1', fontSize: '12px' }}>Try: Stripe · OpenAI · Airbnb · Shopify</p>
          </div>

          {/* Right — product preview card */}
          <div className="animate-fade-in-up delay-400" style={{ ...CARD, padding: '24px', minWidth: '260px', maxWidth: '320px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ color: SUBTLE, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Sample Analysis</p>
                <p style={{ color: TEXT, fontWeight: 700, fontSize: '18px' }}>{MOCK.company}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: BLUE, fontWeight: 800, fontSize: '32px', lineHeight: 1 }}>{MOCK.score}</p>
                <p style={{ color: SUBTLE, fontSize: '11px' }}>/100</p>
              </div>
            </div>

            {MOCK.bars.map(bar => (
              <div key={bar.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: MUTED, fontSize: '12px' }}>{bar.label}</span>
                  <span style={{ color: TEXT, fontSize: '12px', fontWeight: 600 }}>{bar.value}</span>
                </div>
                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '5px', width: `${bar.value}%`, background: bar.color, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '16px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>🚀 Strong Apply Signal</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderBottom: BORDER }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}>
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{
                padding: '28px 24px',
                borderRight: i < STATS.length - 1 ? BORDER : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}>
                <div style={{ marginTop: '2px', flexShrink: 0,
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={BLUE} />
                </div>
                <div>
                  <p style={{ color: TEXT, fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{s.label}</p>
                  <p style={{ color: SUBTLE, fontSize: '12px' }}>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────────────────────── */}
      <section style={{ borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '56px 32px' }}>
          <p style={{ color: MUTED, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>What we track</p>
          <h2 style={{ color: TEXT, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.015em', marginBottom: '24px' }}>
            Three signals. One score.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  style={{
                    ...CARD,
                    padding: '22px 24px',
                    borderLeft: `3px solid ${f.accent}`,
                    borderRadius: '12px',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Icon size={17} color={f.accent} />
                    <h3 style={{ color: TEXT, fontWeight: 700, fontSize: '15px' }}>{f.title}</h3>
                  </div>
                  <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: BLUE, fontWeight: 800, fontSize: '15px' }}>HS.</span>
            <span style={{ color: SUBTLE, fontSize: '13px' }}>HireSignal</span>
          </div>
          <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: SUBTLE, fontSize: '13px' }}>
            Built by Bharath Reddy Kalva
          </em>
        </div>
      </footer>

    </div>
  );
}
