// Cache configuration
const CACHE_KEY_ASSETS = 'dx_cached_assets';
const CACHE_KEY_PINATA_METADATA = 'dx_cached_pinata_metadata';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

// Set cache
export const setCache = <T,>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

// Get cache
export const getCache = <T,>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

// Clear specific cache
export const clearCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Clear all assets cache
export const clearAssetsCache = (): void => {
  try {
    clearCache(CACHE_KEY_ASSETS);
    clearCache(CACHE_KEY_PINATA_METADATA);
    console.log('✅ Assets cache cleared');
  } catch (error) {
    console.error('Error clearing assets cache:', error);
  }
};

// Export cache keys for use in hooks
export const CACHE_KEYS = {
  ASSETS: CACHE_KEY_ASSETS,
  PINATA_METADATA: CACHE_KEY_PINATA_METADATA,
} as const;

