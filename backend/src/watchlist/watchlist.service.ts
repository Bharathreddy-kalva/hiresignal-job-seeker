import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WatchlistEntry {
  companyName: string;
  score:       number | null;
  githubScore: number | null;
  jobsScore:   number | null;
  newsScore:   number | null;
  addedAt:     string;
}

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async add(email: string, companyName: string) {
    if (!EMAIL_RE.test(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const existing = await this.prisma.watchlist.findUnique({
      where: { email_companyName: { email, companyName } },
    });
    if (existing) {
      return { message: 'Already watching this company', company: companyName, alreadyWatching: true };
    }

    await this.prisma.watchlist.create({ data: { email, companyName } });
    this.logger.log(`Watchlist: ${email} added "${companyName}"`);
    return { message: 'Added to watchlist', company: companyName, alreadyWatching: false };
  }

  async getByEmail(email: string): Promise<WatchlistEntry[]> {
    if (!EMAIL_RE.test(email)) throw new BadRequestException('Invalid email address');

    const items = await this.prisma.watchlist.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      items.map(async (item) => {
        const latest = await this.prisma.scoreHistory.findFirst({
          where: { companyName: item.companyName.toLowerCase().trim() },
          orderBy: { createdAt: 'desc' },
        });
        return {
          companyName: item.companyName,
          score:       latest?.score       ?? null,
          githubScore: latest?.githubScore ?? null,
          jobsScore:   latest?.jobsScore   ?? null,
          newsScore:   latest?.newsScore   ?? null,
          addedAt:     item.createdAt.toISOString(),
        };
      }),
    );
  }

  async remove(email: string, companyName: string) {
    try {
      await this.prisma.watchlist.delete({
        where: { email_companyName: { email, companyName } },
      });
      return { message: 'Removed from watchlist' };
    } catch {
      return { message: 'Not found in watchlist' };
    }
  }

  // Used by AlertService — returns all entries grouped by email
  async getAllGroupedByEmail(): Promise<Map<string, string[]>> {
    const all = await this.prisma.watchlist.findMany();
    const map = new Map<string, string[]>();
    for (const item of all) {
      if (!map.has(item.email)) map.set(item.email, []);
      map.get(item.email)!.push(item.companyName);
    }
    return map;
  }
}
