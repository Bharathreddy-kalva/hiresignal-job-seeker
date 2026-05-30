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

export interface SignalData {
  company: string;
  github: GithubActivity;
  jobs: JobActivity;
  news: NewsArticle[];
}

export interface ScoreBreakdown {
  jobs: number;
  github: number;
  news: number;
}

export interface HireSignalResult {
  company: { id: string; name: string };
  github: GithubActivity;
  jobs: JobActivity;
  news: NewsArticle[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  summary: string;
}
