/**
 * 简单的内存缓存工具
 * 用于缓存API响应以提升性能和用户体验
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 生存时间（毫秒）
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // 默认5分钟
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl
    });
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存的数据或null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    
    // 检查是否过期
    if (now > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    // 使用 forEach 而不是 for...of 来兼容 ES5
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }
}

// 创建全局缓存实例
export const cache = new MemoryCache();

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
  HISTORICAL_DATA: 24 * 60 * 60 * 1000, // 历史数据：1天
  CURRENT_WEATHER: 10 * 60 * 1000, // 当前天气：10分钟
  SEARCH_RESULTS: 30 * 60 * 1000, // 搜索结果：30分钟
} as const;

/**
 * 生成缓存键的辅助函数
 */
export const cacheKeys = {
  geocoding: (cityName: string, language: string) => `geocoding:${cityName}:${language}`,
  historicalWeather: (lat: number, lon: number, startDate: string, endDate: string) => 
    `historical:${lat.toFixed(4)},${lon.toFixed(4)}:${startDate}:${endDate}`,
  currentWeather: (lat: number, lon: number) => `current:${lat.toFixed(4)},${lon.toFixed(4)}`,
  historicalSamePeriod: (lat: number, lon: number, date: string, years: number) =>
    `same-period:${lat.toFixed(4)},${lon.toFixed(4)}:${date}:${years}`,
};