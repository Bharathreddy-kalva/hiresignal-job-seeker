import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { GithubService } from '../github/github.service';
import { JobsService } from '../jobs/jobs.service';
import { NewsService } from '../news/news.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import type {
  GithubActivity,
  HireSignalResult,
  JobActivity,
  NewsArticle,
} from '../common/types';

const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly github: GithubService,
    private readonly jobs: JobsService,
    private readonly news: NewsService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private norm(value: number, refMax: number): number {
    return Math.min(Math.round((value / refMax) * 100), 100);
  }

  private cacheKey(name: string): string {
    return `signal:${name.toLowerCase().trim()}`;
  }

  /** Analyze multiple companies in parallel and generate an AI comparison. */
  async compareCompanies(
    names: string[],
  ): Promise<{ companies: HireSignalResult[]; comparison: string }> {
    // Each analyze() call benefits from the Redis cache automatically
    const companies = await Promise.all(names.map((n) => this.analyze(n)));
    const comparison = await this.ai
      .generateComparison(companies)
      .catch((err: unknown) => {
        this.logger.warn(`AI comparison failed: ${err instanceof Error ? err.message : String(err)}`);
        return 'AI comparison could not be generated at this time.';
      });
    return { companies, comparison };
  }

  /** Remove cached result for a company — used by the cache-bust endpoint. */
  async clearCache(name: string): Promise<{ key: string; deleted: boolean }> {
    const key = this.cacheKey(name);
    try {
      const count = await this.redis.del(key);
      this.logger.log(`Cache DEL "${key}": ${count} key(s) removed`);
      return { key, deleted: count > 0 };
    } catch (err: unknown) {
      this.logger.warn(`Redis del failed: ${err instanceof Error ? err.message : String(err)}`);
      return { key, deleted: false };
    }
  }

  async analyze(
    companyName: string,
    skills?: string[],
    clerkId?: string | null,
  ): Promise<HireSignalResult> {
    const key = this.cacheKey(companyName);

    // ── 1. Cache read ──────────────────────────────────────────────────────
    // Skills-filtered queries bypass the cache so results don't bleed across
    // different skill combinations.
    if (!skills?.length) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          this.logger.log(`Cache HIT for "${key}"`);
          return JSON.parse(cached) as HireSignalResult;
        }
      } catch (err: unknown) {
        this.logger.warn(`Redis get failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // ── 2. Fan-out to all external APIs ───────────────────────────────────
    const [githubResult, jobsResult, newsResult] = await Promise.allSettled([
      this.github.getActivity(companyName),
      this.jobs.getActivity(companyName, skills),
      this.news.getArticles(companyName),
    ]);

    const github: GithubActivity =
      githubResult.status === 'fulfilled'
        ? githubResult.value
        : { commits30d: 0, commits60d: 0, commits90d: 0 };

    const jobsData =
      jobsResult.status === 'fulfilled'
        ? jobsResult.value
        : { jobs30d: 0, jobs60d: 0, jobs90d: 0, relevanceNote: undefined };

    const jobs: JobActivity = {
      jobs30d: jobsData.jobs30d,
      jobs60d: jobsData.jobs60d,
      jobs90d: jobsData.jobs90d,
    };
    const relevanceNote = jobsData.relevanceNote;

    const news: NewsArticle[] =
      newsResult.status === 'fulfilled' ? newsResult.value : [];

    // ── 3. Score computation ───────────────────────────────────────────────
    const jobsScore   = this.norm(jobs.jobs30d,       30);
    const githubScore = this.norm(github.commits30d, 300);

    // Non-linear news score: 0→0, 1-2→40, 3-4→70, 5+→100
    const newsScore = news.length === 0 ? 0
      : news.length <= 2              ? 40
      : news.length <= 4              ? 70
      : 100;

    const score = Math.round(
      jobsScore * 0.4 + githubScore * 0.35 + newsScore * 0.25,
    );

    const summary = await this.ai
      .generateSummary({ company: companyName, github, jobs, news })
      .catch((err: unknown) => {
        this.logger.warn(
          `AI summary failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return 'AI summary could not be generated at this time.';
      });

    const result: HireSignalResult = {
      company: { id: '', name: companyName },
      github,
      jobs,
      news,
      score,
      scoreBreakdown: { jobs: jobsScore, github: githubScore, news: newsScore },
      summary,
      ...(relevanceNote ? { relevanceNote } : {}),
    };

    // ── 4. Persist + cache (fire-and-forget; failures never block response) ──
    void this.persistGrowthSignals(companyName, { github, jobs, news, score, summary })
      .then((company) => {
        result.company.id = company.id;
      })
      .catch((err: unknown) =>
        this.logger.error(`persistGrowthSignals failed: ${err instanceof Error ? err.message : String(err)}`),
      );

    void this.persistScoreHistory(companyName, { score, githubScore, jobsScore, newsScore }, clerkId ?? null)
      .catch((err: unknown) =>
        this.logger.error(`persistScoreHistory failed: ${err instanceof Error ? err.message : String(err)}`),
      );

    // Cache only non-skills results (base company analysis)
    if (!skills?.length) {
      try {
        await this.redis.setex(key, CACHE_TTL, JSON.stringify(result));
        this.logger.log(`Cache SET "${key}" (TTL ${CACHE_TTL}s)`);
      } catch (err: unknown) {
        this.logger.warn(`Redis setex failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return result;
  }

  private async persistGrowthSignals(
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

  private async persistScoreHistory(
    companyName: string,
    scores: {
      score: number;
      githubScore: number;
      jobsScore: number;
      newsScore: number;
    },
    clerkId: string | null,
  ) {
    const key = companyName.toLowerCase().trim();

    // One entry per company per user per calendar day (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const existing = await this.prisma.scoreHistory.findFirst({
      where: {
        companyName: key,
        clerkId:     clerkId ?? null,
        createdAt:   { gte: todayStart, lt: todayEnd },
      },
    });

    if (existing) {
      this.logger.debug(`ScoreHistory: skipping insert for "${key}" / clerk:${clerkId} (entry exists for today)`);
      return existing;
    }

    return this.prisma.scoreHistory.create({
      data: {
        companyName: key,
        score:       scores.score,
        githubScore: scores.githubScore,
        jobsScore:   scores.jobsScore,
        newsScore:   scores.newsScore,
        clerkId,
      },
    });
  }
}
