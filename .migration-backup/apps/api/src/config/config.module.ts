import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolveEnvFile } from './app.config';
import { validateEnv } from './env.validation';

/**
 * Global config module. Validation runs once at bootstrap.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: resolveEnvFile(),
      validate: (rawEnv) => validateEnv(rawEnv) as Record<string, unknown>,
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
