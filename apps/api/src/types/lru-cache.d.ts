declare module 'lru-cache' {
  interface LRUCacheOptions<K, V> {
    max?: number;
    ttl?: number;
    maxAge?: number;
  }

  class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    delete(key: K): boolean;
    clear(): void;
    has(key: K): boolean;
  }

  export default LRUCache;
  export { LRUCacheOptions };
}
