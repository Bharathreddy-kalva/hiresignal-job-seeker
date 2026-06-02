import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { JobActivity } from '../common/types';

interface AdzunaJob {
  title: string;
}

interface AdzunaCountResponse {
  count: number;
  results?: AdzunaJob[];
}

// Keywords that always indicate a software role — used as a fallback filter
const ENGINEERING_KEYWORDS = [
  'engineer', 'developer', 'software', 'frontend', 'backend',
  'fullstack', 'devops', 'data', 'machine learning', 'platform',
];

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly appId:  string;
  private readonly appKey: string;
  private readonly baseUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.appId  = this.config.getOrThrow<string>('ADZUNA_APP_ID');
    this.appKey = this.config.getOrThrow<string>('ADZUNA_APP_KEY');
  }

  // ── Fetch raw count using Adzuna (no skill filtering here) ─────────────────

  private async fetchCount(
    params: Record<string, string | number>,
  ): Promise<number> {
    const { data } = await firstValueFrom(
      this.http.get<AdzunaCountResponse>(this.baseUrl, {
        params: { app_id: this.appId, app_key: this.appKey, ...params },
      }),
    );
    return data.count ?? 0;
  }

  // ── Try exact phrase first, then broad keyword ─────────────────────────────

  private async countForWindow(
    companyName: string,
    maxDaysOld: number,
  ): Promise<number> {
    // Attempt 1: exact phrase (most precise)
    const exact = await this.fetchCount({
      what_phrase:      companyName,
      max_days_old:     maxDaysOld,
      results_per_page: 1,
    }).catch(() => 0);

    if (exact > 0) return exact;

    // Attempt 2: keyword fallback
    const broad = await this.fetchCount({
      what:             `${companyName} engineer`,
      max_days_old:     maxDaysOld,
      results_per_page: 1,
    }).catch(() => 0);

    return broad;
  }

  // ── Fetch up to 50 job titles to do local skill filtering ──────────────────

  private async fetchTitles(
    companyName: string,
    maxDaysOld: number,
  ): Promise<string[]> {
    // Try exact phrase first
    try {
      const { data } = await firstValueFrom(
        this.http.get<AdzunaCountResponse>(this.baseUrl, {
          params: {
            app_id:           this.appId,
            app_key:          this.appKey,
            what_phrase:      companyName,
            max_days_old:     maxDaysOld,
            results_per_page: 50,
          },
        }),
      );
      const titles = (data.results ?? []).map((j) => j.title.toLowerCase());
      if (titles.length > 0) return titles;
    } catch { /* fall through */ }

    // Broad fallback
    try {
      const { data } = await firstValueFrom(
        this.http.get<AdzunaCountResponse>(this.baseUrl, {
          params: {
            app_id:           this.appId,
            app_key:          this.appKey,
            what:             `${companyName} engineer`,
            max_days_old:     maxDaysOld,
            results_per_page: 50,
          },
        }),
      );
      return (data.results ?? []).map((j) => j.title.toLowerCase());
    } catch {
      return [];
    }
  }

  // ── Count titles that mention any of the user's skills OR eng keywords ──────

  private filterRelevant(titles: string[], topSkills: string[]): number {
    const needles = [
      ...topSkills.map((s) => s.toLowerCase()),
      ...ENGINEERING_KEYWORDS,
    ];
    return titles.filter((t) => needles.some((n) => t.includes(n))).length;
  }

  // ── Public method ──────────────────────────────────────────────────────────

  async getActivity(
    companyName: string,
    skills?: string[],
  ): Promise<JobActivity & { relevanceNote?: string }> {
    const topSkills = (skills ?? []).slice(0, 3);
    const hasSkills = topSkills.length > 0;

    try {
      if (!hasSkills) {
        // No personalisation: simple count across three windows
        const [jobs30d, jobs60d, jobs90d] = await Promise.all([
          this.countForWindow(companyName, 30).catch(() => 0),
          this.countForWindow(companyName, 60).catch(() => 0),
          this.countForWindow(companyName, 90).catch(() => 0),
        ]);
        return { jobs30d, jobs60d, jobs90d };
      }

      // ── With skills: fetch titles, filter locally ────────────────────────
      // Run all three windows in parallel; for each we need titles + total count
      const [result30, result60, result90] = await Promise.all([
        this.windowWithFilter(companyName, 30, topSkills),
        this.windowWithFilter(companyName, 60, topSkills),
        this.windowWithFilter(companyName, 90, topSkills),
      ]);

      // Never show 0 if total postings exist — fall back to total count
      const jobs30d = result30.filtered > 0 ? result30.filtered : result30.total;
      const jobs60d = result60.filtered > 0 ? result60.filtered : result60.total;
      const jobs90d = result90.filtered > 0 ? result90.filtered : result90.total;

      const relevanceNote =
        `Filtered ${result30.filtered} relevant roles from ` +
        `${result30.total} total postings at ${companyName}`;

      return { jobs30d, jobs60d, jobs90d, relevanceNote };
    } catch (err: unknown) {
      this.logger.warn(
        `Adzuna fetch failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return { jobs30d: 0, jobs60d: 0, jobs90d: 0 };
    }
  }

  private async windowWithFilter(
    companyName: string,
    maxDaysOld: number,
    topSkills: string[],
  ): Promise<{ total: number; filtered: number }> {
    const [total, titles] = await Promise.all([
      this.countForWindow(companyName, maxDaysOld),
      this.fetchTitles(companyName, maxDaysOld),
    ]);
    const filtered = this.filterRelevant(titles, topSkills);
    return { total, filtered };
  }
}
