import { CacheService } from '@shared';
import { HttpStatus, INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ProductsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL ??= 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY ??= 'anon-test';
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'role-test';
    process.env.DATABASE_URL ??= 'postgres://postgres:postgres@127.0.0.1:5432/tuskrank';
    process.env.CORS_ORIGINS ??= '*';
    process.env.RATE_LIMIT_MAX ??= '10000';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CacheService)
      .useValue({
        get: () => undefined,
        set: () => {},
        delete: () => {},
        deleteByPattern: () => {},
        clear: () => {},
        stats: () => ({ size: 0, hits: 0, misses: 0, hitRate: '0%' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(process.env.API_GLOBAL_PREFIX ?? 'api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/products returns 200 with paginated envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(HttpStatus.OK);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/products/:slug returns 404 for unknown slug', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products/does-not-exist')
      .expect(HttpStatus.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/products returns 401 without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .send({ name: 'Test', slug: 'test', brandId: '00000000-0000-0000-0000-000000000000' })
      .expect(HttpStatus.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });
});
