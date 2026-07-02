import { z } from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('tuskrank-api'),
  APP_ENV: z.string().default('local'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_GLOBAL_PREFIX: z.string().default('api'),
  API_DEFAULT_VERSION: z.string().default('1'),

  CORS_ORIGINS: z.string().default(''),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_PROJECT_ID: z.string().default(''),
  SUPABASE_JWT_SECRET: z.string().default(''),

  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_SSL: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v.toLowerCase() === 'true' : v))
    .default(true),
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).max(1000).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(1000).default(10),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(100).default(15000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().min(100).default(10000),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  LOG_REDACT_KEYWORDS: z.string().default('password,authorization,cookie,token,secret'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(100).default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  REQUEST_BODY_LIMIT: z.string().default('2mb'),

  HEALTH_MEMORY_HEAP_THRESHOLD: z.coerce.number().int().default(400),
  HEALTH_MEMORY_RSS_THRESHOLD: z.coerce.number().int().default(512),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_TTL_MS: z.coerce.number().int().min(100).default(60000),

  METRICS_ENABLED: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v.toLowerCase() === 'true' : v))
    .default(false),
  METRICS_ALLOWED_IPS: z.string().default('127.0.0.1,::1'),

  OTEL_ENABLED: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v.toLowerCase() === 'true' : v))
    .default(false),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('tuskrank-api'),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;

export function validateEnv(env: Record<string, unknown>): EnvConfig {
  const result = envValidationSchema.safeParse(env);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }
  return result.data;
}
