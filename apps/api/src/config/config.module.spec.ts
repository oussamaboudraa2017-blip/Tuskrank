import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { validateAppConfig, resolveEnvFile } from '../config/app.config';
import { AppConfigModule } from '../config/config.module';

describe('AppConfigModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      APP_ENV: 'ci',
      APP_NAME: 'tuskrank-api-test',
      APP_HOST: '0.0.0.0',
      APP_PORT: '4001',
      API_GLOBAL_PREFIX: 'api',
      API_DEFAULT_VERSION: '1',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-test',
      SUPABASE_SERVICE_ROLE_KEY: 'role-test',
      SUPABASE_JWT_SECRET: 'jwt-test',
      DATABASE_URL: 'postgres://u:p@localhost:5432/tuskrank',
      DATABASE_SSL: 'false',
      DATABASE_POOL_MIN: '1',
      DATABASE_POOL_MAX: '5',
      DATABASE_STATEMENT_TIMEOUT_MS: '5000',
      DATABASE_QUERY_TIMEOUT_MS: '3000',
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'json',
      LOG_REDACT_KEYWORDS: 'password,token',
      CORS_ORIGINS: 'http://localhost:3000',
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '60',
      REQUEST_BODY_LIMIT: '1mb',
      HEALTH_MEMORY_HEAP_THRESHOLD: '300',
      HEALTH_MEMORY_RSS_THRESHOLD: '400',
      OTEL_ENABLED: 'false',
      OTEL_SERVICE_NAME: 'tuskrank-api-test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validateAppConfig() returns a typed AppConfig instance', () => {
    const cfg = validateAppConfig(process.env);
    expect(cfg.APP_PORT).toBe(4001);
    expect(cfg.DATABASE_SSL).toBe(false);
    expect(typeof cfg.CORS_ORIGINS).toBe('object');
  });

  it('resolveEnvFile() picks test env when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    process.env.ENV_FILE = '';
    expect(resolveEnvFile()).toBe('.env.test');
  });

  it('AppConfigModule imports ConfigModule from @nestjs/config', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();
    expect(moduleRef).toBeDefined();
  });

  it('rejects unknown types for numeric fields', () => {
    const bad = { ...process.env, APP_PORT: 'not-a-number' };
    expect(() => validateAppConfig(bad)).toThrow();
  });
});
