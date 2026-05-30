import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { JobsService } from '../jobs/jobs.service';
import { NewsService } from '../news/news.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  GithubActivity,
  HireSignalResult,
  JobActivity,
  NewsArticle,
} from '../common/types';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly github: GithubService,
    private readonly jobs: JobsService,
    private readonly news: NewsService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  // Normalize a raw value against a reference max → 0–100
  private norm(value: number, refMax: number): number {
    return Math.min(Math.round((value / refMax) * 100), 100);
  }

  async analyze(companyName: string): Promise<HireSignalResult> {
    // Fan out to all external APIs in parallel; a failure in one never blocks the others
    const [githubResult, jobsResult, newsResult] = await Promise.allSettled([
      this.github.getActivity(companyName),
      this.jobs.getActivity(companyName),
      this.news.getArticles(companyName),
    ]);

    const github: GithubActivity =
      githubResult.status === 'fulfilled'
        ? githubResult.value
        : { commits30d: 0, commits60d: 0, commits90d: 0 };

    const jobs: JobActivity =
      jobsResult.status === 'fulfilled'
        ? jobsResult.value
        : { jobs30d: 0, jobs60d: 0, jobs90d: 0 };

    const news: NewsArticle[] =
      newsResult.status === 'fulfilled' ? newsResult.value : [];

    // Score components (each 0–100)
    // Benchmarks: 30 job postings ≈ active hiring; 300 commits ≈ active eng; 5 articles ≈ in the news
    const jobsScore = this.norm(jobs.jobs30d, 30);
    const githubScore = this.norm(github.commits30d, 300);
    const newsScore = this.norm(news.length, 5);

    // Weighted total: jobs 40 %, github 35 %, news 25 %
    const score = Math.round(
      jobsScore * 0.4 + githubScore * 0.35 + newsScore * 0.25,
    );

    // AI summary — failure returns a safe fallback string
    const summary = await this.ai
      .generateSummary({ company: companyName, github, jobs, news })
      .catch((err: unknown) => {
        this.logger.warn(
          `AI summary failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return 'AI summary could not be generated at this time.';
      });

    // Persist company + signals — DB failure must not break the API response
    const companyRecord = await this.persist(companyName, {
      github,
      jobs,
      news,
      score,
      summary,
    }).catch((err: unknown) => {
      this.logger.error(
        `Prisma persist failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    });

    return {
      company: { id: companyRecord?.id ?? '', name: companyName },
      github,
      jobs,
      news,
      score,
      scoreBreakdown: { jobs: jobsScore, github: githubScore, news: newsScore },
      summary,
    };
  }

  private async persist(
    name: string,
    data: {
      github: GithubActivity;
      jobs: JobActivity;
      news: NewsArticle[];
      score: number;
      summary: string;
    },
  ) {
    const company = await this.prisma.company.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    await this.prisma.growthSignal.createMany({
      data: [
        {
          companyId: company.id,
          type: 'github_activity',
          title: `GitHub: ${data.github.commits30d} commits in last 30 days`,
          description: JSON.stringify(data.github),
          source: 'github',
        },
        {
          companyId: company.id,
          type: 'job_postings',
          title: `Jobs: ${data.jobs.jobs30d} postings in last 30 days`,
          description: JSON.stringify(data.jobs),
          source: 'adzuna',
        },
        {
          companyId: company.id,
          type: 'news_coverage',
          title: `News: ${data.news.length} recent articles found`,
          description: data.summary,
          source: 'newsapi',
        },
        {
          companyId: company.id,
          type: 'hiresignal_score',
          title: `HireSignal score: ${data.score}/100`,
          description: `Weighted score — jobs 40 %, github 35 %, news 25 %`,
          source: 'hiresignal',
        },
      ],
    });

    return company;
  }
}
