import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { AppEnvironment, LogFormat, LogLevel } from '@common/enums';

/**
 * The single source of truth for runtime configuration.
 *
 * Validated on bootstrap; any unknown / invalid env keys produce
 * a hard fail — startups do not silently proceed with bad config.
 */
export class AppConfig {
  /* ============ Application ============ */

  @IsEnum(AppEnvironment)
  NODE_ENV: AppEnvironment = AppEnvironment.Development;

  @IsString()
  @IsNotEmpty()
  APP_NAME: string = 'tuskrank-api';

  @IsString()
  @IsNotEmpty()
  APP_ENV: string = 'local';

  @IsString()
  @Matches(/^[0-9.]+$/, { message: 'APP_HOST must be a host or ip' })
  APP_HOST: string = '0.0.0.0';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT: number = 4000;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'API_GLOBAL_PREFIX must be lowercase-kebab' })
  API_GLOBAL_PREFIX: string = 'api';

  @IsString()
  @Matches(/^\d+$/, { message: 'API_DEFAULT_VERSION must be numeric' })
  API_DEFAULT_VERSION: string = '1';

  /* ============ CORS ============ */

  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value))
  @IsString({ each: true })
  CORS_ORIGINS: string[] = [];

  /* ============ Supabase ============ */

  @ValidateIf((o) => o.NODE_ENV !== AppEnvironment.Test)
  @IsUrl({ require_tld: false, require_protocol: true })
  SUPABASE_URL: string | undefined;

  @ValidateIf((o) => o.NODE_ENV !== AppEnvironment.Test)
  @IsString()
  SUPABASE_ANON_KEY: string | undefined;

  @ValidateIf((o) => o.NODE_ENV !== AppEnvironment.Test)
  @IsString()
  SUPABASE_SERVICE_ROLE_KEY: string | undefined;

  @IsString()
  SUPABASE_PROJECT_ID: string = '';

  @IsString()
  SUPABASE_JWT_SECRET: string = '';

  /* ============ Database ============ */

  @ValidateIf((o) => o.NODE_ENV !== AppEnvironment.Test)
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string | undefined;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  DATABASE_SSL: boolean = true;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  DATABASE_POOL_MIN: number = 2;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  DATABASE_POOL_MAX: number = 10;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(100)
  DATABASE_STATEMENT_TIMEOUT_MS: number = 15000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(100)
  DATABASE_QUERY_TIMEOUT_MS: number = 10000;

  /* ============ Logging ============ */

  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsEnum(LogFormat)
  LOG_FORMAT: LogFormat = LogFormat.Json;

  @IsString()
  LOG_REDACT_KEYWORDS: string = 'password,authorization,cookie,token,secret';

  /* ============ Rate limit / request ============ */

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(100)
  RATE_LIMIT_WINDOW_MS: number = 60000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX: number = 120;

  @IsString()
  REQUEST_BODY_LIMIT: string = '2mb';

  /* ============ Health ============ */

  @Transform(({ value }) => Number(value))
  @IsInt()
  HEALTH_MEMORY_HEAP_THRESHOLD: number = 400;

  @Transform(({ value }) => Number(value))
  @IsInt()
  HEALTH_MEMORY_RSS_THRESHOLD: number = 512;

  /* ============ Observability ============ */

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  OTEL_ENABLED: boolean = false;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;

  @IsString()
  OTEL_SERVICE_NAME: string = 'tuskrank-api';
}

/**
 * Read .env file path from NODE_ENV. Fallback to `.env`.
 * The actual file loading is done by @nestjs/config.
 */
export function resolveEnvFile(): string {
  const env = process.env.NODE_ENV ?? 'development';
  const explicit = process.env.ENV_FILE;
  if (explicit) return explicit;
  switch (env) {
    case 'production':
      return '.env.production';
    case 'staging':
      return '.env.staging';
    case 'test':
      return '.env.test';
    default:
      return '.env.development';
  }
}

/**
 * Validate a plain object of env vars against the AppConfig class.
 * Throws on the first validation error in strict mode. Returns the
 * transformed (and now strongly-typed) instance on success.
 */
export function validateAppConfig(env: Record<string, unknown>): AppConfig {
  const validated = plainToInstance(AppConfig, env, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });
  if (errors.length > 0) {
    const messages = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }
  return validated;
}
