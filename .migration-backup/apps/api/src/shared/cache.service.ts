import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
    private readonly store = new Map<string, { value: unknown; expiresAt: number | null }>();

    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlMs?: number): void {
        const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : null;
        this.store.set(key, { value, expiresAt });
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    /**
     * Delete all cache entries whose key matches the given prefix/pattern.
     * Uses simple prefix matching (e.g., 'brand:featured' removes 'brand:featured', 'brand:featured:sub', etc.).
     */
    deleteByPattern(pattern: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(pattern)) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Return basic cache statistics for health checks.
     */
    stats(): { keys: number; sizeEstimate: string } {
        const keys = this.store.size;
        const bytes = JSON.stringify([...this.store.values()]).length;
        const sizeEstimate = bytes > 1024 * 1024
            ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
            : `${(bytes / 1024).toFixed(2)} KB`;
        return { keys, sizeEstimate };
    }

    clear(): void {
        this.store.clear();
    }
}