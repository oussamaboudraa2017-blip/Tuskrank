import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolveEnvFile, validateAppConfig } from './app.config';

/**
 * Global config module. Validation runs once at bootstrap.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: resolveEnvFile(),
      validate: (rawEnv) => validateAppConfig(rawEnv),
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
