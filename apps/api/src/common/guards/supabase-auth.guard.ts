import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_KEY, type AuthenticatedUser } from '@common/decorators';
import { UnauthorizedError } from '@common/errors/api-error';
import { AppEnvironment, UserRole } from '@common/enums';
import type { Request } from 'express';

const DEFAULT_TIMEOUT_MS = 4_000;

/**
 * Bearer / cookie token → Supabase user.
 *
 * Verifies the JWT using the Supabase project's public `anon` key.
 * Cached per-(token signature) for a short TTL to avoid an external
 * round-trip on every request in steady state.
 *
 * Sprint 2A scaffolding only. The actual login / refresh endpoints
 * arrive in Sprint 2B (Auth module).
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly client: SupabaseClient;
  private readonly bypassInDev: boolean;
  private readonly nodeEnv: string;

  private readonly verifiedCache = new Map<
    string,
    { user: AuthenticatedUser; expiresAtMs: number }
  >();
  private static readonly CACHE_TTL_MS = 60_000;
  private static readonly CACHE_PRUNE_EVERY = 256;

  private verificationCalls = 0;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    const url = this.config.get<string>('SUPABASE_URL', '');
    const anon = this.config.get<string>('SUPABASE_ANON_KEY', '');
    this.nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    this.bypassInDev =
      this.nodeEnv === AppEnvironment.Development &&
      this.config.get<string>('AUTH_BYPASS_ENABLED', 'false') === 'true';

    if (url && anon) {
      this.client = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      // No credentials configured: use a stub URL but rely on
      // bypassInDev or fail closed (never bypass outside development).
      this.client = createClient('http://localhost', 'noop', {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      if (!this.bypassInDev) {
        this.logger.warn(
          'Supabase client constructed without credentials; JWT verification will reject all requests.',
        );
      }
    }
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser | null }>();

    const accessToken = this.extractAccessToken(req);
    if (!accessToken) {
      return this.handleUnauthenticated(req);
    }

    const cached = this.verifiedCache.get(this.cacheKey(accessToken));
    const now = Date.now();
    if (cached && cached.expiresAtMs > now) {
      req.user = cached.user;
      return true;
    }

    try {
      const user = await this.verifyToken(accessToken);
      req.user = user;
      this.verifiedCache.set(this.cacheKey(accessToken), {
        user,
        expiresAtMs: now + SupabaseAuthGuard.CACHE_TTL_MS,
      });
      if (++this.verificationCalls % SupabaseAuthGuard.CACHE_PRUNE_EVERY === 0) {
        this.pruneCache(now);
      }
      return true;
    } catch (err) {
      if (this.bypassInDev) {
        req.user = this.devBypassUser();
        return true;
      }
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Bearer token verification failed');
    }
  }

  private extractAccessToken(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
      const t = header.slice('bearer '.length).trim();
      return t.length > 0 ? t : undefined;
    }
    const cookieHeader = req.headers.cookie ?? '';
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find(
        (c) =>
          c.toLowerCase().startsWith('sb-access-token=') ||
          c.toLowerCase().startsWith('sb:'),
      );
    if (!match) return undefined;
    const idx = match.indexOf('=');
    return idx >= 0 ? match.slice(idx + 1) || undefined : undefined;
  }

  private async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const call = this.client.auth.getUser(accessToken);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new UnauthorizedError('Supabase JWT verification timed out')),
        DEFAULT_TIMEOUT_MS),
    );
    const { data, error } = await Promise.race([call, timeout]);
    if (error || !data.user) {
      throw new UnauthorizedError(error?.message ?? 'Invalid bearer token');
    }
    const u = data.user;
    const role =
      (u.app_metadata?.['role'] as string | undefined) ??
      (u.user_metadata?.['role'] as string | undefined) ??
      UserRole.Authenticated;
    return {
      id: u.id,
      email: u.email ?? null,
      role,
      raw: { ...u },
    };
  }

  private handleUnauthenticated(req: Request): boolean {
    if (this.bypassInDev) {
      (req as any).user = this.devBypassUser();
      return true;
    }
    throw new UnauthorizedError('Missing bearer token');
  }

  private devBypassUser(): AuthenticatedUser {
    return {
      id: '00000000-0000-4000-8000-000000000000',
      role: UserRole.Admin,
      email: 'dev-bypass@tuskrank.local',
      raw: { bypass: true, nodeEnv: this.nodeEnv },
    };
  }

  private cacheKey(token: string): string {
    // Tokens are JWTs; we cache by token string but cap memory by
    // pruning the map periodically. A real implementation would key
    // by `sub` (subject) once verified.
    return token;
  }

  private pruneCache(nowMs: number): void {
    for (const [key, entry] of this.verifiedCache.entries()) {
      if (entry.expiresAtMs <= nowMs) {
        this.verifiedCache.delete(key);
      }
    }
  }
}
