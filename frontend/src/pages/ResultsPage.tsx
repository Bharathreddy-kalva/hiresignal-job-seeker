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

// ── helpers ───────────────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(30,41,59,0.55)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: '16px',
};

function scoreColor(s: number) {
  if (s >= 71) return '#10b981';
  if (s >= 41) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function ScoreCard({
  icon: Icon,
  label,
  score,
  metric,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  metric: string;
  accent: string;
}) {
  return (
    <div
      style={{
        ...glass,
        padding: '24px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accent}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={20} color={accent} />
      </div>
      <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ color: accent, fontSize: '36px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>
        {score}
        <span style={{ color: '#334155', fontSize: '18px', fontWeight: 500 }}>/100</span>
      </p>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>{metric}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...glass, padding: '28px' }}>
      <p style={{ color: 'white', fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>
        {title}
      </p>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}

function NewsCard({
  article,
}: {
  article: { title: string; source: string; publishedAt: string; url: string };
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
        ...glass,
        padding: '20px',
        display: 'block',
        textDecoration: 'none',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        borderColor: hovered ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.08)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '100px',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#93c5fd',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {article.source}
            </span>
            <span style={{ color: '#475569', fontSize: '12px' }}>
              {formatDate(article.publishedAt)}
            </span>
          </div>
          <p
            style={{
              color: hovered ? '#e2e8f0' : '#cbd5e1',
              fontSize: '14px',
              lineHeight: 1.55,
              fontWeight: 500,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              transition: 'color 0.15s',
            }}
          >
            {article.title}
          </p>
        </div>
        <ArrowUpRight
          size={18}
          color={hovered ? '#3b82f6' : '#334155'}
          style={{ flexShrink: 0, marginTop: '2px', transition: 'color 0.15s' }}
        />
      </div>
    </a>
  );
}

function VerdictBanner({ score }: { score: number }) {
  const config =
    score >= 71
      ? {
          emoji: '🚀',
          label: 'Strong Apply Signal',
          message:
            'This company shows strong growth momentum. Engineering activity is high, hiring is active — now is an excellent time to apply.',
          color: '#10b981',
          bg: 'rgba(16,185,129,0.08)',
          border: 'rgba(16,185,129,0.25)',
        }
      : score >= 41
        ? {
            emoji: '⚡',
            label: 'Moderate Signal',
            message:
              'There are positive indicators here. Consider applying with a tailored pitch that speaks to their current growth phase.',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
          }
        : {
            emoji: '⚠️',
            label: 'Weak Signal',
            message:
              'Limited activity detected across signals. Do additional research before investing significant time in an application.',
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.2)',
          };

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '32px 36px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `${config.color}18`,
          border: `1px solid ${config.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          flexShrink: 0,
        }}
      >
        {config.emoji}
      </div>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ color: config.color, fontWeight: 800, fontSize: '22px', marginBottom: '6px' }}>
          {config.label}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6 }}>
          {config.message}
        </p>
      </div>
      <div
        style={{
          padding: '10px 20px',
          borderRadius: '10px',
          background: `${config.color}15`,
          border: `1px solid ${config.color}30`,
          flexShrink: 0,
        }}
      >
        <span style={{ color: config.color, fontSize: '32px', fontWeight: 900 }}>
          {score}
        </span>
        <span style={{ color: config.color, opacity: 0.6, fontSize: '16px' }}>/100</span>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <AlertCircle size={28} color="#ef4444" />
      </div>
      <h2 style={{ color: 'white', fontWeight: 700, fontSize: '22px', marginBottom: '10px' }}>
        Analysis Failed
      </h2>
      <p
        style={{
          color: '#64748b',
          fontSize: '15px',
          maxWidth: '420px',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <RefreshCw size={16} />
        Retry
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
      const result = await analyzeCompany(name);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze company');
    } finally {
      setLoading(false);
    }
  }, [name, navigate]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar companyName={name} score={data?.score} />

      {loading && <SkeletonDashboard />}

      {error && !loading && <ErrorState message={error} onRetry={fetchData} />}

      {data && !loading && (
        <main
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '40px 24px 80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* ── Score Hero ─────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up"
            style={{
              ...glass,
              padding: '48px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background glow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${scoreColor(data.score)}10 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, position: 'relative' }}>
              HireSignal Analysis
            </p>
            <h1
              style={{
                color: 'white',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {data.company.name || name}
            </h1>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <ScoreGauge score={data.score} />
            </div>
          </div>

          {/* ── Score Breakdown ────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-100"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <ScoreCard
              icon={GitBranch}
              label="GitHub Score"
              score={data.scoreBreakdown.github}
              metric={`${data.github.commits30d.toLocaleString()} commits in 30d`}
              accent="#3b82f6"
            />
            <ScoreCard
              icon={Briefcase}
              label="Jobs Score"
              score={data.scoreBreakdown.jobs}
              metric={`${data.jobs.jobs30d.toLocaleString()} postings in 30d`}
              accent="#10b981"
            />
            <ScoreCard
              icon={Newspaper}
              label="News Score"
              score={data.scoreBreakdown.news}
              metric={`${data.news.length} recent article${data.news.length !== 1 ? 's' : ''} found`}
              accent="#a78bfa"
            />
          </div>

          {/* ── Charts ─────────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-200"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}
          >
            <ChartCard
              title="Job Posting Trend"
              subtitle="Cumulative postings mentioning this company"
            >
              <JobsChart jobs={data.jobs} />
            </ChartCard>
            <ChartCard
              title="GitHub Commit Activity"
              subtitle="Cumulative commits across org repositories"
            >
              <GitHubChart github={data.github} />
            </ChartCard>
          </div>

          {/* ── AI Insight ─────────────────────────────────────────────── */}
          <div
            className="animate-fade-in-up delay-300"
            style={{
              ...glass,
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative sparkle bg */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(167,139,250,0.15)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#a78bfa" />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>
                  AI Insight
                </p>
                <p style={{ color: '#475569', fontSize: '12px' }}>Powered by Groq · llama3-8b</p>
              </div>
            </div>
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '16px',
                lineHeight: 1.8,
                fontStyle: 'italic',
                borderLeft: '3px solid rgba(167,139,250,0.4)',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              {data.summary}
            </p>
          </div>

          {/* ── News Feed ──────────────────────────────────────────────── */}
          {data.news.length > 0 && (
            <div className="animate-fade-in-up delay-400">
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Newspaper size={18} color="#64748b" />
                <p style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>Recent News</p>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '100px',
                    background: 'rgba(148,163,184,0.1)',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {data.news.length}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '14px',
                }}
              >
                {data.news.map((article, i) => (
                  <NewsCard key={i} article={article} />
                ))}
              </div>
            </div>
          )}

          {data.news.length === 0 && (
            <div
              className="animate-fade-in-up delay-400"
              style={{
                ...glass,
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <Newspaper size={32} color="#334155" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#475569', fontSize: '15px' }}>
                No recent news articles found for this company.
              </p>
            </div>
          )}

          {/* ── Verdict ────────────────────────────────────────────────── */}
          <div className="animate-fade-in-up delay-500">
            <VerdictBanner score={data.score} />
          </div>
        </main>
      )}
    </div>
  );
}
