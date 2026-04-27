const cache = new Map<string, { data: unknown; timestamp: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

export const apiCache = {
  get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > DEFAULT_TTL) {
      cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  },
  
  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  },
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      cache.clear();
      return;
    }
    
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },
  
  size(): number {
    return cache.size;
  }
};

export default apiCache;