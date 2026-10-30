/**
 * 简单的内存缓存工具
 * 用于缓存API响应以提升性能和用户体验
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class LocalStorageCache {
  private storagePrefix = 'weather_cache_';
  private maxStorageSize = 50 * 1024 * 1024; // 50MB 限制

  /**
   * 检查 localStorage 是否可用
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取存储的总大小（估算）
   */
  private getStorageSize(): number {
    if (!this.isLocalStorageAvailable()) return 0;
    
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  }

  /**
   * 清理最旧的缓存项直到达到目标大小
   */
  private cleanupOldestEntries(targetReduction: number): void {
    if (!this.isLocalStorageAvailable()) return;

    const cacheEntries: Array<{ key: string; timestamp: number; size: number }> = [];
    
    // 收集所有缓存项的信息
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const item: CacheItem<any> = JSON.parse(value);
            cacheEntries.push({
              key,
              timestamp: item.timestamp,
              size: key.length + value.length
            });
          } catch {
            // 损坏的项目，直接删除
            localStorage.removeItem(key);
          }
        }
      }
    }

    // 按时间戳排序（最旧的在前）
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    let removedSize = 0;
    for (const entry of cacheEntries) {
      if (removedSize >= targetReduction) break;
      
      localStorage.removeItem(entry.key);
      removedSize += entry.size;
    }

    console.log(`清理了 ${removedSize} 字节的旧缓存数据`);
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 生存时间（毫秒）
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // 默认5分钟
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage 不可用，缓存功能已禁用');
      return;
    }

    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiry: now + ttl
    };

    const storageKey = this.storagePrefix + key;
    const serializedData = JSON.stringify(cacheItem);

    try {
      // 检查存储大小，如果超过限制则清理
      const currentSize = this.getStorageSize();
      const newItemSize = storageKey.length + serializedData.length;
      
      if (currentSize + newItemSize > this.maxStorageSize) {
        // 清理 25% 的空间
        this.cleanupOldestEntries(this.maxStorageSize * 0.25);
      }

      localStorage.setItem(storageKey, serializedData);
    } catch (error) {
      console.warn('localStorage 写入失败，尝试清理缓存后重试:', error);
      
      // 尝试清理一些空间后重试
      this.cleanupOldestEntries(this.maxStorageSize * 0.5);
      
      try {
        localStorage.setItem(storageKey, serializedData);
      } catch (retryError) {
        console.error('缓存写入失败:', retryError);
      }
    }
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存的数据或null
   */
  get<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const storageKey = this.storagePrefix + key;
    const serializedData = localStorage.getItem(storageKey);
    
    if (!serializedData) {
      return null;
    }

    try {
      const item: CacheItem<T> = JSON.parse(serializedData);
      const now = Date.now();
      
      // 检查是否过期
      if (now > item.expiry) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('缓存数据解析失败，删除损坏的缓存项:', key, error);
      localStorage.removeItem(storageKey);
      return null;
    }
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    const storageKey = this.storagePrefix + key;
    const existed = localStorage.getItem(storageKey) !== null;
    localStorage.removeItem(storageKey);
    return existed;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`清空了 ${keysToRemove.length} 个缓存项`);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; keys: string[]; storageSize: number } {
    if (!this.isLocalStorageAvailable()) {
      return { size: 0, keys: [], storageSize: 0 };
    }

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        keys.push(key.replace(this.storagePrefix, ''));
      }
    }

    return {
      size: keys.length,
      keys,
      storageSize: this.getStorageSize()
    };
  }

  /**
   * 获取缓存详细信息
   */
  getDetailedStats(): { 
    size: number; 
    items: Array<{ key: string; timestamp: number; expiry: number; dataSize: number }>;
    totalStorageUsage: number;
    maxStorageSize: number;
  } {
    if (!this.isLocalStorageAvailable()) {
      return { 
        size: 0, 
        items: [], 
        totalStorageUsage: 0, 
        maxStorageSize: this.maxStorageSize 
      };
    }

    const items: Array<{ key: string; timestamp: number; expiry: number; dataSize: number }> = [];
    let totalStorageUsage = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(storageKey);
        if (value) {
          try {
            const item: CacheItem<any> = JSON.parse(value);
            const dataSize = storageKey.length + value.length;
            totalStorageUsage += dataSize;
            
            items.push({
              key: storageKey.replace(this.storagePrefix, ''),
              timestamp: item.timestamp,
              expiry: item.expiry,
              dataSize
            });
          } catch {
            // 损坏的项目，忽略
          }
        }
      }
    }

    return {
      size: items.length,
      items,
      totalStorageUsage,
      maxStorageSize: this.maxStorageSize
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }

    const now = Date.now();
    let cleanedCount = 0;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(storageKey);
        if (value) {
          try {
            const item: CacheItem<any> = JSON.parse(value);
            if (now > item.expiry) {
              keysToRemove.push(storageKey);
            }
          } catch {
            // 损坏的项目也要清理
            keysToRemove.push(storageKey);
          }
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleanedCount++;
    });

    return cleanedCount;
  }
}

// 创建全局缓存实例
export const cache = new LocalStorageCache();

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanup();
    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个过期缓存项`);
    }
  }, 60000); // 每分钟清理一次
}

// 预定义的缓存TTL常量
export const CACHE_TTL = {
  GEOCODING: 7 * 24 * 60 * 60 * 1000, // 地理编码结果：7天
  HISTORICAL_DATA: 7 * 24 * 60 * 60 * 1000, // 历史数据：7天（历史数据不会改变，可以缓存更长时间）
  CURRENT_WEATHER: 10 * 60 * 1000, // 当前天气：10分钟
  FORECAST_DATA: 60 * 60 * 1000, // 预报数据：1小时
  SEARCH_RESULTS: 30 * 60 * 1000, // 搜索结果：30分钟
} as const;

/**
 * 生成缓存键的辅助函数
 */
export const cacheKeys = {
  // v2：地理编码结果增加了相关性过滤，键版本号变化可以让旧的错误缓存自然失效
  geocoding: (cityName: string, language: string, count?: number) =>
    `geocoding:v2:${cityName}:${language}${typeof count === 'number' ? `:${count}` : ''}`,
  historicalWeather: (lat: number, lon: number, startDate: string, endDate: string, params?: string[]) => 
    `historical:${lat.toFixed(4)},${lon.toFixed(4)}:${startDate}:${endDate}:${params?.sort().join(',') || 'default'}`,
  currentWeather: (lat: number, lon: number) => `current:${lat.toFixed(4)},${lon.toFixed(4)}`,
  forecastData: (lat: number, lon: number, startDate: string, endDate: string) =>
    `forecast:${lat.toFixed(4)},${lon.toFixed(4)}:${startDate}:${endDate}`,
  historicalSamePeriod: (lat: number, lon: number, date: string, years: number) =>
    `same-period:${lat.toFixed(4)},${lon.toFixed(4)}:${date}:${years}`,
  todayHourlyForecast: (lat: number, lon: number) => `hourly-today:${lat.toFixed(4)},${lon.toFixed(4)}`,
};