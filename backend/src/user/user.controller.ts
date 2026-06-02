import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkGuard, type ClerkRequest } from '../auth/clerk.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post('profile')
  @UseGuards(ClerkGuard)
  save(
    @Req() req: ClerkRequest,
    @Body() body: { skills?: string[]; email?: string },
  ) {
    if (!body.email?.trim()) throw new BadRequestException('"email" is required');
    const skills = Array.isArray(body.skills) ? body.skills : [];
    return this.users.upsertProfile(req.clerkUserId, body.email.trim(), skills);
  }

  @Get('profile')
  @UseGuards(ClerkGuard)
  get(@Req() req: ClerkRequest) {
    return this.users.getProfile(req.clerkUserId);
  }
}
