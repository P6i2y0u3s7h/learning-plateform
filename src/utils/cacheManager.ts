/**
 * ==============================================================
 * Brainstorm Academy — In-Memory TTL Cache & Request Coalescer
 * ==============================================================
 * Optimizes read-heavy Firestore operations for high concurrency.
 * Features:
 * 1. Time-To-Live (TTL) caching for public catalog data
 * 2. In-flight Promise deduplication (coalescing simultaneous calls)
 * 3. Stale-While-Revalidate (SWR) background refresh
 * 4. Granular cache eviction upon admin/teacher mutations
 * ==============================================================
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private hitCount = 0;
  private missCount = 0;

  /**
   * Get or execute an async fetcher with TTL and in-flight deduplication.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    // 1. Cache Hit within TTL
    if (entry && now - entry.timestamp < entry.ttlMs) {
      this.hitCount++;
      return entry.data as T;
    }

    // 2. Coalesce in-flight simultaneous requests for the same key
    if (this.inFlight.has(key)) {
      this.hitCount++;
      return this.inFlight.get(key) as Promise<T>;
    }

    // 3. Stale-While-Revalidate: Return stale if available while refreshing in background
    if (entry && now - entry.timestamp < entry.ttlMs * 3) {
      // Trigger background refresh without blocking client
      this.refreshInBackground(key, fetcher, ttlMs);
      this.hitCount++;
      return entry.data as T;
    }

    // 4. Cache Miss: Dispatch network fetch
    this.missCount++;
    const fetchPromise = fetcher()
      .then((data) => {
        this.set(key, data, ttlMs);
        this.inFlight.delete(key);
        return data;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        // If stale data is present, fallback gracefully
        if (entry) {
          return entry.data as T;
        }
        throw err;
      });

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }

  private refreshInBackground<T>(key: string, fetcher: () => Promise<T>, ttlMs: number) {
    if (this.inFlight.has(key)) return;

    const bgPromise = fetcher()
      .then((data) => {
        this.set(key, data, ttlMs);
        this.inFlight.delete(key);
      })
      .catch(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, bgPromise);
  }

  /**
   * Synchronously retrieve cached data if present and fresh or stale within SWR window.
   * Enables components to initialize state synchronously with 0ms blank skeleton delay.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp < entry.ttlMs * 3) {
      return entry.data as T;
    }
    return null;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttlMs * 3;
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  invalidate(keyPattern: string | RegExp) {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern);
    } else {
      for (const k of this.cache.keys()) {
        if (keyPattern.test(k)) {
          this.cache.delete(k);
        }
      }
    }
  }

  invalidateByPrefix(prefix: string) {
    for (const k of this.cache.keys()) {
      if (k.startsWith(prefix)) {
        this.cache.delete(k);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getMetrics() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
    return {
      entries: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatePercentage: Number(hitRate.toFixed(2)),
    };
  }
}

export const cacheManager = new CacheManager();
