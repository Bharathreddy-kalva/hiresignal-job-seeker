import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  GitBranch,
  Newspaper,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GitHubChart from '../components/GitHubChart';
import JobsChart from '../components/JobsChart';
import Navbar from '../components/Navbar';
import ScoreGauge from '../components/ScoreGauge';
import SkeletonDashboard from '../components/SkeletonDashboard';
import type { CompanyAnalysis } from '../lib/api';
import { analyzeCompany } from '../lib/api';

// ── design tokens ─────────────────────────────────────────────────────────────
const TEXT   = '#0f172a';
const MUTED  = '#64748b';
const SUBTLE = '#94a3b8';
const BLUE   = '#2563eb';
const BORDER = '1px solid #e2e8f0';

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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso?.slice(0, 10) ?? '';
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreCard({ icon: Icon, label, score, metric, accent }: {
  icon: React.ElementType; label: string; score: number; metric: string; accent: string;
}) {
  return (
    <div style={{ ...CARD, borderTop: `2px solid ${accent}`, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <Icon size={14} color={accent} />
        <p style={{ color: SUBTLE, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      </div>
      <p style={{ color: accent, fontSize: '30px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>
        {score}<span style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500 }}>/100</span>
      </p>
      <p style={{ color: SUBTLE, fontSize: '12px' }}>{metric}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ ...CARD, padding: '22px' }}>
      <p style={{ color: TEXT, fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{title}</p>
      <p style={{ color: SUBTLE, fontSize: '12px', marginBottom: '18px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function NewsRow({ article }: { article: { title: string; source: string; publishedAt: string; url: string } }) {
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
          <span style={{ color: BLUE, fontSize: '11px', fontWeight: 600 }}>{article.source}</span>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <span style={{ color: SUBTLE, fontSize: '11px' }}>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
      <ArrowUpRight size={15} color={hovered ? BLUE : '#cbd5e1'} style={{ flexShrink: 0, transition: 'color 0.12s' }} />
    </a>
  );
}

function VerdictBar({ score }: { score: number }) {
  const cfg =
    score >= 71
      ? { emoji: '🚀', label: 'Strong Apply Signal', message: 'Engineering momentum and hiring activity are both high. This is a good window to apply.', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
      : score >= 41
        ? { emoji: '⚡', label: 'Moderate Signal', message: 'Some positive indicators. Apply with a tailored pitch that speaks to their current growth phase.', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
        : { emoji: '⚠️', label: 'Weak Signal', message: 'Limited activity across signals. Research more before committing time to an application.', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: '0 8px 8px 0',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '17px', flexShrink: 0 }}>{cfg.emoji}</span>
      <span style={{ color: cfg.color, fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>{cfg.label}</span>
      <span style={{ color: MUTED, fontSize: '13px', flex: 1, minWidth: '160px' }}>{cfg.message}</span>
      <span style={{ color: cfg.color, fontWeight: 800, fontSize: '24px', flexShrink: 0 }}>
        {score}<span style={{ color: cfg.color, opacity: 0.5, fontSize: '13px' }}>/100</span>
      </span>
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
      <button onClick={onRetry} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: BLUE, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const name = searchParams.get('name') ?? '';

  const [data, setData] = useState<CompanyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!name.trim()) { navigate('/'); return; }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await analyzeCompany(name));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze company');
    } finally {
      setLoading(false);
    }
  }, [name, navigate]);

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
            style={{
              ...CARD,
              padding: '36px 36px',
              display: 'flex',
              alignItems: 'center',
              gap: '48px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: SUBTLE, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                HireSignal Analysis
              </p>
              <h1 style={{ color: TEXT, fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.1 }}>
                {data.company.name || name}
              </h1>
              <p style={{ color: MUTED, fontSize: '13px', marginBottom: '20px' }}>
                Scored across GitHub activity, job postings, and news coverage
              </p>
              {/* Inline score chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'GitHub', val: data.scoreBreakdown.github, color: BLUE },
                  { label: 'Jobs',   val: data.scoreBreakdown.jobs,   color: '#10b981' },
                  { label: 'News',   val: data.scoreBreakdown.news,   color: '#7c3aed' },
                ].map(chip => (
                  <span key={chip.label} style={{
                    padding: '4px 12px',
                    background: `${chip.color}0d`,
                    border: `1px solid ${chip.color}30`,
                    borderRadius: '20px',
                    color: chip.color,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {chip.label}: {chip.val}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <ScoreGauge score={data.score} size={180} />
            </div>
          </div>

          {/* ── Score Breakdown ─────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-100"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}
          >
            <ScoreCard icon={GitBranch} label="GitHub Score"
              score={data.scoreBreakdown.github}
              metric={`${data.github.commits30d.toLocaleString()} commits / 30d`}
              accent={BLUE} />
            <ScoreCard icon={Briefcase} label="Jobs Score"
              score={data.scoreBreakdown.jobs}
              metric={`${data.jobs.jobs30d.toLocaleString()} postings / 30d`}
              accent="#10b981" />
            <ScoreCard icon={Newspaper} label="News Score"
              score={data.scoreBreakdown.news}
              metric={`${data.news.length} recent article${data.news.length !== 1 ? 's' : ''}`}
              accent="#7c3aed" />
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-200"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}
          >
            <ChartCard title="Job Posting Trend" subtitle="Cumulative postings mentioning this company">
              <JobsChart jobs={data.jobs} />
            </ChartCard>
            <ChartCard title="GitHub Commit Activity" subtitle="Cumulative commits across org repositories">
              <GitHubChart github={data.github} />
            </ChartCard>
          </div>

          {/* ── AI Insight ──────────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-300" style={{ ...CARD, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#7c3aed" />
              </div>
              <div>
                <p style={{ color: TEXT, fontWeight: 600, fontSize: '14px', lineHeight: 1 }}>AI Insight</p>
                <p style={{ color: SUBTLE, fontSize: '11px' }}>Groq · llama-3.1-8b-instant</p>
              </div>
            </div>
            <p style={{
              color: MUTED,
              fontSize: '15px',
              lineHeight: 1.75,
              fontStyle: 'italic',
              borderLeft: '3px solid #e9d5ff',
              paddingLeft: '16px',
            }}>
              {data.summary}
            </p>
          </div>

          {/* ── News Feed ───────────────────────────────────────────────── */}
          {data.news.length > 0 && (
            <div className="animate-fade-in-up delay-400">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Newspaper size={14} color={SUBTLE} />
                <p style={{ color: TEXT, fontWeight: 600, fontSize: '14px' }}>Recent News</p>
                <span style={{ color: SUBTLE, fontSize: '12px' }}>— {data.news.length} articles</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.news.map((article, i) => (
                  <NewsRow key={i} article={article} />
                ))}
              </div>
            </div>
          )}

          {data.news.length === 0 && (
            <div className="animate-fade-in-up delay-400" style={{ ...CARD, padding: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Newspaper size={15} color="#cbd5e1" />
              <p style={{ color: SUBTLE, fontSize: '14px' }}>No recent news articles found for this company.</p>
            </div>
          )}

          {/* ── Verdict ─────────────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-500">
            <VerdictBar score={data.score} />
          </div>

          {/* ── Score detail footer ─────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '8px', borderTop: BORDER }}>
            {([
              ['Jobs (40%)', data.scoreBreakdown.jobs, scoreColor(data.score)],
              ['GitHub (35%)', data.scoreBreakdown.github, BLUE],
              ['News (25%)', data.scoreBreakdown.news, '#7c3aed'],
            ] as [string, number, string][]).map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ color: SUBTLE, fontSize: '12px' }}>{label}:</span>
                <span style={{ color, fontWeight: 700, fontSize: '14px' }}>{val}</span>
              </div>
            ))}
          </div>

        </main>
      )}
    </div>
  );
}
