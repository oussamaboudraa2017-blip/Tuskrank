import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { buildPinoParams } from './logger.config';

/**
 * Global logger module:
 *   * wraps the entire app with nestjs-pino,
 *   * injects request-id into every log line,
 *   * provides a request-id propagator interceptor.
 *
 * Every other module should depend on PinoLogger (from nestjs-pino)
 * rather than console to keep production logs structured.
 */
@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildPinoParams(config),
    }),
  ],
  providers: [RequestLoggingInterceptor],
  exports: [RequestLoggingInterceptor, LoggerModule],
})
export class LoggerCoreModule {}
