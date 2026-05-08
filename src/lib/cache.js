/**
 * In-memory LRU cache — stand-in for Redis.
 * Stores short_code → original_url mappings for the redirect hot path.
 */

const MAX_SIZE = 10000;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

class LRUCache {
  constructor(maxSize = MAX_SIZE) {
    this.maxSize = maxSize;
    this.cache = new Map(); // key → { value, expiresAt }
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    // Remove if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Singleton instance (survives hot reloads in dev)
const globalCache = globalThis.__urlShortenerCache || new LRUCache();
if (!globalThis.__urlShortenerCache) {
  globalThis.__urlShortenerCache = globalCache;
}

export const cache = globalCache;
