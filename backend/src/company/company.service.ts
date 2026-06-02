import { Injectable } from '@nestjs/common';
import { SignalsService } from '../signals/signals.service';
import { PrismaService } from '../prisma/prisma.service';
import { FitScoreService, type FitScoreResult } from '../fit-score/fit-score.service';
import type { HireSignalResult } from '../common/types';

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  githubScore: number;
  jobsScore: number;
  newsScore: number;
}

@Injectable()
export class CompanyService {
  constructor(
    private readonly signals: SignalsService,
    private readonly prisma: PrismaService,
    private readonly fitScore: FitScoreService,
  ) {}

  search(name: string, skills?: string[], clerkId?: string | null): Promise<HireSignalResult> {
    return this.signals.analyze(name, skills, clerkId);
  }

  async getHistory(name: string): Promise<ScoreHistoryEntry[]> {
    const rows = await this.prisma.scoreHistory.findMany({
      where: { companyName: name.toLowerCase().trim() },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    return rows.map((r) => ({
      date:        r.createdAt.toISOString().slice(0, 10),
      score:       r.score,
      githubScore: r.githubScore,
      jobsScore:   r.jobsScore,
      newsScore:   r.newsScore,
    }));
  }

  compare(names: string[]) {
    return this.signals.compareCompanies(names);
  }

  getFitScore(companyName: string, skills: string[]): Promise<FitScoreResult> {
    return this.fitScore.calculateFitScore(companyName, skills);
  }

  async getRecentHistory(clerkId: string): Promise<Array<{
    companyName: string;
    score: number;
    createdAt: string;
  }>> {
    // Only rows belonging to this user
    const rows = await this.prisma.scoreHistory.findMany({
      where:   { clerkId },
      orderBy: { createdAt: 'desc' },
      take:    50, // over-fetch so dedup still yields 5
    });

    const seen = new Set<string>();
    const distinct = rows
      .filter((r) => {
        if (seen.has(r.companyName)) return false;
        seen.add(r.companyName);
        return true;
      })
      .slice(0, 5);

    return distinct.map((r) => ({
      companyName: r.companyName,
      score:       r.score,
      createdAt:   r.createdAt.toISOString().slice(0, 10),
    }));
  }

  clearCache(name: string) {
    return this.signals.clearCache(name);
  }
}
