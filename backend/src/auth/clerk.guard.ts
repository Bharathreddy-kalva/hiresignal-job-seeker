import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import type { Request } from 'express';

export interface ClerkRequest extends Request {
  clerkUserId: string;
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY ?? '',
});

@Injectable()
export class ClerkGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ClerkRequest>();
    const auth = req.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = auth.slice(7);

    try {
      const payload = await clerk.verifyToken(token);
      req.clerkUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
