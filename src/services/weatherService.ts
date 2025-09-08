import { WeatherDataPoint, Location } from '../types/weather';
import { format, subDays, subYears, parse } from 'date-fns';

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
    relative_humidity_2m: number[];
    surface_pressure: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
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

  private async fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached)) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Failed to fetch weather data from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: Location): Promise<WeatherDataPoint> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code',
      timezone: 'auto'
    });

    const url = `${OPEN_METEO_BASE_URL}/forecast?${params}`;
    const cacheKey = this.getCacheKey('current', { lat: location.latitude, lon: location.longitude });
    
    const data: OpenMeteoCurrentResponse = await this.fetchWithCache(url, cacheKey);

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
   * Get historical weather data for a location within a date range
   */
  async getHistoricalWeather(
    location: Location, 
    startDate: Date, 
    endDate: Date
  ): Promise<WeatherDataPoint[]> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m,surface_pressure,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum,weather_code',
      timezone: 'auto'
    });

    const url = `${ARCHIVE_BASE_URL}/archive?${params}`;
    const cacheKey = this.getCacheKey('historical', { 
      lat: location.latitude, 
      lon: location.longitude, 
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    });

    const data: OpenMeteoHistoricalResponse = await this.fetchWithCache(url, cacheKey);

    return data.daily.time.map((time, index) => ({
      timestamp: new Date(time).toISOString(),
      date: time,
      temperature: data.daily.temperature_2m_mean[index] || 0,
      temperatureMax: data.daily.temperature_2m_max[index] || 0,
      temperatureMin: data.daily.temperature_2m_min[index] || 0,
      humidity: data.daily.relative_humidity_2m[index] || 0,
      pressure: data.daily.surface_pressure[index] || 0,
      windSpeed: data.daily.wind_speed_10m_max[index] || 0,
      windDirection: data.daily.wind_direction_10m_dominant[index] || 0,
      precipitation: data.daily.precipitation_sum[index] || 0,
      weatherCondition: weatherCodeMap[data.daily.weather_code[index]] || '未知',
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }

  /**
   * Get historical data for the same date over multiple years
   */
  async getSameDateHistoricalData(
    location: Location, 
    targetDate: Date = new Date(), 
    years: number = 20
  ): Promise<WeatherDataPoint[]> {
    const historicalData: WeatherDataPoint[] = [];
    const currentYear = targetDate.getFullYear();
    
    // Split into batches to avoid overwhelming the API
    const batchSize = 5;
    const batches: Promise<WeatherDataPoint[]>[] = [];

    for (let i = 0; i < years; i += batchSize) {
      const batch = async () => {
        const batchPromises: Promise<WeatherDataPoint[]>[] = [];
        
        for (let j = i; j < Math.min(i + batchSize, years); j++) {
          const historicalYear = currentYear - j;
          const historicalDate = new Date(historicalYear, targetDate.getMonth(), targetDate.getDate());
          
          // Get data for a small range around the target date to ensure we get the exact date
          const startDate = subDays(historicalDate, 1);
          const endDate = new Date(historicalDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
          
          batchPromises.push(
            this.getHistoricalWeather(location, startDate, endDate)
              .then(data => data.filter(d => d.date === format(historicalDate, 'yyyy-MM-dd')))
              .catch(error => {
                console.warn(`Failed to get data for year ${historicalYear}:`, error);
                return [];
              })
          );
        }
        
        const results = await Promise.all(batchPromises);
        return results.flat();
      };

      batches.push(batch());
    }

    try {
      const allResults = await Promise.all(batches);
      const flatResults = allResults.flat();
      
      // Sort by year (newest first) and return
      return flatResults.sort((a, b) => new Date(b.date).getFullYear() - new Date(a.date).getFullYear());
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      throw error;
    }
  }

  /**
   * Search for locations by name
   */
  async searchLocations(query: string): Promise<Location[]> {
    const params = new URLSearchParams({
      name: query,
      count: '10',
      language: 'zh,en',
      format: 'json'
    });

    const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;
    const cacheKey = this.getCacheKey('search', { query });

    try {
      const data = await this.fetchWithCache<any>(url, cacheKey);
      
      if (!data.results) {
        return [];
      }

      return data.results.map((result: any, index: number) => ({
        id: `${result.id || index}`,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        country: result.country || result.country_code,
        timezone: result.timezone || 'UTC',
        admin1: result.admin1,
        admin2: result.admin2,
      }));
    } catch (error) {
      console.error('Failed to search locations:', error);
      return [];
    }
  }
}

// Create singleton instance
export const weatherService = new WeatherService();