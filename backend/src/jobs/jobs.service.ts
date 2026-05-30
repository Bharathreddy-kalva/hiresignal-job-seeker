import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { JobActivity } from '../common/types';

interface AdzunaResponse {
  count: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly appId: string;
  private readonly appKey: string;
  private readonly baseUrl =
    'https://api.adzuna.com/v1/api/jobs/us/search/1';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.appId = this.config.getOrThrow<string>('ADZUNA_APP_ID');
    this.appKey = this.config.getOrThrow<string>('ADZUNA_APP_KEY');
  }

  private async fetchJobCount(
    company: string,
    maxDaysOld: number,
  ): Promise<number> {
    const { data } = await firstValueFrom(
      this.http.get<AdzunaResponse>(this.baseUrl, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what_phrase: company,
          max_days_old: maxDaysOld,
          results_per_page: 1,
        },
      }),
    );
    return data.count ?? 0;
  }

  async getActivity(companyName: string): Promise<JobActivity> {
    try {
      const [jobs30d, jobs60d, jobs90d] = await Promise.all([
        this.fetchJobCount(companyName, 30).catch(() => 0),
        this.fetchJobCount(companyName, 60).catch(() => 0),
        this.fetchJobCount(companyName, 90).catch(() => 0),
      ]);
      return { jobs30d, jobs60d, jobs90d };
    } catch (err: unknown) {
      this.logger.warn(
        `Adzuna fetch failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return { jobs30d: 0, jobs60d: 0, jobs90d: 0 };
    }
  }
}
