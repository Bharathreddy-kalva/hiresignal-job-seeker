import { Briefcase, GitBranch, Newspaper, Search, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: GitBranch,
    title: 'GitHub Intelligence',
    description:
      "Track real commit velocity and engineering activity across any company's open-source repositories over 30, 60 and 90-day windows.",
    accent: '#3b82f6',
  },
  {
    icon: Briefcase,
    title: 'Job Market Signals',
    description:
      'Monitor active job posting counts and hiring velocity from thousands of job boards in real-time to spot growth before it hits the news.',
    accent: '#10b981',
  },
  {
    icon: Newspaper,
    title: 'News Intelligence',
    description:
      'Surface the five most recent news articles mentioning the company to gauge market momentum, press presence and public sentiment.',
    accent: '#a78bfa',
  },
] as const;

const STEPS = [
  {
    num: '01',
    title: 'Search',
    description: 'Type any company name to kick off a live multi-source analysis.',
  },
  {
    num: '02',
    title: 'Analyze',
    description:
      'We pull live signals from GitHub, Adzuna job boards, and NewsAPI simultaneously.',
  },
  {
    num: '03',
    title: 'Decide',
    description:
      'Get a 0–100 HireSignal Score plus a Groq-powered AI summary to guide your application.',
  },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(30,41,59,0.55)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: '16px',
};

// ── component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/results?name=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', overflowX: 'hidden' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="hero-gradient"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient orbs */}
        {[
          { top: '15%', left: '10%', color: 'rgba(59,130,246,0.18)', size: 500 },
          { top: '60%', right: '8%', color: 'rgba(16,185,129,0.14)', size: 420, left: undefined },
          { top: '40%', left: '55%', color: 'rgba(167,139,250,0.1)', size: 360 },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              right: (orb as { right?: string }).right,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '780px',
            width: '100%',
          }}
        >
          {/* Badge */}
          <div
            className="animate-fade-in-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              marginBottom: '28px',
            }}
          >
            <Zap size={14} color="#3b82f6" />
            <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 600 }}>
              HireSignal — Real-Time Company Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up delay-100"
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              color: 'white',
              marginBottom: '24px',
            }}
          >
            Know Which Companies
            <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Are Worth Applying To
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-in-up delay-200"
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
              color: '#94a3b8',
              lineHeight: 1.75,
              maxWidth: '560px',
              margin: '0 auto 40px',
            }}
          >
            Real-time signals from GitHub, job boards &amp; news — combined into one{' '}
            <strong style={{ color: '#cbd5e1' }}>HireSignal Score</strong>
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-in-up delay-300"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Enter company name (e.g. Stripe)"
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    background: 'rgba(30,41,59,0.9)',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(148,163,184,0.15)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim()}
                style={{
                  padding: '15px 28px',
                  background: query.trim()
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'rgba(30,41,59,0.6)',
                  color: query.trim() ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: query.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: query.trim() ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
                }}
                onMouseEnter={e => {
                  if (query.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 8px 24px rgba(59,130,246,0.45)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = query.trim()
                    ? '0 4px 16px rgba(59,130,246,0.35)'
                    : 'none';
                }}
              >
                Analyze Company →
              </button>
            </div>
            <p style={{ color: '#475569', fontSize: '13px' }}>
              Try: Stripe, OpenAI, Airbnb, Shopify
            </p>
          </form>
        </div>

        {/* Feature cards */}
        <div
          className="animate-fade-in-up delay-400"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            maxWidth: '980px',
            width: '100%',
            marginTop: '72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...glass,
                  padding: '28px',
                  transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
                  transform: hovered === i ? 'translateY(-6px)' : 'translateY(0)',
                  borderColor:
                    hovered === i ? `${f.accent}35` : 'rgba(148,163,184,0.1)',
                  boxShadow:
                    hovered === i ? `0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px ${f.accent}20` : 'none',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${f.accent}18`,
                    border: `1px solid ${f.accent}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <Icon size={22} color={f.accent} />
                </div>
                <h3
                  style={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '17px',
                    marginBottom: '10px',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.65 }}>
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '100px 24px',
          borderTop: '1px solid rgba(148,163,184,0.07)',
        }}
      >
        <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              color: '#3b82f6',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            How It Works
          </p>
          <h2
            style={{
              color: 'white',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '64px',
            }}
          >
            Three steps to smarter job hunting
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
            }}
          >
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '27px',
                      left: '60%',
                      width: '80%',
                      height: '1px',
                      background:
                        'linear-gradient(90deg, rgba(59,130,246,0.4), transparent)',
                      display: window.innerWidth < 640 ? 'none' : 'block',
                    }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.05))',
                      border: '1px solid rgba(59,130,246,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      color: '#3b82f6',
                      fontSize: '13px',
                      fontWeight: 800,
                    }}
                  >
                    {step.num}
                  </div>
                  <h3
                    style={{
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '19px',
                      marginBottom: '10px',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          padding: '36px 24px',
          borderTop: '1px solid rgba(148,163,184,0.07)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <Zap size={16} color="#3b82f6" />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>
            HireSignal
          </span>
        </div>
        <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
          Real-time company growth intelligence for job seekers
          <br />
          Built by{' '}
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            Bharath Reddy Kalva
          </span>
        </p>
      </footer>
    </div>
  );
}
