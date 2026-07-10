import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { TIMEOUT_MS_KEY } from '../interceptors/timeout.interceptor';

export const PUBLIC_KEY = 'auth:public';
export const ROLES_KEY = 'auth:roles';

/**
 * Marks a controller or method as public (auth-free).
 * SupabaseAuthGuard skips these endpoints.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_KEY, true);

/**
 * Authenticated user shape attached to `req.user` by SupabaseAuthGuard.
 */
export interface AuthenticatedUser {
  id: string;
  role?: string | null;
  email?: string | null;
  raw?: Record<string, unknown>;
}

/**
 * Requires at least one of the given roles. Pair with `@UseGuards(RolesGuard)`.
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Param decorator: current authenticated user.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser | null }>();
    return req.user ?? null;
  },
);

/**
 * Param decorator: current request id.
 */
export const ReqId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ id?: string }>();
  return req.id ?? 'unknown';
});

/**
 * Optional route-level timeout (ms). Read by TimeoutInterceptor.
 *
 *   @TimeoutMs(500)
 *   @Get('heavy')
 */
export const TimeoutMs = (ms: number): MethodDecorator & ClassDecorator =>
  SetMetadata(TIMEOUT_MS_KEY, ms);

export { TIMEOUT_MS_KEY };
