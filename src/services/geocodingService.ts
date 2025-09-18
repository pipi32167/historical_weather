/**
 * 地理编码服务
 * 使用 Open-Meteo Geocoding API 搜索城市位置
 */

import { Location } from '../types/weather';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
  timezone: string;
  population?: number;
  country_id: number;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms: number;
}

class GeocodingService {
  private readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private cache = new Map<string, Location[]>();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30分钟缓存

  /**
   * 搜索城市
   */
  async searchCities(query: string, language: string = 'en'): Promise<Location[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();
    const cacheKey = `${trimmedQuery.toLowerCase()}-${language}`;
    
    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        name: trimmedQuery,
        count: '10',
        language: language,
        format: 'json'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      // 转换为Location格式并去重
      const locationMap = new Map<string, Location>();
      
      data.results.forEach(result => {
        const key = `${result.latitude.toFixed(3)}-${result.longitude.toFixed(3)}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            id: `geo-${result.latitude.toFixed(4)}-${result.longitude.toFixed(4)}-${result.name.replace(/\s+/g, '-')}`,
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country,
            timezone: result.timezone,
            admin1: result.admin1,
            admin2: result.admin2,
            // 添加行政区划信息到名称中以便区分
            displayName: this.formatDisplayName(result)
          });
        }
      });

      const locations = Array.from(locationMap.values());

      // 缓存结果
      this.cache.set(cacheKey, locations);
      
      // 清理过期缓存
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);

      return locations;

    } catch (error) {
      console.error('城市搜索失败:', error);
      throw new Error('搜索失败，请检查网络连接后重试');
    }
  }

  /**
   * 格式化显示名称
   */
  private formatDisplayName(result: GeocodingResult): string {
    const parts = [result.name];
    
    // 添加行政区划信息
    if (result.admin1 && result.admin1 !== result.name) {
      parts.push(result.admin1);
    }
    if (result.admin2 && result.admin2 !== result.name && result.admin2 !== result.admin1) {
      parts.push(result.admin2);
    }
    
    // 添加国家信息
    if (result.country && result.country !== result.name) {
      parts.push(result.country);
    }

    return parts.join(', ');
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export const geocodingService = new GeocodingService();