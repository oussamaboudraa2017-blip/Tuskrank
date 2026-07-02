import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

/**
 * Mount Swagger at /api/docs (only when NODE_ENV !== 'production').
 * Production deployments expose Swagger only via a gated route or a
 * separate docs deploy; never publicly.
 */
export function mountSwagger(app: INestApplication): void {
  const config = app.get(ConfigService);
  const env = config.get<string>('NODE_ENV', 'development');
  const appName = config.get<string>('APP_NAME', 'tuskrank-api');
  const apiPrefix = config.get<string>('API_GLOBAL_PREFIX', 'api');

  if (env === 'production') return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription('Tuskrank backend API reference (Sprint 2A scaffolding).')
    .setVersion('0.2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Supabase JWT (access_token).',
      },
      'bearer',
    )
    .addServer(`http://localhost:${config.get<number>('APP_PORT', 4000)}`)
    .addTag('health', 'Liveness and readiness probes.')
    .addTag('auth', 'Authentication endpoints (login in Sprint 2B).')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (_controller, method) => method,
  });
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
