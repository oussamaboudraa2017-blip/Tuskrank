declare module 'lru-cache' {
  interface LRUCacheOptions<K, V> {
    max?: number;
    ttl?: number;
  }

  interface SetOptions {
    ttl?: number;
  }

  class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V, options?: SetOptions): this;
    delete(key: K): boolean;
    clear(): void;
    has(key: K): boolean;
    keys(): IterableIterator<K>;
    readonly size: number;
  }

  export default LRUCache;
  export { LRUCache, LRUCacheOptions };
}
