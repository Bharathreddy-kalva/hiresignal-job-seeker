import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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

interface AdzunaJob {
  title:          string;
  redirect_url:   string;
  company:        { display_name: string };
  category?:      { label: string };
  contract_type?: string;
}

interface AdzunaJobsResponse {
  results: AdzunaJob[];
  count:   number;
}

// ── Title-based skill inference ───────────────────────────────────────────────
// When a job title contains a keyword, these resume skills are considered
// implied requirements for the role.
const INFERENCE: Array<{ pattern: RegExp; skills: string[] }> = [
  {
    pattern: /\bbackend\b|\bserver.?side\b|\bserver\b/i,
    skills:  ['Java', 'Python', 'Node.js', 'Spring Boot', 'PostgreSQL', 'SQL', 'REST', 'Docker'],
  },
  {
    pattern: /\bfrontend\b|\bfront.end\b|\bui\b|\bweb developer\b/i,
    skills:  ['React', 'JavaScript', 'TypeScript', 'CSS'],
  },
  {
    pattern: /\bfull.?stack\b/i,
    skills:  ['React', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'PostgreSQL'],
  },
  {
    pattern: /\bdevops\b|\bsre\b|\bsite reliability\b|\bplatform engineer\b/i,
    skills:  ['Docker', 'AWS', 'CI/CD', 'Linux', 'Jenkins', 'Kubernetes'],
  },
  {
    pattern: /\bdata engineer\b|\bdata scientist\b|\bml engineer\b|\bmachine learning\b/i,
    skills:  ['Python', 'SQL', 'PostgreSQL'],
  },
  {
    pattern: /\bsoftware engineer\b|\bsoftware developer\b|\bswd\b/i,
    skills:  ['Java', 'Python', 'JavaScript'],
  },
];

@Injectable()
export class FitScoreService {
  private readonly logger = new Logger(FitScoreService.name);
  private readonly baseUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/1';
  private readonly appId:  string;
  private readonly appKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.appId  = this.config.getOrThrow<string>('ADZUNA_APP_ID');
    this.appKey = this.config.getOrThrow<string>('ADZUNA_APP_KEY');
  }

  // ── Adzuna fetch with fallback chain ─────────────────────────────────────────

  private async fetchJobs(companyName: string): Promise<AdzunaJob[]> {
    const base = {
      app_id:           this.appId,
      app_key:          this.appKey,
      results_per_page: 10,
    };

    // Attempt 1 — employer filter (most precise)
    try {
      const { data } = await firstValueFrom(
        this.http.get<AdzunaJobsResponse>(this.baseUrl, {
          params: { ...base, what: 'software engineer', employer: companyName },
        }),
      );
      const results = data.results ?? [];
      console.log(`[FitScore] "${companyName}" attempt 1 (employer filter): ${results.length} jobs`);
      if (results.length > 0) {
        console.log(`[FitScore] titles: ${results.map((j) => j.title).join(' | ')}`);
        return results;
      }
    } catch (err: unknown) {
      this.logger.warn(`Attempt 1 failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Attempt 2 — keyword search without employer filter
    try {
      const { data } = await firstValueFrom(
        this.http.get<AdzunaJobsResponse>(this.baseUrl, {
          params: { ...base, what: `${companyName} engineer` },
        }),
      );
      const results = data.results ?? [];
      console.log(`[FitScore] "${companyName}" attempt 2 (keyword): ${results.length} jobs`);
      if (results.length > 0) {
        console.log(`[FitScore] titles: ${results.map((j) => j.title).join(' | ')}`);
        return results;
      }
    } catch (err: unknown) {
      this.logger.warn(`Attempt 2 failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Attempt 3 — company name only
    try {
      const { data } = await firstValueFrom(
        this.http.get<AdzunaJobsResponse>(this.baseUrl, {
          params: { ...base, what: companyName },
        }),
      );
      const results = data.results ?? [];
      console.log(`[FitScore] "${companyName}" attempt 3 (name only): ${results.length} jobs`);
      if (results.length > 0) {
        console.log(`[FitScore] titles: ${results.map((j) => j.title).join(' | ')}`);
      }
      return results;
    } catch (err: unknown) {
      this.logger.warn(`Attempt 3 failed: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  // ── Deduplication ─────────────────────────────────────────────────────────

  private dedupe(jobs: AdzunaJob[]): AdzunaJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = job.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  private scoreJob(job: AdzunaJob, resumeSkills: string[]): FitResult {
    const searchable = [
      job.title,
      job.category?.label ?? '',
    ].join(' ');

    // Find which inferred skill sets apply for this job title
    const impliedSkills = new Set<string>();
    let inferenceTag = '';
    for (const rule of INFERENCE) {
      if (rule.pattern.test(job.title)) {
        rule.skills.forEach((s) => impliedSkills.add(s));
        if (!inferenceTag) {
          // Build a human-readable tag from the first matching rule
          inferenceTag = job.title.toLowerCase().includes('backend')  ? 'backend-match'
            : job.title.toLowerCase().includes('frontend') ? 'frontend-match'
            : job.title.toLowerCase().includes('full')     ? 'fullstack-match'
            : job.title.toLowerCase().includes('devops')   ? 'devops-match'
            : job.title.toLowerCase().includes('data')     ? 'data-match'
            : 'eng-match';
        }
      }
    }

    // Count resume skills that appear in the implied set or raw searchable text
    const matchedSkills = resumeSkills.filter((skill) => {
      if (impliedSkills.has(skill)) return true;
      // Also check raw title text (catches explicit mentions like "React Developer")
      return searchable.toLowerCase().includes(skill.toLowerCase());
    });

    const denominator = Math.min(resumeSkills.length, 8);
    const raw = Math.round((matchedSkills.length / denominator) * 100);
    const matchPercentage = Math.min(Math.max(raw, 30), 95);

    // Tags shown in UI: exact matched skills, or inference tag, or nothing (→ general-match)
    const tags: string[] =
      matchedSkills.length > 0  ? matchedSkills
      : inferenceTag            ? [inferenceTag]
      : [];

    return {
      title:           job.title,
      company:         job.company?.display_name ?? '',
      matchPercentage,
      matchedSkills:   tags,
      url:             job.redirect_url,
    };
  }

  // ── Public entry point ────────────────────────────────────────────────────

  async calculateFitScore(
    companyName: string,
    resumeSkills: string[],
  ): Promise<FitScoreResult> {
    if (!resumeSkills.length) return { jobs: [], averageFit: 0 };

    try {
      const raw     = await this.fetchJobs(companyName);
      const unique  = this.dedupe(raw).slice(0, 10);
      const scored  = unique
        .map((job) => this.scoreJob(job, resumeSkills))
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 3);

      const averageFit = scored.length
        ? Math.round(scored.reduce((s, j) => s + j.matchPercentage, 0) / scored.length)
        : 0;

      return { jobs: scored, averageFit };
    } catch (err: unknown) {
      this.logger.warn(
        `FitScore failed for "${companyName}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return { jobs: [], averageFit: 0 };
    }
  }
}
