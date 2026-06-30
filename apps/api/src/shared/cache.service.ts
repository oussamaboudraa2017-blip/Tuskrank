import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private hits = 0;
  private misses = 0;
  private readonly fallback = new Map<string, { data: unknown; expiry: number }>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Optional() @InjectMetric('cache_hits_total') private readonly hitCounter?: Counter<string>,
    @Optional() @InjectMetric('cache_misses_total') private readonly missCounter?: Counter<string>,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.cacheManager.get<T>(key);
      if (data === undefined || data === null) {
        const fb = this.fallback.get(key);
        if (fb && fb.expiry > Date.now()) {
          this.hits++;
          this.hitCounter?.inc();
          return fb.data as T;
        }
        this.misses++;
        this.missCounter?.inc();
        this.logger.debug(`Cache miss: ${key}`);
        return undefined;
      }
      this.hits++;
      this.hitCounter?.inc();
      this.logger.debug(`Cache hit: ${key}`);
      return data;
    } catch (err) {
      this.logger.warn({ msg: `Cache get error for ${key}`, err: (err as Error).message });
      const fb = this.fallback.get(key);
      if (fb && fb.expiry > Date.now()) {
        return fb.data as T;
      }
      return undefined;
    }
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, data, ttlMs ?? 60_000);
    } catch (err) {
      this.logger.warn({ msg: `Cache set error for ${key}, using fallback`, err: (err as Error).message });
    }
    this.fallback.set(key, { data, expiry: Date.now() + (ttlMs ?? 60_000) });
    this.logger.debug(`Cache set: ${key}`);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.warn({ msg: `Cache delete error for ${key}`, err: (err as Error).message });
    }
    this.fallback.delete(key);
    this.logger.debug(`Cache delete: ${key}`);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const store: any = (this.cacheManager as any).store;
      if (store && typeof store.keys === 'function') {
        const keys: string[] = await store.keys();
        const matching = keys.filter((k: string) => k.includes(pattern));
        if (matching.length > 0) {
          await Promise.all(matching.map((k: string) => this.cacheManager.del(k)));
        }
      }
    } catch (err) {
      this.logger.warn({ msg: `Cache deleteByPattern error for ${pattern}`, err: (err as Error).message });
    }
    for (const key of this.fallback.keys()) {
      if (key.includes(pattern)) {
        this.fallback.delete(key);
      }
    }
    this.logger.debug(`Cache deleteByPattern: ${pattern}`);
  }

  async clear(): Promise<void> {
    try {
      const store: any = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else {
        this.fallback.clear();
      }
    } catch (err) {
      this.logger.warn({ msg: 'Cache clear error', err: (err as Error).message });
    }
    this.fallback.clear();
    this.logger.debug('Cache cleared');
  }

  stats(): { size: number; hits: number; misses: number; hitRate: string } {
    const total = this.hits + this.misses;
    return {
      size: this.fallback.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0%',
    };
  }
}
