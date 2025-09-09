import { WeatherDataPoint, Location } from '../types/weather';
import { format, subDays } from 'date-fns';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';
const ARCHIVE_BASE_URL = 'https://archive-api.open-meteo.com/v1';

interface OpenMeteoCurrentResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
}

interface OpenMeteoHistoricalResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
  hourly?: {
    time: string[];
    relative_humidity_2m: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

interface GeocodingResponse {
  results: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    feature_code?: string;
    country_code?: string;
    admin1_id?: number;
    admin2_id?: number;
    timezone?: string;
    population?: number;
    country_id?: number;
    country?: string;
    admin1?: string;
    admin2?: string;
  }>;
  generationtime_ms: number;
}

// Weather code mapping from Open-Meteo to Chinese descriptions
const weatherCodeMap: { [key: number]: string } = {
  0: '晴朗',
  1: '基本晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '霜雾',
  51: '小雨',
  53: '中雨',
  55: '大雨',
  56: '冻雨',
  57: '大冻雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '大冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '中阵雨',
  82: '大阵雨',
  85: '阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴冰雹',
  99: '大雷暴伴冰雹'
};

export class WeatherService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private isValidCache(cacheItem: { data: any; timestamp: number }): boolean {
    return Date.now() - cacheItem.timestamp < this.cacheTimeout;
  }

  private async fetchWithCache<T>(url: string, cacheKey: string, signal?: AbortSignal): Promise<T> {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      return cached.data;
    }

    try {
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HistoricalWeatherApp/1.0'
        }
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // 区分不同类型的HTTP错误
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${response.status}`);
        } else if (response.status >= 400) {
          throw new Error(`Client error: ${response.status} - ${response.statusText}`);
        }
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 验证数据格式
      if (data === null || data === undefined) {
        throw new Error('Received null or undefined data from API');
      }
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // 不要记录被取消的请求
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // 增强网络错误处理
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error(`Network error: Unable to connect to ${url}. Please check your internet connection.`);
        console.error('Network fetch error:', error);
        throw networkError;
      }
      
      console.error(`Failed to fetch weather data from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: Location, signal?: AbortSignal): Promise<WeatherDataPoint> {
    // 验证输入参数
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error('Invalid location data provided');
    }
    
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code',
      timezone: 'auto'
    });

    const url = `${OPEN_METEO_BASE_URL}/forecast?${params}`;
    const cacheKey = this.getCacheKey('current', { lat: location.latitude, lon: location.longitude });
    
    const data: OpenMeteoCurrentResponse = await this.fetchWithCache(url, cacheKey, signal);
    
    // 验证响应数据
    if (!data.current) {
      throw new Error('Invalid response: missing current weather data');
    }

    return {
      timestamp: data.current.time,
      date: format(new Date(data.current.time), 'yyyy-MM-dd'),
      temperature: data.current.temperature_2m,
      temperatureMax: data.current.temperature_2m, // Same as current for current weather
      temperatureMin: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      pressure: data.current.surface_pressure,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: 0, // Not available in current weather
      weatherCondition: weatherCodeMap[data.current.weather_code] || '未知',
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  /**
   * Get recent weather data using forecast API with past_days parameter
   */
  private async getRecentWeather(
    location: Location,
    startDate: Date,
    endDate: Date,
    signal?: AbortSignal
  ): Promise<WeatherDataPoint[]> {
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Forecast API支持最多92天的历史数据
    const maxPastDays = Math.min(daysDiff, 92);
    
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      past_days: maxPastDays.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code',
      hourly: 'relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m',
      timezone: 'auto'
    });

    const url = `${OPEN_METEO_BASE_URL}/forecast?${params}`;
    const cacheKey = this.getCacheKey('recent', {
      lat: location.latitude,
      lon: location.longitude,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });

    const data: OpenMeteoHistoricalResponse = await this.fetchWithCache(url, cacheKey, signal);
    
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('Invalid response: missing daily weather data');
    }

    // Filter data to the requested date range
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    return data.daily.time
      .map((time, index) => {
        if (time < startDateStr || time > endDateStr) {
          return null;
        }
        
        let avgHumidity = 50;
        let avgPressure = 1013;
        let avgWindSpeed = 0;
        let avgWindDirection = 0;

        if (data.hourly) {
          const dateHourlyData = this.getHourlyDataForDate(data.hourly, time);
          if (dateHourlyData.length > 0) {
            avgHumidity = this.calculateAverage(dateHourlyData.map(h => h.humidity));
            avgPressure = this.calculateAverage(dateHourlyData.map(h => h.pressure));
            avgWindSpeed = this.calculateAverage(dateHourlyData.map(h => h.windSpeed));
            avgWindDirection = this.calculateCircularAverage(dateHourlyData.map(h => h.windDirection));
          }
        }

        return {
          timestamp: new Date(time).toISOString(),
          date: time,
          temperature: data.daily.temperature_2m_mean[index] || 0,
          temperatureMax: data.daily.temperature_2m_max[index] || 0,
          temperatureMin: data.daily.temperature_2m_min[index] || 0,
          humidity: Math.round(avgHumidity),
          pressure: Math.round(avgPressure * 10) / 10,
          windSpeed: Math.round(avgWindSpeed * 10) / 10,
          windDirection: Math.round(avgWindDirection),
          precipitation: data.daily.precipitation_sum[index] || 0,
          weatherCondition: weatherCodeMap[data.daily.weather_code[index]] || '未知',
          location: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      })
      .filter((point): point is WeatherDataPoint => point !== null);
  }

  /**
   * Get historical weather data for a location within a date range
   */
  async getHistoricalWeather(
    location: Location, 
    startDate: Date, 
    endDate: Date,
    signal?: AbortSignal
  ): Promise<WeatherDataPoint[]> {
    // 验证输入参数
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error('Invalid location data provided');
    }
    
    if (!startDate || !endDate || startDate > endDate) {
      throw new Error('Invalid date range provided');
    }
    
    // 确保不请求未来日期
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (startDate > today) {
      throw new Error('Cannot request future dates');
    }
    
    // 如果结束日期是未来，调整为今天
    const effectiveEndDate = endDate > today ? new Date(today) : endDate;
    
    // 检查日期范围是否合理（不超过100天）
    const daysDiff = Math.abs(effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 100) {
      throw new Error('Date range too large (max 100 days)');
    }
    
    // 智能选择API：如果是最近92天内的数据，使用 forecast API；否则使用 archive API
    const daysFromToday = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysFromToday <= 92) {
      // 使用 forecast API 获取最近的数据
      return this.getRecentWeather(location, startDate, effectiveEndDate, signal);
    }
    
    // 使用 archive API 获取较老的历史数据
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(effectiveEndDate, 'yyyy-MM-dd'),
      daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code',
      hourly: 'relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m',
      timezone: 'auto'
    });

    const url = `${ARCHIVE_BASE_URL}/archive?${params}`;
    const cacheKey = this.getCacheKey('historical', { 
      lat: location.latitude, 
      lon: location.longitude, 
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(effectiveEndDate, 'yyyy-MM-dd')
    });

    const data: OpenMeteoHistoricalResponse = await this.fetchWithCache(url, cacheKey, signal);
    
    // 验证响应数据
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('Invalid response: missing daily weather data');
    }

    // Process the data: combine daily and hourly data
    return data.daily.time.map((time, index) => {
      // Calculate daily averages from hourly data if available
      let avgHumidity = 50; // Default fallback
      let avgPressure = 1013; // Default fallback
      let avgWindSpeed = 0; // Default fallback
      let avgWindDirection = 0; // Default fallback

      if (data.hourly) {
        // Find hourly data for this date
        const dateHourlyData = this.getHourlyDataForDate(data.hourly, time);
        if (dateHourlyData.length > 0) {
          avgHumidity = this.calculateAverage(dateHourlyData.map(h => h.humidity));
          avgPressure = this.calculateAverage(dateHourlyData.map(h => h.pressure));
          avgWindSpeed = this.calculateAverage(dateHourlyData.map(h => h.windSpeed));
          avgWindDirection = this.calculateCircularAverage(dateHourlyData.map(h => h.windDirection));
        }
      }

      return {
        timestamp: new Date(time).toISOString(),
        date: time,
        temperature: data.daily.temperature_2m_mean[index] || 0,
        temperatureMax: data.daily.temperature_2m_max[index] || 0,
        temperatureMin: data.daily.temperature_2m_min[index] || 0,
        humidity: Math.round(avgHumidity),
        pressure: Math.round(avgPressure * 10) / 10,
        windSpeed: Math.round(avgWindSpeed * 10) / 10,
        windDirection: Math.round(avgWindDirection),
        precipitation: data.daily.precipitation_sum[index] || 0,
        weatherCondition: weatherCodeMap[data.daily.weather_code[index]] || '未知',
        location: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    });
  }

  /**
   * Extract hourly data for a specific date
   */
  private getHourlyDataForDate(hourly: NonNullable<OpenMeteoHistoricalResponse['hourly']>, targetDate: string) {
    const hourlyData: Array<{humidity: number, pressure: number, windSpeed: number, windDirection: number}> = [];
    
    hourly.time.forEach((time, index) => {
      if (time.startsWith(targetDate)) {
        hourlyData.push({
          humidity: hourly.relative_humidity_2m[index] || 50,
          pressure: hourly.surface_pressure[index] || 1013,
          windSpeed: hourly.wind_speed_10m[index] || 0,
          windDirection: hourly.wind_direction_10m[index] || 0,
        });
      }
    });
    
    return hourlyData;
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const validValues = values.filter(v => v != null && !isNaN(v));
    if (validValues.length === 0) return 0;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  /**
   * Calculate circular average for wind direction
   */
  private calculateCircularAverage(directions: number[]): number {
    if (directions.length === 0) return 0;
    const validDirections = directions.filter(d => d != null && !isNaN(d));
    if (validDirections.length === 0) return 0;

    let x = 0, y = 0;
    validDirections.forEach(dir => {
      const rad = (dir * Math.PI) / 180;
      x += Math.cos(rad);
      y += Math.sin(rad);
    });
    
    const avgRad = Math.atan2(y / validDirections.length, x / validDirections.length);
    let avgDeg = (avgRad * 180) / Math.PI;
    if (avgDeg < 0) avgDeg += 360;
    
    return avgDeg;
  }

  /**
   * Get historical data for the same date over multiple years using optimized range queries
   */
  async getSameDateHistoricalData(
    location: Location, 
    targetDate: Date = new Date(), 
    years: number = 20,
    signal?: AbortSignal
  ): Promise<WeatherDataPoint[]> {
    // 验证输入参数
    if (!location) {
      throw new Error('Location is required');
    }
    
    if (years <= 0 || years > 50) {
      throw new Error('Years must be between 1 and 50');
    }
    
    const currentYear = targetDate.getFullYear();
    const today = new Date();
    const results: WeatherDataPoint[] = [];
    
    // 构建需要获取的日期列表，按API类型分组
    const recentDates: Date[] = []; // 使用 forecast API (最近92天)
    const archiveDates: Date[] = []; // 使用 archive API (更早的日期)
    
    for (let j = 0; j < years; j++) {
      const historicalYear = currentYear - j;
      
      // 跳过太远的历史数据（超过50年）
      if (currentYear - historicalYear > 50) {
        continue;
      }
      
      const historicalDate = new Date(historicalYear, targetDate.getMonth(), targetDate.getDate());
      
      // 如果历史日期晚于今天，跳过这个年份
      if (historicalDate > today) {
        continue;
      }
      
      // 判断使用哪个API
      const daysFromToday = Math.ceil((today.getTime() - historicalDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysFromToday <= 92) {
        recentDates.push(historicalDate);
      } else {
        archiveDates.push(historicalDate);
      }
    }
    
    // 处理最近的日期（使用 forecast API）
    if (recentDates.length > 0) {
      try {
        const oldestRecentDate = recentDates[recentDates.length - 1];
        const newestRecentDate = recentDates[0];
        
        const recentData = await this.getRecentWeather(
          location, 
          oldestRecentDate, 
          newestRecentDate, 
          signal
        );
        
        // 筛选出目标日期的数据
        const targetDates = recentDates.map(d => format(d, 'yyyy-MM-dd'));
        const filteredRecentData = recentData.filter(d => targetDates.includes(d.date));
        results.push(...filteredRecentData);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        console.warn('Failed to get recent weather data:', error);
      }
    }
    
    // 处理历史日期（使用 archive API）- 优化为更少的API调用
    if (archiveDates.length > 0) {
      // 尝试使用连续年份范围来最小化API调用
      const sortedArchiveDates = archiveDates.sort((a, b) => b.getTime() - a.getTime()); // 按时间降序排列
      const batchSize = 5; // 每次最多处理5年的数据
      
      const batches: Promise<WeatherDataPoint[]>[] = [];
      
      for (let i = 0; i < sortedArchiveDates.length; i += batchSize) {
        const batchDates = sortedArchiveDates.slice(i, i + batchSize);
        
        batches.push((async () => {
          try {
            // 计算这一批日期的范围
            const oldestDate = batchDates[batchDates.length - 1];
            const newestDate = batchDates[0];
            
            // 扩展范围以确保包含目标日期
            const startDate = subDays(oldestDate, 1);
            const endDate = new Date(newestDate.getTime() + 2 * 24 * 60 * 60 * 1000);
            
            // 检查日期范围是否合理（不超过100天）
            const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 100) {
              // 单次API调用获取整个范围的数据
              const batchData = await this.getHistoricalWeather(location, startDate, endDate, signal);
              
              // 筛选出目标日期的数据
              const targetDateStrs = batchDates.map(d => format(d, 'yyyy-MM-dd'));
              return batchData.filter(d => targetDateStrs.includes(d.date));
            } else {
              // 如果范围太大，按年份单独处理
              const yearPromises = batchDates.map(async (date) => {
                const year = date.getFullYear();
                try {
                  const yearStartDate = subDays(date, 1);
                  const yearEndDate = new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000);
                  
                  const yearData = await this.getHistoricalWeather(location, yearStartDate, yearEndDate, signal);
                  const targetDateStr = format(date, 'yyyy-MM-dd');
                  return yearData.filter(d => d.date === targetDateStr);
                } catch (error) {
                  if (error instanceof Error && error.name === 'AbortError') {
                    throw error;
                  }
                  console.warn(`Failed to get data for year ${year}:`, error);
                  return [];
                }
              });
              
              const yearResults = await Promise.all(yearPromises);
              return yearResults.reduce((acc, batch) => acc.concat(batch), []);
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw error;
            }
            console.warn('Failed to get batch archive data:', error);
            return [];
          }
        })());
      }
      
      try {
        const batchResults = await Promise.all(batches);
        const flattenedResults = batchResults.reduce((acc, batch) => acc.concat(batch), []);
        results.push(...flattenedResults);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        console.warn('Some archive API requests failed:', error);
      }
    }
    
    // Sort by year (newest first) and return
    return results.sort((a: WeatherDataPoint, b: WeatherDataPoint) => 
      new Date(b.date).getFullYear() - new Date(a.date).getFullYear()
    );
  }

  /**
   * Search for locations by name
   */
  async searchLocations(query: string, signal?: AbortSignal): Promise<Location[]> {
    // 验证输入
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }
    
    // 限制查询长度
    if (query.length > 100) {
      throw new Error('Query too long (max 100 characters)');
    }
    
    const params = new URLSearchParams({
      name: query.trim(),
      count: '10',
      language: 'zh,en',
      format: 'json'
    });

    const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;
    const cacheKey = this.getCacheKey('search', { query: query.trim() });

    console.log('Searching locations with URL:', url);

    try {
      const data = await this.fetchWithCache<GeocodingResponse>(url, cacheKey, signal);
      
      if (!data.results) {
        return [];
      }

      return data.results.map((result, index) => ({
        id: `${result.id || index}`,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        country: result.country || result.country_code || 'Unknown',
        timezone: result.timezone || 'UTC',
        admin1: result.admin1,
        admin2: result.admin2,
      }));
    } catch (error) {
      console.error('Failed to search locations:', error);
      console.error('Query was:', query);
      console.error('URL was:', url);
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
      }
      return [];
    }
  }
}

// Create singleton instance
export const weatherService = new WeatherService();