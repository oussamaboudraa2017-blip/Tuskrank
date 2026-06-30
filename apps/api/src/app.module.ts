import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import { AppConfigModule } from '@config';
import { CommonModule } from '@common';
import { DatabaseModule } from '@database';
import { AuthModule } from '@modules/auth';
import { HealthModule } from '@modules/health';
import { ProductsModule } from '@modules/products';
import { SearchModule } from '@modules/search';
import { IngredientsModule } from '@modules/ingredients';
import { BrandsModule } from '@modules/brands';
import { ImportModule } from '@modules/import';
import { ScoringModule } from '@modules/scoring';
import { MetricsModule } from '@modules/metrics';
import * as path from 'path';

@Module({
  imports: [
    AppConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => {
        const host = cfg.get<string>('REDIS_HOST', 'localhost');
        const port = cfg.get<number>('REDIS_PORT', 6379);
        const password = cfg.get<string>('REDIS_PASSWORD');
        const db = cfg.get<number>('REDIS_DB', 0);
        const ttl = cfg.get<number>('REDIS_TTL_MS', 60_000);
        try {
          const store = await redisStore({
            socket: { host, port },
            password: password || undefined,
            database: db,
            ttl,
          });
          return { store, ttl };
        } catch {
          return { ttl };
        }
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    CommonModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    MetricsModule,
    ProductsModule,
    SearchModule,
    IngredientsModule,
    BrandsModule,
    ImportModule,
    ScoringModule,
  ],
})
export class AppModule {}
