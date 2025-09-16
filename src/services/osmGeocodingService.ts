/**
 * OpenStreetMap Nominatim 地理编码服务
 * 提供正向和逆向地理编码功能，支持多语言
 */

export interface OSMAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  district?: string;
  suburb?: string;
  neighbourhood?: string;
  state?: string;
  province?: string;
  region?: string;
  country?: string;
  postcode?: string;
  house_number?: string;
  road?: string;
}

export interface OSMReverseResult {
  lat: string;
  lon: string;
  display_name: string;
  address: OSMAddress;
  error?: string;
}

export interface OSMSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address: OSMAddress;
  importance: number;
  class: string;
  type: string;
}

export interface GeocodeOptions {
  /** 语言代码，如 'zh-CN', 'zh', 'en' */
  language?: string;
  /** 缓存时间（毫秒），默认24小时 */
  cacheTime?: number;
  /** 是否启用缓存，默认true */
  enableCache?: boolean;
  /** zoom级别 (0-18)，默认10 */
  zoom?: number;
}

class OSMGeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'HistoricalWeatherApp/1.0 (historical-weather@example.com)';
  private readonly defaultCacheTime = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 逆地理编码：根据坐标获取地址信息
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    options: GeocodeOptions = {}
  ): Promise<string | null> {
    const {
      language = 'zh-CN,zh,en',
      cacheTime = this.defaultCacheTime,
      enableCache = true,
      zoom = 10
    } = options;

    try {
      console.log('🗺️ OSM逆地理编码:', { latitude, longitude, language });

      // 检查缓存
      if (enableCache) {
        const cacheKey = this.getCacheKey('reverse', latitude, longitude, language);
        const cached = this.getFromCache(cacheKey, cacheTime);
        if (cached) {
          console.log('🗺️ 使用缓存的OSM数据');
          return cached;
        }
      }

      // 构建API URL
      const url = this.buildReverseUrl(latitude, longitude, language, zoom);
      
      // 发起请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`OSM API请求失败: ${response.status} ${response.statusText}`);
      }

      const data: OSMReverseResult = await response.json();
      console.log('🗺️ OSM返回数据:', data);

      if (data.error) {
        console.warn('OSM API返回错误:', data.error);
        return this.formatCoordinates(latitude, longitude);
      }

      // 解析地址
      const locationName = this.parseLocationName(data);

      // 缓存结果
      if (enableCache) {
        const cacheKey = this.getCacheKey('reverse', latitude, longitude, language);
        this.saveToCache(cacheKey, locationName);
      }

      console.log('🏙️ 解析得到位置名称:', locationName);
      return locationName;

    } catch (error) {
      console.error('OSM逆地理编码失败:', error);
      return this.formatCoordinates(latitude, longitude);
    }
  }

  /**
   * 正向地理编码：根据地址搜索坐标
   */
  async searchLocation(
    query: string,
    options: GeocodeOptions = {}
  ): Promise<OSMSearchResult[]> {
    const {
      language = 'zh-CN,zh,en',
      cacheTime = this.defaultCacheTime,
      enableCache = true
    } = options;

    try {
      console.log('🔍 OSM地址搜索:', { query, language });

      // 检查缓存
      if (enableCache) {
        const cacheKey = this.getCacheKey('search', query, 0, language);
        const cached = this.getFromCache(cacheKey, cacheTime);
        if (cached) {
          console.log('🔍 使用缓存的搜索结果');
          return cached;
        }
      }

      // 构建搜索URL
      const url = this.buildSearchUrl(query, language);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`OSM搜索请求失败: ${response.status} ${response.statusText}`);
      }

      const results: OSMSearchResult[] = await response.json();
      console.log('🔍 OSM搜索结果:', results);

      // 缓存结果
      if (enableCache) {
        const cacheKey = this.getCacheKey('search', query, 0, language);
        this.saveToCache(cacheKey, results);
      }

      return results;

    } catch (error) {
      console.error('OSM地址搜索失败:', error);
      return [];
    }
  }

  /**
   * 根据当前语言设置获取适当的语言参数
   */
  getLanguageParam(currentLanguage: string): string {
    const langMap: Record<string, string> = {
      'zh': 'zh-CN,zh,en',
      'zh-CN': 'zh-CN,zh,en',
      'zh-TW': 'zh-TW,zh,en',
      'en': 'en,zh-CN,zh',
      'en-US': 'en,zh-CN,zh'
    };

    return langMap[currentLanguage] || langMap['zh-CN'];
  }

  /**
   * 构建逆地理编码URL
   */
  private buildReverseUrl(lat: number, lon: number, language: string, zoom: number): string {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      zoom: zoom.toString(),
      format: 'json',
      'accept-language': language,
      addressdetails: '1'
    });

    return `${this.baseUrl}/reverse?${params.toString()}`;
  }

  /**
   * 构建搜索URL
   */
  private buildSearchUrl(query: string, language: string): string {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      'accept-language': language,
      addressdetails: '1',
      limit: '10'
    });

    return `${this.baseUrl}/search?${params.toString()}`;
  }

  /**
   * 解析位置名称
   */
  private parseLocationName(data: OSMReverseResult): string {
    const address = data.address || {};

    // 优先级顺序：city > town > village > municipality > county > district > suburb > neighbourhood
    const cityName = address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.district ||
      address.suburb ||
      address.neighbourhood;

    const state = address.state || address.province || address.region;
    const country = address.country;

    // 构建位置名称，包含适当的层级结构
    let locationName = '';
    if (cityName) {
      locationName = cityName;

      // 添加省/州（如果与城市不同且存在）
      if (state && state !== cityName && !cityName.includes(state)) {
        locationName += `, ${state}`;
      }

      // 添加国家（如果与省/州不同且未包含）
      if (country && country !== state && !locationName.includes(country)) {
        locationName += `, ${country}`;
      }
    } else if (data.display_name) {
      // 回退到display_name的前几个组件
      const nameComponents = data.display_name.split(',').map((s: string) => s.trim());
      locationName = nameComponents.slice(0, 3).join(', ');
    } else {
      // 最终回退到坐标
      locationName = this.formatCoordinates(parseFloat(data.lat), parseFloat(data.lon));
    }

    return locationName;
  }

  /**
   * 格式化坐标显示
   */
  private formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(type: string, param1: string | number, param2: number, language: string): string {
    return `osm_${type}_${param1}_${param2}_${language.replace(',', '_')}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string, maxAge: number): any {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.warn('缓存读取失败:', error);
    }
    return null;
  }

  /**
   * 保存数据到缓存
   */
  private saveToCache(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('缓存保存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const osmKeys = keys.filter(key => key.startsWith('osm_'));
      
      osmKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            if (age > this.defaultCacheTime) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 删除损坏的缓存项
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('清理缓存失败:', error);
    }
  }
}

// 导出单例实例
export const osmGeocodingService = new OSMGeocodingService();