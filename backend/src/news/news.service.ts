import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { NewsArticle } from '../common/types';

interface NewsApiArticle {
  title: string;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface NewsApiResponse {
  articles: NewsApiArticle[];
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('NEWS_API_KEY');
  }

  async getArticles(companyName: string): Promise<NewsArticle[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<NewsApiResponse>('https://newsapi.org/v2/everything', {
          params: {
            q: `"${companyName}"`,
            sortBy: 'publishedAt',
            pageSize: 5,
            language: 'en',
            apiKey: this.apiKey,
          },
        }),
      );
      return (data.articles ?? []).map((a) => ({
        title: a.title,
        source: a.source?.name ?? '',
        publishedAt: a.publishedAt,
        url: a.url,
      }));
    } catch (err: unknown) {
      this.logger.warn(
        `NewsAPI fetch failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }
}
