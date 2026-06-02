import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { saveSearch } from '../lib/searchHistory';
import GitHubChart from '../components/GitHubChart';
import JobsChart from '../components/JobsChart';
import Navbar from '../components/Navbar';
import ScoreGauge from '../components/ScoreGauge';
import SkeletonDashboard from '../components/SkeletonDashboard';
import ScoreHistoryChart from '../components/ScoreHistoryChart';
import type { CompanyAnalysis, FitScoreResult, ScoreHistoryEntry } from '../lib/api';
import { analyzeCompany, getCompanyHistory, getFitScore, addToWatchlist } from '../lib/api';

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

function scoreColor(s: number) {
  if (s >= 71) return '#16a34a';
  if (s >= 41) return '#d97706';
  return '#dc2626';
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso?.slice(0, 10) ?? '';
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreCard({ label, score, metric, accent }: {
  label: string; score: number; metric: string; accent: string;
}) {
  return (
    <div style={{ ...CARD, borderTop: `2px solid ${accent}`, padding: '20px' }}>
      <p style={{ color: SUBTLE, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        {label}
      </p>
      <p style={{ color: accent, fontSize: '30px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>
        {score}<span style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500 }}>/100</span>
      </p>
      <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '11px', letterSpacing: '-0.01em' }}>{metric}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ ...CARD, padding: '22px' }}>
      <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '6px' }}>
        {title.toUpperCase()}
      </p>
      <p style={{ color: SUBTLE, fontSize: '12px', marginBottom: '18px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function NewsRow({ article, index }: {
  article: { title: string; source: string; publishedAt: string; url: string };
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 18px',
        background: hovered ? '#f8faff' : '#ffffff',
        border: BORDER,
        borderLeft: `3px solid ${BLUE}`,
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'background 0.12s, box-shadow 0.12s',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: '11px', color: SUBTLE, flexShrink: 0, minWidth: '20px' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: hovered ? TEXT : '#1e293b',
          fontSize: '14px',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '4px',
        }}>
          {article.title}
        </p>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, color: BLUE, fontSize: '10px', fontWeight: 600, letterSpacing: '-0.01em' }}>{article.source}</span>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <span style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px' }}>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
      <ArrowUpRight size={15} color={hovered ? BLUE : '#cbd5e1'} style={{ flexShrink: 0, transition: 'color 0.12s' }} />
    </a>
  );
}

