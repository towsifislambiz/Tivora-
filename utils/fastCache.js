/**
 * In-Memory Fast Cache Utility for 0ms Instant Page Navigation
 * Eliminates artificial skeleton flashes on fast internet connections & tab switches.
 */
const memoryCache = new Map();

export const FastCache = {
  get(key) {
    return memoryCache.get(key) || null;
  },
  set(key, data) {
    memoryCache.set(key, data);
  },
  clear(key) {
    if (key) memoryCache.delete(key);
    else memoryCache.clear();
  }
};
