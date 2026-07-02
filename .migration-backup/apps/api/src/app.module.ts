import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
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
    // CacheModule – uses in-memory storage (no Redis required)
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../src/i18n/'),
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
