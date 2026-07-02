import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation'],
    }),
    makeCounterProvider({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
    }),
    makeCounterProvider({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
    }),
  ],
  // exports removed – not needed because @InjectMetric works directly with providers
})
export class MetricsModule {}