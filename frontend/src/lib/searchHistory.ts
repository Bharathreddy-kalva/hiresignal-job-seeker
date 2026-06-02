const HISTORY_KEY_PREFIX = 'hs_searches_';

export interface SearchEntry {
  companyName: string;
  score:       number;
  githubScore: number;
  jobsScore:   number;
  newsScore:   number;
  signal:      string;
  date:        string; // "YYYY-MM-DD"
}

export function getHistoryKey(userId: string): string {
  return `${HISTORY_KEY_PREFIX}${userId}`;
}

export function getSearchHistory(userId: string): SearchEntry[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    return raw ? (JSON.parse(raw) as SearchEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveSearch(userId: string, entry: SearchEntry): void {
  const existing = getSearchHistory(userId);
  // Remove any prior entry for the same company
  const filtered = existing.filter(
    (e) => e.companyName.toLowerCase() !== entry.companyName.toLowerCase(),
  );
  // Most recent first, keep up to 10
  const updated = [entry, ...filtered].slice(0, 10);
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
}

export function clearSearchHistory(userId: string): void {
  localStorage.removeItem(getHistoryKey(userId));
}

// "2026-05-31" → "May 31"
export function formatHistoryDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
    });
  } catch {
    return iso;
  }
}
