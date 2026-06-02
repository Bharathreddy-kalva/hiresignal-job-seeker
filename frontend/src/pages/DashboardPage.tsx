import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { getSearchHistory } from '../lib/searchHistory';
import { uploadResume } from '../lib/api';

const LOGO_URLS: Record<string, string> = {
  netflix: 'https://logo.clearbit.com/netflix.com',
  salesforce: 'https://logo.clearbit.com/salesforce.com',
  nvidia: 'https://logo.clearbit.com/nvidia.com',
  google: 'https://logo.clearbit.com/google.com',
  meta: 'https://logo.clearbit.com/meta.com',
  uber: 'https://logo.clearbit.com/uber.com',
  stripe: 'https://logo.clearbit.com/stripe.com',
  microsoft: 'https://logo.clearbit.com/microsoft.com',
  apple: 'https://logo.clearbit.com/apple.com',
  amazon: 'https://logo.clearbit.com/amazon.com',
  openai: 'https://logo.clearbit.com/openai.com',
  airbnb: 'https://logo.clearbit.com/airbnb.com',
  spotify: 'https://logo.clearbit.com/spotify.com',
  twitter: 'https://logo.clearbit.com/twitter.com',
  linkedin: 'https://logo.clearbit.com/linkedin.com',
};

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useUser();
  const firstName = user?.firstName || 'there';
  const navigate = useNavigate();

  // Shared canvas animator — used for both panels with different colors
  const startNetwork = (
    canvas: HTMLCanvasElement,
    dotColor: string,
    lineColor: string,
    count: number
  ) => {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    const nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 1,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            const alpha = 0.15 * (1 - dist / 160);
            ctx.strokeStyle = lineColor.replace('ALPHA', String(alpha));
            ctx.lineWidth = 0.6;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  };

  // Left panel: dark teal background — small muted teal dots
  useEffect(() => {
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    return startNetwork(
      canvas,
      'rgba(100, 200, 180, 0.4)',
      'rgba(100, 200, 180, ALPHA)',
      40
    );
  }, []);

  // Right panel: light blue-grey background — visible grey-blue dots + lines
  useEffect(() => {
    const canvas = rightCanvasRef.current;
    if (!canvas) return;
    return startNetwork(
      canvas,
      'rgba(80, 140, 160, 0.45)',
      'rgba(80, 140, 160, ALPHA)',
      35
    );
  }, []);

  useEffect(() => {
    if (user?.id) {
      setRecentSearches(getSearchHistory(user.id));
      try {
        setWatchlist(JSON.parse(localStorage.getItem('hs_watchlist') || '[]'));
      } catch { setWatchlist([]); }
    }
  }, [user]);

  const scoreColor = (s: number) => {
    if (s >= 71) return '#22c55e';
    if (s >= 41) return '#f97316';
    return '#ef4444';
  };

  const getSignals = (entry: any) => {
    const tags: { label: string; bg: string; color: string }[] = [];
    if ((entry.score || 0) >= 71)
      tags.push({ label: 'Strong Hire Signal', bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7' });
    if ((entry.githubScore || 0) >= 70)
      tags.push({ label: 'GitHub Activity Spike', bg: 'rgba(96,165,250,0.2)', color: '#93c5fd' });
    if ((entry.jobsScore || 0) >= 70)
      tags.push({ label: 'Key Job Postings', bg: 'rgba(167,139,250,0.2)', color: '#c4b5fd' });
    if ((entry.newsScore || 0) >= 70)
      tags.push({ label: 'Recent VC Funding', bg: 'rgba(251,146,60,0.2)', color: '#fcd34d' });
    if (tags.length === 0)
      tags.push({ label: 'Moderate Signal', bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' });
    return tags;
  };

  const getLogoUrl = (name: string) => {
    const key = name.toLowerCase().replace(/ /g, '');
    return LOGO_URLS[key] || `https://logo.clearbit.com/${key}.com`;
  };

  const CompanyLogo = ({ name, size = 44 }: { name: string; size?: number }) => {
    const [errored, setErrored] = useState(false);
    const src = errored
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d3d4a&color=fff&size=${size * 2}&bold=true`
      : getLogoUrl(name);
    return (
      <img
        src={src}
        style={{
          width: size, height: size, borderRadius: 8,
          objectFit: 'contain',
          background: errored ? '#0d3d4a' : 'white',
          padding: errored ? 0 : 3,
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0, display: 'block',
        }}
        onError={() => setErrored(true)}
        alt={name}
      />
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/results?name=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleHeroSearch = () => {
    if (heroSearch.trim()) navigate(`/results?name=${encodeURIComponent(heroSearch.trim())}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const response = await uploadResume(file);
      if (response?.skills) setDetectedSkills(response.skills);
    } catch (err) { console.error(err); }
  };

  const quickSearches = ['Meta', 'Netflix', 'Uber', 'NVIDIA', 'Sorgle', 'Striprs'];

  const fallbackCards = [
    { companyName: 'Netflix',    score: 79,  githubScore: 80,  jobsScore: 90,  newsScore: 80  },
    { companyName: 'Salesforce', score: 100, githubScore: 100, jobsScore: 100, newsScore: 100 },
    { companyName: 'NVIDIA',     score: 92,  githubScore: 85,  jobsScore: 90,  newsScore: 80  },
  ];

  const allCards = [...recentSearches, ...watchlist];
  const middleCards =
    allCards.length >= 3 ? allCards.slice(0, 3)
    : allCards.length > 0 ? [...allCards, ...fallbackCards].slice(0, 3)
    : fallbackCards;

  const exploreCards = [
    { name: 'Netflix',    score: 79  },
    { name: 'Salesforce', score: 100 },
    { name: 'NVIDIA',     score: 92  },
  ];

  // ── Color constants ──────────────────────────────────────────
  // RIGHT panel: significantly lighter blue-grey (the search/AI side)
  const RIGHT_BG = '#8fb8c8';
  // Cards inside left panel: slightly lighter than left bg
  const CARD_BG = 'rgba(255,255,255,0.06)';
  const CARD_BORDER = '1px solid rgba(255,255,255,0.1)';

  // The left-panel card style
  const leftCard: React.CSSProperties = {
    background: CARD_BG,
    border: CARD_BORDER,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 12,
    padding: 20,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════
          NAVBAR — three-zone gradient: dark-left → mid → light-right
          matching reference header color split
      ═══════════════════════════════════════════════════════ */}
      <nav style={{
        background: `linear-gradient(90deg, #0a2535 0%, #0d3545 40%, ${RIGHT_BG} 100%)`,
        padding: '0 2rem',
        height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(0,0,0,0.15)',
      }}>
        {/* Left side: logo + nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="4" y1="4" x2="4" y2="16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="4" y1="10" x2="9"  y2="10" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="9" y1="4" x2="9"  y2="16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="12" y1="9" x2="16" y2="5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <polyline points="13,5 16,5 16,8" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>Hire Signal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', borderBottom: '2px solid #14b8a6', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'white', paddingBottom: 3 }}>
              Dashboard
            </button>
            <button onClick={() => navigate('/watchlist')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>
              My Watchlist
            </button>
            <button onClick={() => navigate('/employer')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>
              Employer Portal
            </button>
          </div>
        </div>
        {/* Right side: user pill — sits over the lighter nav zone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '4px 10px', background: 'rgba(255,255,255,0.12)' }}>
          <UserButton afterSignOutUrl="/sign-in" />
          <svg style={{ width: 13, height: 13 }} fill="rgba(255,255,255,0.6)" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MAIN BODY — two-column split
          LEFT (~55%): dark teal  |  RIGHT (~45%): light blue-grey
      ═══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>

        {/* ── LEFT COLUMN ───────────────────────────────────── */}
        <div style={{
          width: '57%',
          background: `linear-gradient(160deg, #0e3545 0%, #0b2d3c 50%, #091e2a 100%)`,
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          padding: '2rem 2rem 2rem 2.5rem',
          overflow: 'hidden',
        }}>
          {/* Left panel network canvas */}
          <canvas ref={leftCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}/>

          {/* All left content sits above canvas */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Welcome text — plain, no card */}
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
              Welcome back, {firstName}
            </h1>

            {/* Company Health Analysis card */}
            <div style={{ ...leftCard, marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>
                Company Health Analysis
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 14px' }}>
                Analyze any company's hiring signals in real-time
              </p>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g., Stripe, OpenAI"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 7, padding: '9px 12px 9px 32px', fontSize: 13, color: 'white', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
                <button type="submit" style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 7, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Analysis
                </button>
              </form>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Quick Searches</span>
                {quickSearches.map(c => (
                  <button key={c} onClick={() => navigate(`/results?name=${c}`)} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '3px 11px', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{c}</button>
                ))}
                <button style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '3px 11px', fontSize: 11, cursor: 'pointer' }}>More</button>
              </div>
            </div>

            {/* Section headers */}
            <div style={{ display: 'flex', gap: 36, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>Recent Searches</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>My Watchlist</span>
            </div>

            {/* Company cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
              {middleCards.map((entry: any, idx: number) => (
                <div key={idx} style={{ ...leftCard, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 185 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                      <CompanyLogo name={entry.companyName} size={40}/>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 1 }}>Hire Score</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(entry.score || 0), lineHeight: 1 }}>
                          {entry.score || 0}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/100</span>
                        </div>
                      </div>
                    </div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>{entry.companyName}</h4>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Signals</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {getSignals(entry).map((sig, sIdx) => (
                        <span key={sIdx} style={{ background: sig.bg, color: sig.color, fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 500 }}>{sig.label}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/results?name=${entry.companyName}`)} style={{ background: 'none', border: 'none', color: '#2dd4bf', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: 10 }}>
                    Analyze →
                  </button>
                </div>
              ))}
            </div>

            {/* Explore section */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Explore and Compare Companies</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {exploreCards.map((comp, idx) => (
                <div key={idx} onClick={() => navigate(`/results?name=${comp.name}`)}
                  style={{ ...leftCard, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.18s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = CARD_BG)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <CompanyLogo name={comp.name} size={32}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{comp.name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(comp.score) }}>{comp.score}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────── */}
        {/* Light blue-grey — significantly lighter than left panel */}
        <div style={{
          flex: 1,
          background: `linear-gradient(160deg, #a8cdd8 0%, #8fb8c8 40%, #7aaabb 100%)`,
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          padding: '2rem 2rem 2rem 1.5rem',
          overflow: 'hidden',
        }}>
          {/* Right panel network canvas — darker dots visible on light bg */}
          <canvas ref={rightCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}/>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hero search bar — at top of right panel */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} fill="none" stroke="rgba(0,0,0,0.35)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHeroSearch()}
                  placeholder="Find your next company to watch..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 7, padding: '9px 12px 9px 32px', fontSize: 13, color: '#1a3a45', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>
              <button onClick={handleHeroSearch} style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Search
              </button>
            </div>

            {/* Optimize with AI card — white on the light right panel */}
            <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0d2535', margin: '0 0 3px' }}>
                Optimize Your Application with AI
              </h2>
              <p style={{ fontSize: 12, color: '#3a6070', margin: '0 0 14px' }}>
                Upload your resume to match your skills to live job postings.
              </p>
              <label style={{ border: '1.5px dashed rgba(0,80,100,0.25)', borderRadius: 10, padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }}/>
                <svg style={{ width: 24, height: 24, marginBottom: 8 }} fill="none" stroke="rgba(0,80,100,0.45)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                <span style={{ fontSize: 13, color: '#1a4050', fontWeight: 500 }}>
                  Drag & drop or upload resume to match your skills.
                </span>
                <span style={{ fontSize: 11, color: '#4a7080', marginTop: 4 }}>
                  PDF or DOCX · max 5 MB
                </span>
              </label>
              {detectedSkills.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detectedSkills.map((s, i) => (
                    <span key={i} style={{ background: 'rgba(15,118,110,0.12)', color: '#0f766e', fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 500, border: '1px solid rgba(15,118,110,0.2)' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: `linear-gradient(90deg, #091e2a 0%, #0d3040 50%, #7aaabb 100%)`, borderTop: '1px solid rgba(0,0,0,0.2)', padding: '14px 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 4 }}>
          {['About', 'Terms of Service', 'Privacy Policy', 'Support'].map((l, i) => (
            <React.Fragment key={l}>
              <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{l}</a>
              {i < 3 && <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>|</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          © 2024 Hire Signal, Inc. – Project by Bharath Reddy Kalva
        </div>
      </footer>
    </div>
  );
}
