const API_BASE = '/api';

// ── Auth helpers ──────────────────────────────────────────────────────────────
// Pass a Clerk session token (from useAuth().getToken()) to protect API calls.
export function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── User Profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  skills: string[];
  email:  string;
}

export async function getProfile(token: string): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: authHeaders(token),
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<UserProfile>;
}

export async function saveProfile(
  token: string,
  email: string,
  skills: string[],
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ email, skills }),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json() as Promise<UserProfile>;
}

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
  relevanceNote?: string;
}

export interface ResumeParseResult {
  skills: string[];
  jobTitles: string[];
  yearsOfExperience: number;
}

export async function analyzeCompany(
  name: string,
  skills?: string[],
  token?: string | null,
): Promise<CompanyAnalysis> {
  const params = new URLSearchParams({ name });
  if (skills?.length) params.set('skills', skills.join(','));
  const res = await fetch(`${API_BASE}/companies/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json() as Promise<CompanyAnalysis>;
}

export interface ScoreHistoryEntry {
  date: string;        // "2026-05-01"
  score: number;
  githubScore: number;
  jobsScore: number;
  newsScore: number;
}

export interface RecentEntry {
  companyName: string;
  score:       number;
  createdAt:   string;
}

export async function getRecentHistory(token?: string | null): Promise<RecentEntry[]> {
  const res = await fetch(`${API_BASE}/companies/history/recent`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return [];
  return res.json() as Promise<RecentEntry[]>;
}

export async function getCompanyHistory(name: string): Promise<ScoreHistoryEntry[]> {
  const params = new URLSearchParams({ name });
  const res = await fetch(`${API_BASE}/companies/history?${params.toString()}`);
  if (!res.ok) return [];
  return res.json() as Promise<ScoreHistoryEntry[]>;
}

export interface CompareResult {
  companies: CompanyAnalysis[];
  comparison: string;
}

export async function compareCompanies(names: string[]): Promise<CompareResult> {
  const params = new URLSearchParams({ companies: names.join(',') });
  const res = await fetch(`${API_BASE}/companies/compare?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json() as Promise<CompareResult>;
}

export interface FitResult {
  title:           string;
  company:         string;
  matchPercentage: number;
  matchedSkills:   string[];
  url:             string;
}

export interface FitScoreResult {
  jobs:       FitResult[];
  averageFit: number;
}

// ── Watchlist ──────────────────────────────────────────────────────────────

export interface WatchlistEntry {
  companyName: string;
  score:       number | null;
  githubScore: number | null;
  jobsScore:   number | null;
  newsScore:   number | null;
  addedAt:     string;
}

export async function addToWatchlist(email: string, companyName: string) {
  const res = await fetch(`${API_BASE}/watchlist/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, companyName }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json() as Promise<{ message: string; company: string; alreadyWatching: boolean }>;
}

export async function getWatchlist(email: string): Promise<WatchlistEntry[]> {
  const params = new URLSearchParams({ email });
  const res = await fetch(`${API_BASE}/watchlist?${params.toString()}`);
  if (!res.ok) return [];
  return res.json() as Promise<WatchlistEntry[]>;
}

export async function removeFromWatchlist(email: string, companyName: string) {
  const res = await fetch(`${API_BASE}/watchlist/remove`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, companyName }),
  });
  if (!res.ok) return { message: 'error' };
  return res.json() as Promise<{ message: string }>;
}

export async function getFitScore(
  companyName: string,
  skills: string[],
): Promise<FitScoreResult> {
  const res = await fetch(`${API_BASE}/companies/fit-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName, skills }),
  });
  if (!res.ok) return { jobs: [], averageFit: 0 };
  return res.json() as Promise<FitScoreResult>;
}

export async function uploadResume(file: File, token?: string | null): Promise<ResumeParseResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/resume/upload`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Upload failed: ${res.status}`);
  }
  return res.json() as Promise<ResumeParseResult>;
}
