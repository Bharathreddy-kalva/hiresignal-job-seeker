import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { NewsArticle } from '../common/types';

interface NewsApiArticle {
  title: string;
  description: string | null;
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
  private readonly baseUrl = 'https://newsapi.org/v2/everything';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('NEWS_API_KEY');
  }

  /** Return true if the company name appears in the title or description. */
  private mentions(article: NewsApiArticle, companyName: string): boolean {
    const needle = companyName.toLowerCase();
    return (
      article.title?.toLowerCase().includes(needle) ||
      (article.description ?? '').toLowerCase().includes(needle)
    );
  }

  private toArticle(a: NewsApiArticle): NewsArticle {
    return {
      title:       a.title,
      source:      a.source?.name ?? '',
      publishedAt: a.publishedAt,
      url:         a.url,
    };
  }

  private async fetchAndFilter(
    q: string,
    companyName: string,
  ): Promise<NewsArticle[]> {
    const { data } = await firstValueFrom(
      this.http.get<NewsApiResponse>(this.baseUrl, {
        params: {
          q,
          sortBy:   'relevancy',
          searchIn: 'title,description',
          pageSize: 10,            // fetch more so filter still has enough to pick from
          language: 'en',
          apiKey:   this.apiKey,
        },
      }),
    );

    return (data.articles ?? [])
      .filter((a) => this.mentions(a, companyName))
      .slice(0, 5)
      .map((a) => this.toArticle(a));
  }

  async getArticles(companyName: string): Promise<NewsArticle[]> {
    try {
      // Primary: exact phrase in title/description, ranked by relevancy
      const primary = await this.fetchAndFilter(
        `"${companyName}"`,
        companyName,
      );

      if (primary.length >= 3) return primary;

      // Fallback: broader keyword search when fewer than 3 articles matched
      this.logger.debug(
        `NewsAPI primary returned ${primary.length} articles for "${companyName}", trying fallback`,
      );
      const fallback = await this.fetchAndFilter(
        `${companyName} tech OR software OR engineering`,
        companyName,
      );

      // Merge: put primary results first, then append non-duplicate fallbacks
      const seen = new Set(primary.map((a) => a.url));
      const merged = [
        ...primary,
        ...fallback.filter((a) => !seen.has(a.url)),
      ].slice(0, 5);

      return merged;
    } catch (err: unknown) {
      this.logger.warn(
        `NewsAPI fetch failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }
}
