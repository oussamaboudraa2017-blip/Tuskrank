import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { LogFormat, LogLevel } from '@common/enums';
import { APP_CONSTANTS } from '@common/constants/app.constants';

/**
 * Baseline redaction paths always present regardless of config.
 * Custom keywords from `LOG_REDACT_KEYWORDS` are added on top of this.
 */
const BASE_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-supabase-auth"]',
  '*.password',
  '*.token',
  '*.secret',
  '*.apikey',
  '*.apiKey',
  '*.access_token',
  '*.refresh_token',
] as const;

/**
 * Build the nestjs-pino LoggerModule options from app config.
 * Production: structured JSON with redaction.
 * Development: pretty (pino-pretty) for human readability.
 *
 * Always echoes the inbound `x-request-id` header into the log
 * context so every line carries the request correlation id.
 */
export function buildPinoParams(
  config: ConfigService,
): Params & { pinoHttp: Params['pinoHttp'] } {
  const level: string = config.get('LOG_LEVEL', LogLevel.Info);
  const format: string = config.get('LOG_FORMAT', LogFormat.Json);
  const appName = config.get<string>('APP_NAME', 'tuskrank-api');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  const redactKeywords = config.get<string>(
    'LOG_REDACT_KEYWORDS',
    'password,authorization,cookie,token,secret',
  );
  const redactPaths = redactKeywords
    ? redactKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    pinoHttp: {
      level,
      ...(format === LogFormat.Pretty
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'SYS:HH:MM:ss.l',
              },
            },
          }
        : {}),
      base: {
        service: appName,
        env: nodeEnv,
        instanceId: process.env.HOSTNAME ?? hostname() ?? randomUUID(),
      },
      redact: {
        paths: [
          ...BASE_REDACT_PATHS,
          ...redactPaths.flatMap((p) => [`req.body.${p}`, `req.headers.${p}`]),
        ],
        remove: false,
      },
      // Per-request field injection. The middleware already attached
      // `req.id`. We use it as `requestId` in pino's log context.
      customProps: (req: IncomingMessage & { id?: string }) => {
        const id = (req as { id?: string }).id;
        return { requestId: id ?? randomUUID() };
      },
      genReqId: (req: IncomingMessage & { id?: string }) => {
        const header = req.headers[APP_CONSTANTS.HEADERS.REQUEST_ID];
        const incoming = Array.isArray(header) ? header[0] : header;
        return (incoming ?? (req.id) ?? randomUUID()).toString();
      },
      autoLogging: nodeEnv !== 'test',
    },
  } as Params & { pinoHttp: Params['pinoHttp'] };
}
