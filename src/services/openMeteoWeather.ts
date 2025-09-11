/**
 * Open-Meteo免费天气API服务
 * 提供地理编码、当前天气和历史天气数据查询功能
 * 集成缓存机制以提升性能和用户体验
 */

import { cache, CACHE_TTL, cacheKeys } from '../utils/cache';
import { executeConcurrently } from '../utils/concurrencyController';

export interface OpenMeteoLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  timezone: string;
  population?: number;
}

export interface OpenMeteoCurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  time: string;
}

export interface OpenMeteoHistoricalData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    temperature_2m_mean?: string;
    precipitation_sum?: string;
    windspeed_10m_max?: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean?: number[];
    precipitation_sum?: number[];
    windspeed_10m_max?: number[];
  };
}

export interface OpenMeteoForecastData {
  latitude: number;
  longitude: number;
  current_weather: OpenMeteoCurrentWeather;
  hourly_units?: Record<string, string>;
  hourly?: Record<string, any[]>;
  daily_units?: Record<string, string>;
  daily?: Record<string, any[]>;
}

/**
 * Open-Meteo API配置
 */
const OPEN_METEO_CONFIG = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  forecast: 'https://api.open-meteo.com/v1/forecast',
  historical: 'https://archive-api.open-meteo.com/v1/archive',
  timeout: 10000, // 10秒超时
  retries: 3,
} as const;

/**
 * 网络请求工具函数
 */
async function fetchWithTimeout(url: string, timeout: number = OPEN_METEO_CONFIG.timeout): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HistoricalWeatherApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 带重试机制的请求函数
 */
