import { Link } from 'react-router-dom';

// ── design tokens ─────────────────────────────────────────────────────────────
const BLUE   = '#2563eb';
const TEXT   = '#0f172a';
const MUTED  = '#64748b';
const SUBTLE = '#94a3b8';
const BORDER = '1px solid #e2e8f0';
const MONO   = '"ui-monospace","SFMono-Regular","Menlo","Consolas",monospace';
const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

// ── data ──────────────────────────────────────────────────────────────────────
const SIGNALS = [
  {
    name: 'github_activity',
    title: 'GitHub Activity',
    desc: "Commit velocity across a company's public repositories tracked over 30, 60, and 90-day windows.",
    accent: BLUE,
  },
  {
    name: 'job_postings',
    title: 'Job Market Signals',
    desc: "Active posting counts from Adzuna. A surge in hiring often precedes growth that hasn't hit the news yet.",
    accent: '#10b981',
  },
  {
    name: 'news_coverage',
    title: 'News Coverage',
    desc: 'The 5 most recent articles mentioning the company — press presence is a reliable proxy for momentum.',
    accent: '#7c3aed',
  },
] as const;

const PERKS = [
  'Personalized job matching',
  'Weekly email alerts',
  'Company watchlist',
  'Score history',
];

// ── component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="dot-grid" style={{ minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav style={{ background: '#ffffff', borderBottom: BORDER, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: BLUE, fontWeight: 900, fontSize: '22px', letterSpacing: '-0.03em' }}>HS.</span>
            <span style={{ color: SUBTLE, fontSize: '13px' }}>HireSignal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/sign-in" style={{ color: MUTED, fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link
              to="/sign-up"
              style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, background: TEXT, padding: '7px 14px', borderRadius: '7px', textDecoration: 'none' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 32px 72px', textAlign: 'center' }}>

          <p className="animate-fade-in-up" style={{ fontFamily: MONO, color: BLUE, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Real-time · GitHub · Jobs · News
          </p>

          <h1 className="animate-fade-in-up delay-100" style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            marginBottom: '20px',
          }}>
            <span style={{ color: TEXT }}>Stop applying blindly.</span>
            <br />
            <span style={{ color: BLUE }}>Know which companies are actually growing.</span>
          </h1>

          <p className="animate-fade-in-up delay-200" style={{ color: MUTED, fontSize: '17px', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 36px' }}>
            HireSignal pulls live signals from GitHub, job boards, and news — then scores each company so you know exactly when to apply.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <Link
              to="/sign-up"
              style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                background: BLUE,
                padding: '14px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Get Started Free →
            </Link>
            <Link
              to="/sign-in"
              style={{
                color: TEXT,
                fontWeight: 600,
                fontSize: '15px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '14px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>

          {/* Perks */}
          <div className="animate-fade-in-up delay-400" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {PERKS.map((p, i) => (
              <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontFamily: MONO,
                  fontSize: '12px',
                  color: MUTED,
                  background: '#f8f9ff',
                  border: '1px solid #e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '100px',
                }}>
                  {p}
                </span>
                {i < PERKS.length - 1 && <span style={{ color: '#e2e8f0' }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three signals ───────────────────────────────────────────────── */}
      <section style={{ borderBottom: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '56px 32px' }}>
          <h2 style={{ color: TEXT, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.015em', marginBottom: '24px' }}>
            Three signals. One score.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {SIGNALS.map(s => (
              <div
                key={s.name}
                style={{
                  ...CARD,
                  padding: '22px 24px',
                  borderLeft: `3px solid ${s.accent}`,
                  borderRadius: '12px',
                }}
              >
                <h3 style={{ color: TEXT, fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: BORDER }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: BLUE, fontWeight: 900, fontSize: '15px' }}>HS.</span>
            <span style={{ fontFamily: MONO, color: SUBTLE, fontSize: '11px' }}>HireSignal</span>
          </div>
          <em style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: SUBTLE, fontSize: '13px' }}>
            Built by Bharath Reddy Kalva
          </em>
        </div>
      </footer>

    </div>
  );
}
