/**
 * In-Memory & LocalStorage Fast Cache Utility for 0ms Instant Navigation
 * Eliminates artificial skeleton flashes on fast internet connections & tab switches.
 */
const memoryCache = new Map();
const STORAGE_PREFIX = 'tivora_fast_cache_';

export const FastCache = {
  get(key) {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (e) {}
    return null;
  },
  set(key, data) {
    memoryCache.set(key, data);
    try {
      // Clean non-serializable fields if any (like lastDocSnap functions)
      const cleanData = JSON.parse(JSON.stringify(data, (k, v) => (k === 'lastDocSnap' ? undefined : v)));
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cleanData));
    } catch (e) {}
  },
  clear(key) {
    if (key) {
      memoryCache.delete(key);
      try { localStorage.removeItem(`${STORAGE_PREFIX}${key}`); } catch (e) {}
    } else {
      memoryCache.clear();
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
        });
      } catch (e) {}
    }
  }
};
