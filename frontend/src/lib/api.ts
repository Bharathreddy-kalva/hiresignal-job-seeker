const API_BASE = '/api';

export interface GithubActivity {
  commits30d: number;
  commits60d: number;
  commits90d: number;
}

export interface JobActivity {
  jobs30d: number;
  jobs60d: number;
  jobs90d: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface ScoreBreakdown {
  jobs: number;
  github: number;
  news: number;
}

export interface CompanyAnalysis {
  company: { id: string; name: string };
  github: GithubActivity;
  jobs: JobActivity;
  news: NewsArticle[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  summary: string;
}

export async function analyzeCompany(name: string): Promise<CompanyAnalysis> {
  const res = await fetch(
    `${API_BASE}/companies/search?name=${encodeURIComponent(name)}`,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json() as Promise<CompanyAnalysis>;
}
