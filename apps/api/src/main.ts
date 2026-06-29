import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  Logger as NestLogger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { mountSwagger } from '@common/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Use nestjs-pino for all logger output.
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const port = config.get<number>('APP_PORT', 4000);
  const host = config.get<string>('APP_HOST', '0.0.0.0');
  const globalPrefix = config.get<string>('API_GLOBAL_PREFIX', 'api');
  const corsOrigins = config.get<string[]>('CORS_ORIGINS', []);
  const bodyLimit = config.get<string>('REQUEST_BODY_LIMIT', '2mb');
  const defaultVersion = config.get<string>('API_DEFAULT_VERSION', '1');

  /* ============================================================
   * Order matters:
   *   1. Express-side security headers (helmet).
   *   2. CORS preflight (must run BEFORE body parsers).
   *   3. Body parsers (json / urlencoded, with explicit limits).
   *   4. Compression (output only; safe after parsers).
   *   5. URI versioning + global prefix (set on the Nest app, not
   *      middleware order-dependent).
   * ============================================================ */

  /* Trust the first proxy (Vercel / Fastly / Cloudflare / ALB / k8s). */
  app.set('trust proxy', 1);

  /* Security headers — applied first to cover ALL responses, even 4xx. */
  app.use(
    helmet({
      contentSecurityPolicy: false, // API, no HTML responses
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  /* CORS — must sit BEFORE body parsers so preflight OPTIONS short-circuits. */
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-request-id',
      'x-correlation-id',
    ],
    exposedHeaders: ['x-request-id', 'x-request-time-ms', 'x-correlation-id'],
    maxAge: 86400,
  });

  /* Body parsers — explicit limits prevent streaming-DoS. */
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  /* Compression for responses > 1 KB. */
  app.use(compression({ threshold: 1024 }));

  /* URI versioning + global prefix. Controllers declare their own
   * default version via `@Controller({ version: '1' })`. */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });
  app.setGlobalPrefix(globalPrefix);

  /* Global validation pipe (class-validator). */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  /* Express-level request timeouts — prevents clients holding connections indefinitely. */
  const httpServer = app.getHttpServer();
  httpServer.requestTimeout = 30_000;
  httpServer.headersTimeout = 10_000;

  /* Graceful shutdown. */
  app.enableShutdownHooks();

  /* Swagger (dev/staging only). */
  mountSwagger(app);

  await app.listen(port, host);

  const url = await app.getUrl();
  NestLogger.log(`Tuskrank API listening at ${url}`, 'Bootstrap');
  NestLogger.log(
    `Swagger docs:  ${url.replace(/\/$/, '')}/docs (dev only)`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
