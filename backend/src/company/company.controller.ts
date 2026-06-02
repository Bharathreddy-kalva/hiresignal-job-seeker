import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Query,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { extractClerkId } from '../auth/clerk.helper';

@Controller('companies')
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get('search')
  async search(
    @Query('name') name: string,
    @Query('skills') skillsRaw?: string,
    @Headers('authorization') auth?: string,
  ) {
    if (!name?.trim()) {
      throw new BadRequestException('Query parameter "name" is required');
    }
    const skills = skillsRaw
      ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    // Attach clerkId when the user is authenticated (fire-and-forget safe)
    const clerkId = await extractClerkId(auth);

    return this.company.search(name.trim(), skills, clerkId);
  }

  @Get('history')
  history(@Query('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Query parameter "name" is required');
    }
    return this.company.getHistory(name.trim());
  }

  @Get('history/recent')
  async recentHistory(@Headers('authorization') auth?: string) {
    const clerkId = await extractClerkId(auth);
    if (!clerkId) return []; // no auth → empty, never show other users' data
    return this.company.getRecentHistory(clerkId);
  }

  @Get('compare')
  compare(@Query('companies') companiesRaw: string) {
    const names = (companiesRaw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (names.length < 2) {
      throw new BadRequestException(
        'Provide at least 2 company names as ?companies=A,B,C (max 3)',
      );
    }
    return this.company.compare(names);
  }

  @Post('fit-score')
  fitScore(
    @Body() body: { companyName?: string; skills?: string[] },
  ) {
    const { companyName, skills } = body ?? {};
    if (!companyName?.trim()) {
      throw new BadRequestException('Body field "companyName" is required');
    }
    if (!skills?.length) {
      throw new BadRequestException('Body field "skills" must be a non-empty array');
    }
    return this.company.getFitScore(companyName.trim(), skills);
  }

  @Delete('cache')
  clearCache(@Query('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Query parameter "name" is required');
    }
    return this.company.clearCache(name.trim());
  }
}
