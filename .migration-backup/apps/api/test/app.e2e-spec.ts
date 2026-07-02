import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Bootstrap smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL ??= 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY ??= 'anon-test';
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'role-test';
    process.env.DATABASE_URL ??= 'postgres://postgres:postgres@127.0.0.1:5432/tuskrank';
    process.env.CORS_ORIGINS ??= '*';
    // Cap rate limit generously so a single test run doesn't trigger 429.
    process.env.RATE_LIMIT_MAX ??= '10000';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();

    // Mirror main.ts glue.
    app.setGlobalPrefix(process.env.API_GLOBAL_PREFIX ?? 'api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health/live returns 200 with envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-time-ms']).toBeDefined();
  });

  it('GET /api/v2/health/live is not a configured version', async () => {
    await request(app.getHttpServer()).get('/api/v2/health/live').expect(404);
  });

  it('Missing bearer token on protected /api/v1/auth/me yields 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });
});
