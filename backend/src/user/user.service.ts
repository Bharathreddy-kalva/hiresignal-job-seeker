import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserProfileDto {
  skills: string[];
  email:  string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(clerkId: string, email: string, skills: string[]): Promise<UserProfileDto> {
    const row = await this.prisma.userProfile.upsert({
      where:  { clerkId },
      create: { clerkId, email, skills },
      update: { email, skills, updatedAt: new Date() },
    });
    return { skills: row.skills, email: row.email };
  }

  async getProfile(clerkId: string): Promise<UserProfileDto | null> {
    const row = await this.prisma.userProfile.findUnique({ where: { clerkId } });
    if (!row) return null;
    return { skills: row.skills, email: row.email };
  }
}