async function fetchWithRetry<T>(url: string, maxRetries: number = OPEN_METEO_CONFIG.retries): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url);
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Open-Meteo API请求失败 (尝试 ${attempt + 1}/${maxRetries}):`, error);
      
      // 最后一次尝试失败时不等待
      if (attempt < maxRetries - 1) {
        // 指数退避：第一次重试等待1秒，第二次等待2秒
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      }
    }
  }

  throw new Error(`Open-Meteo API请求失败: ${lastError?.message || '未知错误'}`);
}

/**
 * Open-Meteo天气服务类
 */
export class OpenMeteoWeatherService {
  /**
   * 地理编码 - 根据城市名获取坐标和详细信息（支持缓存）
   * @param cityName 城市名称
   * @param language 语言代码 (zh, en, 等)
   * @param count 返回结果数量限制
   * @returns 匹配的地点列表
   */
  async geocodeCity(
    cityName: string,
    language: string = 'zh',
    count: number = 5
  ): Promise<OpenMeteoLocation[]> {
    // 检查缓存
    const cacheKey = cacheKeys.geocoding(cityName, language);
    const cachedResult = cache.get<OpenMeteoLocation[]>(cacheKey);
    
    if (cachedResult) {
      console.log('从缓存获取地理编码结果:', cityName);
      return cachedResult;
    }

    const params = new URLSearchParams({
      name: cityName,
      count: count.toString(),
      language,
      format: 'json'
    });

    const url = `${OPEN_METEO_CONFIG.geocoding}?${params}`;
    
    try {
      const response = await fetchWithRetry<{ results?: OpenMeteoLocation[] }>(url);
      const results = response.results || [];
      
      // 缓存结果（地理编码结果相对稳定，缓存时间较长）
      cache.set(cacheKey, results, CACHE_TTL.GEOCODING);
      
      return results;
    } catch (error) {
      console.error('Open-Meteo地理编码失败:', error);
      throw new Error(`无法获取城市"${cityName}"的地理信息: ${error}`);
    }
  }

  /**
   * 获取当前天气数据
   * @param latitude 纬度
   * @param longitude 经度
   * @param timezone 时区 (可选，默认auto)
   * @returns 当前天气数据
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    timezone: string = 'auto'
  ): Promise<OpenMeteoForecastData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: 'true',
      timezone
    });

    const url = `${OPEN_METEO_CONFIG.forecast}?${params}`;
    
    try {
      return await fetchWithRetry<OpenMeteoForecastData>(url);
    } catch (error) {
      console.error('Open-Meteo当前天气获取失败:', error);
      throw new Error(`无法获取坐标(${latitude}, ${longitude})的当前天气: ${error}`);
    }
  }

  /**
   * 获取今日预报数据（包含最高最低温度）
   * @param latitude 纬度
   * @param longitude 经度
   * @param timezone 时区 (可选，默认auto)
   * @returns 今日预报数据
   */
  async getTodayForecast(
    latitude: number,
    longitude: number,
    timezone: string = 'auto'
  ): Promise<OpenMeteoForecastData> {
    const today = new Date().toISOString().split('T')[0];
    
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: 'true',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
      start_date: today,
      end_date: today,
      timezone
    });

    const url = `${OPEN_METEO_CONFIG.forecast}?${params}`;
    
    try {
      return await fetchWithRetry<OpenMeteoForecastData>(url);
    } catch (error) {
      console.error('Open-Meteo今日预报获取失败:', error);
      throw new Error(`无法获取坐标(${latitude}, ${longitude})的今日预报: ${error}`);
    }
  }

  /**
   * 获取历史天气数据
   * @param latitude 纬度
   * @param longitude 经度
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   * @param timezone 时区 (可选，默认auto)
   * @param dailyParams 需要的每日参数
   * @returns 历史天气数据
   */
  async getHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    timezone: string = 'auto',
    dailyParams: string[] = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']
  ): Promise<OpenMeteoHistoricalData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: dailyParams.join(','),
      timezone
    });

    const url = `${OPEN_METEO_CONFIG.historical}?${params}`;
    
    try {
      return await fetchWithRetry<OpenMeteoHistoricalData>(url);
    } catch (error) {
      console.error('Open-Meteo历史天气获取失败:', error);
      throw new Error(`无法获取坐标(${latitude}, ${longitude})从${startDate}到${endDate}的历史天气: ${error}`);
    }
  }

  /**
   * 获取历史同期数据（多年对比）- 优化版本，使用日期范围查询
   * @param latitude 纬度
   * @param longitude 经度
   * @param targetDate 目标日期
   * @param years 回溯年数
   * @param timezone 时区
   * @returns 多年同期数据
   */
  async getHistoricalSamePeriod(
    latitude: number,
    longitude: number,
    targetDate: Date,
    years: number = 20,
    timezone: string = 'auto'
  ): Promise<Array<{ year: number; data: OpenMeteoHistoricalData }>> {
    // 生成缓存键
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${month}-${day}`;
    const cacheKey = cacheKeys.historicalSamePeriod(latitude, longitude, dateStr, years);
    
    // 检查缓存
    const cachedResult = cache.get<Array<{ year: number; data: OpenMeteoHistoricalData }>>(cacheKey);
    if (cachedResult) {
      console.log('从缓存获取历史同期数据:', dateStr);
      return cachedResult;
    }

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - years;
    const endYear = currentYear - 1;

    console.log(`[OpenMeteoService] 获取历史同期数据（日期范围查询）: ${dateStr}, ${startYear}-${endYear}`);

    try {
      // 一次性获取整个年份范围的数据
      const rangeData = await this.getHistoricalWeather(
        latitude,
        longitude,
        `${startYear}-01-01`,
        `${endYear}-12-31`,
        timezone,
        ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']
      );

      console.log(`[OpenMeteoService] 成功获取 ${rangeData.daily.time.length} 天的历史数据，准备过滤同期数据`);

      // 过滤出目标日期的同期数据
      const results: Array<{ year: number; data: OpenMeteoHistoricalData }> = [];
      const targetMonth = targetDate.getMonth() + 1; // 0-11 -> 1-12
      const targetDay = targetDate.getDate();

      // 按年份分组同期数据
      const dataByYear: Record<number, {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum?: number[];
      }> = {};

      rangeData.daily.time.forEach((time, index) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 只保留目标日期的数据
        if (month === targetMonth && day === targetDay) {
          if (!dataByYear[year]) {
            dataByYear[year] = {
              time: [],
              temperature_2m_max: [],
              temperature_2m_min: [],
              precipitation_sum: []
            };
          }

          dataByYear[year].time.push(time);
          dataByYear[year].temperature_2m_max.push(rangeData.daily.temperature_2m_max[index]);
          dataByYear[year].temperature_2m_min.push(rangeData.daily.temperature_2m_min[index]);
          if (rangeData.daily.precipitation_sum) {
            dataByYear[year].precipitation_sum!.push(rangeData.daily.precipitation_sum[index]);
          }
        }
      });

      // 构建每年的数据结构
      for (const [yearStr, yearData] of Object.entries(dataByYear)) {
        const year = parseInt(yearStr);
        
        if (yearData.time.length > 0) {
          const yearHistoricalData: OpenMeteoHistoricalData = {
            latitude: rangeData.latitude,
            longitude: rangeData.longitude,
            generationtime_ms: rangeData.generationtime_ms,
            utc_offset_seconds: rangeData.utc_offset_seconds,
            timezone: rangeData.timezone,
            timezone_abbreviation: rangeData.timezone_abbreviation,
            elevation: rangeData.elevation,
            daily_units: {
              time: rangeData.daily_units.time,
              temperature_2m_max: rangeData.daily_units.temperature_2m_max,
              temperature_2m_min: rangeData.daily_units.temperature_2m_min,
              precipitation_sum: rangeData.daily_units.precipitation_sum
            },
            daily: {
              time: yearData.time,
              temperature_2m_max: yearData.temperature_2m_max,
              temperature_2m_min: yearData.temperature_2m_min,
              precipitation_sum: yearData.precipitation_sum
            }
          };

          results.push({ year, data: yearHistoricalData });
        }
      }

      console.log(`[OpenMeteoService] 成功提取 ${results.length} 年的${dateStr}同期数据`);

      // 按年份排序
      results.sort((a, b) => a.year - b.year);

      // 缓存结果（历史数据不会变化，可以缓存较长时间）
      if (results.length > 0) {
        cache.set(cacheKey, results, CACHE_TTL.HISTORICAL_DATA);
      }

      return results;
    } catch (error) {
      console.error(`[OpenMeteoService] 获取历史同期数据失败:`, error);
      
      // 降级处理：如果日期范围查询失败，回退到原来的方法
      console.warn(`[OpenMeteoService] 回退到逐年查询方式`);
      return this.getHistoricalSamePeriodFallback(latitude, longitude, targetDate, years, timezone);
    }
  }

  /**
   * 获取历史同期数据的降级方法（保持兼容性）
   */
  private async getHistoricalSamePeriodFallback(
    latitude: number,
    longitude: number,
    targetDate: Date,
    years: number = 20,
    timezone: string = 'auto'
  ): Promise<Array<{ year: number; data: OpenMeteoHistoricalData }>> {
    const results: Array<{ year: number; data: OpenMeteoHistoricalData }> = [];
    const currentYear = new Date().getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    // 使用并发控制器请求多年数据（降级方式）
    const tasks = [];
    for (let i = 0; i < years; i++) {
      const year = currentYear - i - 1;
      const fullDateStr = `${year}-${month}-${day}`;
      
      tasks.push(async () => {
        try {
          const data = await this.getHistoricalWeather(
            latitude,
            longitude,
            fullDateStr,
            fullDateStr,
            timezone,
            ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']
          );
          return { year, data };
        } catch (error) {
          console.warn(`获取${year}年历史数据失败:`, error);
          return null;
        }
      });
    }

    const responses = await executeConcurrently(tasks, 10);
    
    // 过滤掉失败的请求
    for (const response of responses) {
      if (response) {
        results.push(response);
      }
    }
    
    console.log(`[OpenMeteoService] 降级方式成功获取 ${results.length}/${tasks.length} 年的历史同期数据`);

    return results;
  }

  /**
   * 验证坐标是否有效
   * @param latitude 纬度
   * @param longitude 经度
   * @returns 是否有效
   */
  isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * 将天气代码转换为描述
   * @param code 天气代码
   * @returns 天气描述
   */
  getWeatherDescription(code: number): string {
    const descriptions: Record<number, string> = {
      0: '晴朗',
      1: '基本晴朗',
      2: '部分多云',
      3: '阴天',
      45: '雾',
      48: '雾凇',
      51: '小毛毛雨',
      53: '中毛毛雨',
      55: '大毛毛雨',
      56: '轻度冻毛毛雨',
      57: '重度冻毛毛雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      66: '轻度冻雨',
      67: '重度冻雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '小阵雨',
      81: '中阵雨',
      82: '大阵雨',
      85: '小阵雪',
      86: '大阵雪',
      95: '雷暴',
      96: '雷暴伴小冰雹',
      99: '雷暴伴大冰雹'
    };

    return descriptions[code] || `未知天气(${code})`;
  }
}

// 导出单例实例
export const openMeteoService = new OpenMeteoWeatherService();