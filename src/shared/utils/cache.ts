type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutos

export const cacheSet = <T>(key: string, value: T, ttl = DEFAULT_TTL) => {
  const expiresAt = Date.now() + ttl;
  store.set(key, { value, expiresAt });
};

export const cacheGet = <T>(key: string): T | null => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
};

export const cacheDel = (key: string) => {
  store.delete(key);
};

export const cacheClear = () => {
  store.clear();
};

export default {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  clear: cacheClear,
};
