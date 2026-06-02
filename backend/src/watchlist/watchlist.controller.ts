import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Post('add')
  add(@Body() body: { email?: string; companyName?: string }) {
    const { email, companyName } = body ?? {};
    if (!email?.trim())       throw new BadRequestException('"email" is required');
    if (!companyName?.trim()) throw new BadRequestException('"companyName" is required');
    return this.watchlist.add(email.trim(), companyName.trim());
  }

  @Get()
  get(@Query('email') email: string) {
    if (!email?.trim()) throw new BadRequestException('"email" query param is required');
    return this.watchlist.getByEmail(email.trim());
  }

  @Delete('remove')
  remove(@Body() body: { email?: string; companyName?: string }) {
    const { email, companyName } = body ?? {};
    if (!email?.trim())       throw new BadRequestException('"email" is required');
    if (!companyName?.trim()) throw new BadRequestException('"companyName" is required');
    return this.watchlist.remove(email.trim(), companyName.trim());
  }
}
