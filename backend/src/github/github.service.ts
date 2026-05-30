import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { GithubActivity } from '../common/types';

interface GitHubUserSearchResult {
  items: Array<{ login: string; name?: string }>;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly token: string;
  private readonly baseHeaders: Record<string, string>;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.token = this.config.getOrThrow<string>('GITHUB_TOKEN');
    this.baseHeaders = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  }

  // Normalise a string for fuzzy comparison: lowercase, strip spaces/hyphens/dots
  private normalise(s: string): string {
    return s.toLowerCase().replace(/[\s\-_.]/g, '');
  }

  // Step 1 & 2: search GitHub orgs and pick the best match
  private async resolveOrg(companyName: string): Promise<string | null> {
    const { data } = await firstValueFrom(
      this.http.get<GitHubUserSearchResult>(
        'https://api.github.com/search/users',
        {
          params: { q: `${companyName} type:org`, per_page: 5 },
          headers: this.baseHeaders,
        },
      ),
    );

    if (!data.items?.length) return null;

    const needle = this.normalise(companyName);

    // Prefer an exact normalised match on login or display name, else fall back to first result
    const match =
      data.items.find(
        (item) =>
          this.normalise(item.login) === needle ||
          (item.name && this.normalise(item.name) === needle),
      ) ?? data.items[0];

    return match.login;
  }

  // Step 3: count commits for the resolved org
  private async fetchCommitCount(org: string, since: string): Promise<number> {
    const { data } = await firstValueFrom(
      this.http.get<{ total_count: number }>(
        'https://api.github.com/search/commits',
        {
          params: { q: `org:${org} committer-date:>=${since}`, per_page: 1 },
          headers: this.baseHeaders,
        },
      ),
    );
    return data.total_count ?? 0;
  }

  async getActivity(companyName: string): Promise<GithubActivity> {
    try {
      // Step 1 & 2: find the real GitHub org login
      const org = await this.resolveOrg(companyName);

      // Step 4: no org found — return zeros gracefully
      if (!org) {
        this.logger.warn(`GitHub: no org found for "${companyName}"`);
        return { commits30d: 0, commits60d: 0, commits90d: 0 };
      }

      console.log(`[GithubService] Resolved "${companyName}" → GitHub org: "${org}"`);

      // Step 3: fetch commit counts for all three windows in parallel
      const [commits30d, commits60d, commits90d] = await Promise.all([
        this.fetchCommitCount(org, this.daysAgo(30)).catch(() => 0),
        this.fetchCommitCount(org, this.daysAgo(60)).catch(() => 0),
        this.fetchCommitCount(org, this.daysAgo(90)).catch(() => 0),
      ]);

      return { commits30d, commits60d, commits90d };
    } catch (err: unknown) {
      console.error('[GithubService] Error:', err);
      this.logger.warn(
        `GitHub fetch failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return { commits30d: 0, commits60d: 0, commits90d: 0 };
    }
  }
}