// Mini SVG ring gauge for the verdict bar
function MiniGauge({ score, color }: { score: number; color: string }) {
  const R = 16;
  const CIRC = 2 * Math.PI * R;
  const TRACK = CIRC * 0.75;
  const GAP   = CIRC - TRACK;
  const arc   = TRACK * (score / 100);
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={R} fill="none"
        stroke="#e2e8f0" strokeWidth="3"
        strokeDasharray={`${TRACK} ${GAP}`}
        transform="rotate(135 22 22)" />
      <circle cx="22" cy="22" r={R} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${arc} ${CIRC}`}
        strokeLinecap="round"
        transform="rotate(135 22 22)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  );
}

function VerdictBar({ score }: { score: number }) {
  const cfg =
    score >= 71
      ? { label: 'Strong Apply Signal', message: 'Engineering momentum and hiring activity are both high. This is a good window to apply.', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
      : score >= 41
        ? { label: 'Moderate Signal', message: 'Some positive indicators. Apply with a tailored pitch that speaks to their current growth phase.', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
        : { label: 'Weak Signal', message: 'Limited activity across signals. Research more before committing time to an application.', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      padding: '18px 24px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: '0 8px 8px 0',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ color: cfg.color, fontWeight: 700, fontSize: '15px', marginBottom: '3px' }}>{cfg.label}</p>
        <p style={{ color: MUTED, fontSize: '13px' }}>{cfg.message}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ color: cfg.color, fontWeight: 800, fontSize: '26px', lineHeight: 1 }}>
          {score}<span style={{ color: cfg.color, opacity: 0.45, fontSize: '13px' }}>/100</span>
        </span>
        <MiniGauge score={score} color={cfg.color} />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <AlertCircle size={22} color="#dc2626" />
      </div>
      <h2 style={{ color: TEXT, fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Analysis Failed</h2>
      <p style={{ color: MUTED, fontSize: '14px', maxWidth: '380px', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
      <button onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: TEXT, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

// ── WatchButton ───────────────────────────────────────────────────────────────

const LS_EMAIL_KEY = 'hs_email';

function WatchButton({ companyName }: { companyName: string }) {
  const [email, setEmail]           = useState(() => localStorage.getItem(LS_EMAIL_KEY) ?? '');
  const [showForm, setShowForm]     = useState(false);
  const [watching, setWatching]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await addToWatchlist(email.trim(), companyName);
      localStorage.setItem(LS_EMAIL_KEY, email.trim());
      setWatching(true);
      setShowForm(false);
      setMsg(res.alreadyWatching
        ? `Already watching ${companyName}`
        : `Added! You'll get weekly updates at ${email.trim()}`);
    } catch {
      setMsg('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (watching || msg) {
    return (
      <p style={{ fontFamily: MONO, color: '#16a34a', fontSize: '11px', marginTop: '12px' }}>
        {msg || `Watching ${companyName} ✓`}
      </p>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={(e) => { void submit(e); }} style={{ marginTop: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            padding: '7px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '13px',
            color: TEXT,
            outline: 'none',
            width: '200px',
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '7px 14px', background: TEXT, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          {submitting ? '…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          style={{ padding: '7px 10px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: SUBTLE, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      style={{
        marginTop: '12px',
        padding: '6px 14px',
        background: 'none',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color: MUTED,
        cursor: 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE; (e.currentTarget as HTMLButtonElement).style.color = BLUE; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
    >
      + Watch
    </button>
  );
}

// ── FitScoreCard ──────────────────────────────────────────────────────────────

function fitPill(pct: number): React.CSSProperties {
  if (pct >= 80) return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' };
  if (pct >= 50) return { color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' };
  return             { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' };
}

function FitScoreCard({
  skills,
  fitScore,
  loading,
}: {
  skills: string[];
  fitScore: FitScoreResult | null;
  loading: boolean;
}) {
  const sk = { background: '#f1f5f9', borderRadius: '3px' } as React.CSSProperties;

  // No resume: prompt to upload
  if (!skills.length) {
    return (
      <div className="animate-fade-in-up delay-200" style={{ ...CARD, padding: '22px' }}>
        <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '10px' }}>
          JOB ROLE FIT
        </p>
        <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.6 }}>
          Upload your resume on the home page to see personalized job fit scores.
        </p>
      </div>
    );
  }

  // Loading skeleton
  if (loading || !fitScore) {
    return (
      <div className="animate-fade-in-up delay-200" style={{ ...CARD, padding: '22px' }}>
        <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '14px' }}>
          JOB ROLE FIT
        </p>
        <div style={{ ...sk, height: '28px', width: '140px', marginBottom: '20px' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: '14px 0', borderTop: i ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ ...sk, height: '20px', flex: 1 }} />
            <div style={{ ...sk, height: '22px', width: '48px', borderRadius: '100px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!fitScore.jobs.length) {
    return (
      <div className="animate-fade-in-up delay-200" style={{ ...CARD, padding: '22px' }}>
        <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '10px' }}>JOB ROLE FIT</p>
        <p style={{ color: MUTED, fontSize: '14px' }}>No job listings found to match against. Try again later.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up delay-200" style={{ ...CARD, padding: '22px' }}>
      <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '8px' }}>
        JOB ROLE FIT
      </p>

      {/* Average fit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
        <span style={{ color: BLUE, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>
          {fitScore.averageFit}%
        </span>
        <span style={{ color: SUBTLE, fontSize: '13px' }}>average role fit</span>
      </div>
      <p style={{ color: SUBTLE, fontSize: '12px', marginBottom: '20px' }}>
        Based on your resume matched against {fitScore.jobs.length} live job listing{fitScore.jobs.length !== 1 ? 's' : ''}
      </p>

      {/* Job rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {fitScore.jobs.map((job, i) => (
          <div
            key={i}
            style={{
              padding: '14px 0',
              borderTop: i ? '1px solid #f1f5f9' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT, fontWeight: 600, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.title}
                </p>
                <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px' }}>{job.company}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{
                  ...fitPill(job.matchPercentage),
                  fontFamily: MONO,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '100px',
                }}>
                  {job.matchPercentage}%
                </span>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: MONO, color: BLUE, fontSize: '11px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  View Job →
                </a>
              </div>
            </div>

            {/* Matched skill tags — fall back to [general-match] when min-score applied */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {job.matchedSkills.length > 0
                ? job.matchedSkills.map((s) => (
                    <span key={s} style={{
                      fontFamily: MONO,
                      fontSize: '10px',
                      color: BLUE,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}>
                      {s.toLowerCase()}
                    </span>
                  ))
                : (
                  <span style={{
                    fontFamily: MONO,
                    fontSize: '10px',
                    color: SUBTLE,
                    background: '#f8f9ff',
                    border: '1px solid #e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}>
                    general-match
                  </span>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user }     = useUser();
  const name   = searchParams.get('name') ?? '';
  const skills = (searchParams.get('skills') ?? '').split(',').filter(Boolean);

  const [data, setData]         = useState<CompanyAnalysis | null>(null);
  const [history, setHistory]   = useState<ScoreHistoryEntry[]>([]);
  const [fitScore, setFitScore] = useState<FitScoreResult | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!name.trim()) { navigate('/dashboard'); return; }
    setLoading(true);
    setError(null);
    setData(null);
    setFitScore(null);
    try {
      const token = await getToken();
      // Fetch analysis + history in parallel; fit score fetched separately below
      const [result, hist] = await Promise.all([
        analyzeCompany(name, skills.length ? skills : undefined, token),
        getCompanyHistory(name),
      ]);
      setData(result);
      setHistory(hist);

      // Persist to per-user localStorage history
      if (user?.id) {
        saveSearch(user.id, {
          companyName: result.company.name || name,
          score:       result.score,
          githubScore: result.scoreBreakdown.github,
          jobsScore:   result.scoreBreakdown.jobs,
          newsScore:   result.scoreBreakdown.news,
          signal:      result.score >= 71 ? 'Strong' : result.score >= 41 ? 'Moderate' : 'Weak',
          date:        new Date().toISOString().split('T')[0],
        });
      }

      // Fetch fit score in parallel only when resume skills are present
      if (skills.length) {
        setFitLoading(true);
        getFitScore(name, skills)
          .then(setFitScore)
          .catch(() => setFitScore({ jobs: [], averageFit: 0 }))
          .finally(() => setFitLoading(false));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze company');
    } finally {
      setLoading(false);
    }
  }, [name, skills.join(','), navigate, getToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <div className="dot-grid" style={{ minHeight: '100vh' }}>
      <Navbar companyName={name} score={data?.score} />

      {loading && <SkeletonDashboard />}
      {error && !loading && <ErrorState message={error} onRetry={fetchData} />}

      {data && !loading && (
        <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '44px 32px 80px', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* ── Company + Gauge ─────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up"
            style={{ ...CARD, padding: '36px', display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              {/* Monospace analyzing tag */}
              <span style={{
                fontFamily: MONO,
                fontSize: '11px',
                color: SUBTLE,
                background: '#f1f5f9',
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '12px',
                letterSpacing: '-0.01em',
              }}>
                [ analyzing: {name.toLowerCase()} ]
              </span>

              <h1 style={{ color: TEXT, fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.1 }}>
                {capitalize(data.company.name || name)}
              </h1>
              <p style={{ color: MUTED, fontSize: '13px' }}>
                Scored across GitHub activity, job postings, and news coverage
              </p>

              {/* Back link */}
              <button
                onClick={() => navigate('/dashboard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: SUBTLE, fontSize: '12px' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = TEXT)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = SUBTLE)}
              >
                <ArrowLeft size={12} /> Search again
              </button>

              {/* Watch button */}
              <WatchButton companyName={data.company.name || name} />
            </div>
            <div style={{ flexShrink: 0 }}>
              <ScoreGauge score={data.score} size={180} />
            </div>
          </div>

          {/* ── Skills relevance banner (only when resume was uploaded) ── */}
          {(skills.length > 0 || data.relevanceNote) && (
            <div
              className="animate-fade-in-up delay-100"
              style={{
                padding: '12px 18px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderLeft: `3px solid ${BLUE}`,
                borderRadius: '0 8px 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontFamily: MONO, color: BLUE, fontSize: '10px', letterSpacing: '0.08em', flexShrink: 0 }}>
                PROFILE MATCH
              </span>
              <span style={{ color: MUTED, fontSize: '13px', flex: 1 }}>
                Showing jobs relevant to your profile:{' '}
                <strong style={{ color: TEXT }}>
                  {skills.slice(0, 3).join(' · ')}
                </strong>
              </span>
            </div>
          )}

          {/* ── Score Breakdown ─────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-200"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}
          >
            <ScoreCard label="GitHub Score"
              score={data.scoreBreakdown.github}
              metric={`${data.github.commits30d.toLocaleString()} commits`}
              accent={BLUE} />
            <ScoreCard label="Jobs Score"
              score={data.scoreBreakdown.jobs}
              metric={
                data.relevanceNote
                  ? `${data.jobs.jobs30d.toLocaleString()} relevant postings`
                  : `${data.jobs.jobs30d.toLocaleString()} postings`
              }
              accent="#10b981" />
            <ScoreCard label="News Score"
              score={data.scoreBreakdown.news}
              metric={`${data.news.length} article${data.news.length !== 1 ? 's' : ''}`}
              accent="#7c3aed" />
          </div>

          {/* ── Job Role Fit ────────────────────────────────────────────── */}
          <FitScoreCard
            skills={skills}
            fitScore={fitScore}
            loading={fitLoading}
          />

          {/* ── Score History ───────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-300" style={{ ...CARD, padding: '22px' }}>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '6px' }}>
              SCORE TREND / LAST 30 SEARCHES
            </p>
            {history.length >= 2 ? (
              <ScoreHistoryChart history={history} />
            ) : (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <p style={{ color: MUTED, fontSize: '14px', marginBottom: '4px' }}>
                  Score history builds over time.
                </p>
                <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '11px' }}>
                  Check back tomorrow to see this company's trend.
                </p>
              </div>
            )}
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-400"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}
          >
            <ChartCard title="Job Posting Trend / 90 Days" subtitle="Cumulative postings mentioning this company">
              <JobsChart jobs={data.jobs} />
            </ChartCard>
            <ChartCard title="GitHub Commit Activity / 90 Days" subtitle="Cumulative commits across org repositories">
              <GitHubChart github={data.github} />
            </ChartCard>
          </div>

          {/* ── AI Insight ──────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-500"
            style={{
              ...CARD,
              padding: '24px',
              background: '#f8faff',
              borderLeft: `3px solid ${BLUE}`,
              borderRadius: '0 12px 12px 0',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: TEXT, fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>AI Insight</p>
              <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '-0.01em' }}>Groq · llama-3.1-8b-instant</p>
            </div>
            <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '10px' }}>
              AI ANALYSIS
            </p>
            <p style={{
              color: MUTED,
              fontSize: '15px',
              lineHeight: 1.75,
              fontStyle: 'italic',
            }}>
              {data.summary}
            </p>
          </div>

          {/* ── News Feed ───────────────────────────────────────────────── */}
          {data.news.length > 0 && (
            <div className="animate-fade-in-up delay-600">
              <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '10px', letterSpacing: '0.1em', marginBottom: '14px' }}>
                SOURCE INTELLIGENCE
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.news.map((article, i) => (
                  <NewsRow key={i} article={article} index={i} />
                ))}
              </div>
            </div>
          )}

          {data.news.length === 0 && (
            <div className="animate-fade-in-up delay-600" style={{ ...CARD, padding: '20px' }}>
              <p style={{ fontFamily: MONO, color: SUBTLE, fontSize: '11px' }}>no recent articles found</p>
            </div>
          )}

          {/* ── Verdict ─────────────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-600" style={{ marginTop: '4px' }}>
            <VerdictBar score={data.score} />
          </div>

          {/* ── Score weight footnote ────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '8px', borderTop: BORDER }}>
            {([
              ['jobs (40%)', data.scoreBreakdown.jobs, scoreColor(data.score)],
              ['github (35%)', data.scoreBreakdown.github, BLUE],
              ['news (25%)', data.scoreBreakdown.news, '#7c3aed'],
            ] as [string, number, string][]).map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: MONO, color: SUBTLE, fontSize: '11px' }}>{label}:</span>
                <span style={{ color, fontWeight: 700, fontSize: '14px' }}>{val}</span>
              </div>
            ))}
          </div>

        </main>
      )}
    </div>
  );
}
