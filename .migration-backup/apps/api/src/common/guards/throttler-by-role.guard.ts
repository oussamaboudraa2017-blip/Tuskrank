import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class ThrottlerByRoleGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = (req as any).user;
    if (user?.role === 'admin') {
      return 'admin-bypass';
    }
    return req.ip ?? 'unknown';
  }
}
