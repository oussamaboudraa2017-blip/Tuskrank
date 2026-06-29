import { SupabaseAuthGuard } from './supabase-auth.guard';

class FakeReflector {
  getAllAndOverride<T>(key: string): T | undefined {
    if (key === 'auth:public') return true as unknown as T;
    return undefined;
  }
}

class FakeConfig {
  get<T>(name: string, def?: T): T | undefined {
    if (name === 'SUPABASE_URL') return 'https://example.supabase.co' as unknown as T;
    if (name === 'SUPABASE_ANON_KEY') return 'anon' as unknown as T;
    if (name === 'NODE_ENV') return 'development' as unknown as T;
    return def;
  }
}

class FakeLogger {
  info(): void { /* swallow */ }
  warn(): void { /* swallow */ }
  error(): void { /* swallow */ }
  debug(): void { /* swallow */ }
}

class FakeAuthClient {
  async getUser() {
    return { data: { user: null }, error: { message: 'no token' } };
  }
}

describe('SupabaseAuthGuard (extraction only)', () => {
  it('skips verification when @Public() metadata is present', async () => {
    const guard = new SupabaseAuthGuard(
      new FakeReflector() as any,
      new FakeConfig() as any,
      new FakeLogger() as any,
    );
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    };
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('extracts bearer token from Authorization header', async () => {
    const guard = new SupabaseAuthGuard(
      new FakeReflector() as any,
      new FakeConfig() as any,
      new FakeLogger() as any,
    );
    (guard as any).client = new FakeAuthClient();
    const ctx: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer good-token' },
        }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    };
    await expect(guard.canActivate(ctx)).rejects.toThrow(/no token/);
  });

  it('extracts token from cookie when header absent', async () => {
    const guard = new SupabaseAuthGuard(
      new FakeReflector() as any,
      new FakeConfig() as any,
      new FakeLogger() as any,
    );
    (guard as any).client = new FakeAuthClient();
    const ctx: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { cookie: 'sb-access-token=cookie-token; unrelated=1' },
        }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    };
    await expect(guard.canActivate(ctx)).rejects.toThrow(/no token/);
  });
});