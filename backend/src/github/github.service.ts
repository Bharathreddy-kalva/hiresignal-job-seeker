import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { GithubActivity } from '../common/types';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly token: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.token = this.config.getOrThrow<string>('GITHUB_TOKEN');
  }

  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  }

  private async fetchCommitCount(org: string, since: string): Promise<number> {
    const { data } = await firstValueFrom(
      this.http.get<{ total_count: number }>(
        'https://api.github.com/search/commits',
        {
          params: { q: `org:${org} committer-date:>=${since}`, per_page: 1 },
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      ),
    );
    return data.total_count ?? 0;
  }

  async getActivity(companyName: string): Promise<GithubActivity> {
    const org = companyName.toLowerCase().replace(/\s+/g, '-');
    try {
      const [commits30d, commits60d, commits90d] = await Promise.all([
        this.fetchCommitCount(org, this.daysAgo(30)).catch(() => 0),
        this.fetchCommitCount(org, this.daysAgo(60)).catch(() => 0),
        this.fetchCommitCount(org, this.daysAgo(90)).catch(() => 0),
      ]);
      return { commits30d, commits60d, commits90d };
    } catch (err: unknown) {
      this.logger.warn(
        `GitHub fetch failed for "${org}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return { commits30d: 0, commits60d: 0, commits90d: 0 };
    }
  }
}
