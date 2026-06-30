import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
    private readonly store = new Map<string, any>();

    get<T>(key: string): T | undefined {
        return this.store.get(key) as T;
    }

    set<T>(key: string, value: T): void {
        this.store.set(key, value);
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }
}