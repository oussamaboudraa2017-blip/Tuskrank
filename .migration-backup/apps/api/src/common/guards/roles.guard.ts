import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../errors/api-error';
import { ROLES_KEY, type AuthenticatedUser } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser | null }>();
    const userRole: string | undefined = req.user?.role ?? undefined;

    if (!userRole) {
      throw new ForbiddenError('Authentication required');
    }
    if (!required.includes(userRole)) {
      throw new ForbiddenError('Insufficient role');
    }
    return true;
  }
}
