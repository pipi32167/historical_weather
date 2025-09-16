/**
 * 气温数据聚合服务
 * 统一处理历史数据和预报数据的获取，解决API边界问题
 */

import { openMeteoService } from './openMeteoWeather';
import { WeatherDataPoint, Location } from '../types/weather';
import { format, isToday, isFuture, startOfDay } from 'date-fns';
import { cache, CACHE_TTL, cacheKeys } from '../utils/cache';

export interface WeatherDataRequest {
  location: Location;
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface WeatherDataResponse {
  data: WeatherDataPoint[];
  metadata: {
    totalPoints: number;
    historicalPoints: number;
    forecastPoints: number;
    source: string[];
  };
}

export class WeatherAggregateService {
  /**
   * 获取日期范围内的气温数据
   * 自动判断使用历史API还是预报API，或者两者结合
   */
  async getWeatherDataRange(request: WeatherDataRequest): Promise<WeatherDataResponse> {
    const { location, startDate, endDate, timezone = 'auto' } = request;
    
    console.log('WeatherAggregateService: 处理请求', {
      location: location.name,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      timezone
    });

    // 分析日期范围，确定数据获取策略
    const dateAnalysis = this.analyzeDateRange(startDate, endDate);
    console.log('日期范围分析:', dateAnalysis);

    const results: WeatherDataPoint[] = [];
    const sources: string[] = [];
    let historicalCount = 0;
    let forecastCount = 0;

    try {
      // 1. 处理历史日期（过去的日期）
      if (dateAnalysis.hasHistorical && dateAnalysis.lastHistoricalDate) {
        const historicalEndDate = dateAnalysis.lastHistoricalDate;
        console.log('获取历史数据:', format(startDate, 'yyyy-MM-dd'), '到', format(historicalEndDate, 'yyyy-MM-dd'));
        
        const historicalData = await this.getHistoricalData(location, startDate, historicalEndDate, timezone);
        results.push(...historicalData);
        historicalCount = historicalData.length;
        sources.push('历史API');
      }

      // 2. 处理当前和未来日期（今天及未来）
      if (dateAnalysis.hasForecast && dateAnalysis.firstForecastDate) {
        const forecastStartDate = dateAnalysis.firstForecastDate;
        console.log('获取预报数据:', format(forecastStartDate, 'yyyy-MM-dd'), '到', format(endDate, 'yyyy-MM-dd'));
        
        const forecastData = await this.getForecastData(location, forecastStartDate, endDate, timezone);
        results.push(...forecastData);
        forecastCount = forecastData.length;
        sources.push('预报API');
      }

      // 3. 按日期排序
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        data: results,
        metadata: {
          totalPoints: results.length,
          historicalPoints: historicalCount,
          forecastPoints: forecastCount,
          source: sources
        }
      };

    } catch (error) {
      console.error('WeatherAggregateService: 获取数据失败', error);
      throw new Error(`获取气温数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取历史同期数据（多年对比）
   * 包含当天的实时数据
   */
  async getHistoricalSamePeriodData(
    location: Location, 
    targetDate: Date, 
    years: number = 20,
    timezone: string = 'auto'
  ): Promise<WeatherDataResponse> {
    // 检查缓存
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const cacheKey = cacheKeys.historicalSamePeriod(location.latitude, location.longitude, dateStr, years);
    const cachedResult = cache.get<WeatherDataResponse>(cacheKey);
    
    if (cachedResult) {
      console.log('从缓存获取历史同期数据:', {
        location: location.name,
        targetDate: dateStr,
        years,
        timezone
      });
      return cachedResult;
    }

    console.log('WeatherAggregateService: 获取历史同期数据', {
      location: location.name,
      targetDate: dateStr,
      years,
      timezone
    });

    const results: WeatherDataPoint[] = [];
    const sources: string[] = [];
    let historicalCount = 0;
    let forecastCount = 0;

    try {
      // 1. 获取历史同期数据（使用日期范围查询）
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      const endYear = currentYear - 1;
      
      const rangeData = await openMeteoService.getHistoricalWeather(
        location.latitude,
        location.longitude,
        `${startYear}-01-01`,
        `${endYear}-12-31`,
        timezone,
        ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']
      );
      
      // 在客户端过滤出目标日期的同期数据
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();
      const historicalData: Array<{ year: number; data: any }> = [];
      
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
      
      // 构建结果
      for (const [yearStr, yearData] of Object.entries(dataByYear)) {
        const year = parseInt(yearStr);
        if (yearData.time.length > 0) {
          historicalData.push({
            year,
            data: {
              ...rangeData,
              daily: {
                time: yearData.time,
                temperature_2m_max: yearData.temperature_2m_max,
                temperature_2m_min: yearData.temperature_2m_min,
                precipitation_sum: yearData.precipitation_sum
              }
            }
          });
        }
      }

      // 转换历史数据
      const transformedHistoricalData = historicalData
        .filter(({ data }) => {
          const maxTemp = data.daily.temperature_2m_max[0];
          const minTemp = data.daily.temperature_2m_min[0];
          return maxTemp !== null && minTemp !== null && !isNaN(maxTemp) && !isNaN(minTemp);
        })
        .map(({ year, data }) => {
          const firstDay = data.daily.time[0];
          const maxTemp = data.daily.temperature_2m_max[0]!;
          const minTemp = data.daily.temperature_2m_min[0]!;
          const avgTemp = (maxTemp + minTemp) / 2;
          const precipitation = data.daily.precipitation_sum?.[0] || 0;

          return {
            timestamp: firstDay,
            date: firstDay,
            temperature: avgTemp,
            temperatureMax: maxTemp,
            temperatureMin: minTemp,
            humidity: 50,
            pressure: 1013.25,
            windSpeed: 0,
            windDirection: 0,
            precipitation: precipitation,
            weatherCondition: `${year}年历史数据`,
            location: location.name,
            latitude: location.latitude,
            longitude: location.longitude
          } as WeatherDataPoint;
        });

      results.push(...transformedHistoricalData);
      historicalCount = transformedHistoricalData.length;
      sources.push('历史API');

      // 2. 如果目标日期是今天或未来，获取今日预报数据
      if (isToday(targetDate) || isFuture(targetDate)) {
        console.log('目标日期是今天或未来，获取今日预报数据');
        
        try {
          const todayForecast = await openMeteoService.getTodayForecast(
            location.latitude,
            location.longitude,
            timezone
          );

          if (todayForecast && todayForecast.current_weather) {
            // 使用今日预报的最高最低温度，如果没有则使用当前温度
            const maxTemp = todayForecast.daily?.temperature_2m_max?.[0] ?? todayForecast.current_weather.temperature;
            const minTemp = todayForecast.daily?.temperature_2m_min?.[0] ?? todayForecast.current_weather.temperature;
            const avgTemp = (maxTemp + minTemp) / 2;
            const precipitation = todayForecast.daily?.precipitation_sum?.[0] ?? 0;
            const windSpeed = todayForecast.daily?.windspeed_10m_max?.[0] ?? todayForecast.current_weather.windspeed;

            const currentWeatherPoint: WeatherDataPoint = {
              timestamp: todayForecast.current_weather.time,
              date: todayForecast.current_weather.time,
              temperature: avgTemp,
              temperatureMax: maxTemp,
              temperatureMin: minTemp,
              humidity: 50,
              pressure: 1013.25,
              windSpeed: windSpeed,
              windDirection: todayForecast.current_weather.winddirection,
              precipitation: precipitation,
              weatherCondition: `今日预报 (${openMeteoService.getWeatherDescription(todayForecast.current_weather.weathercode)})`,
              location: location.name,
              latitude: location.latitude,
              longitude: location.longitude
            };

            results.unshift(currentWeatherPoint); // 添加到数组开头
            forecastCount = 1;
            sources.push('预报API');
          }
        } catch (error) {
          console.warn('获取今日预报数据失败，尝试获取当前气温数据:', error);
          
          // 降级处理：获取当前气温数据
          try {
            const currentWeather = await openMeteoService.getCurrentWeather(
              location.latitude,
              location.longitude,
              timezone
            );

            if (currentWeather && currentWeather.current_weather) {
              const currentWeatherPoint: WeatherDataPoint = {
                timestamp: currentWeather.current_weather.time,
                date: currentWeather.current_weather.time,
                temperature: currentWeather.current_weather.temperature,
                temperatureMax: currentWeather.current_weather.temperature,
                temperatureMin: currentWeather.current_weather.temperature,
                humidity: 50,
                pressure: 1013.25,
                windSpeed: currentWeather.current_weather.windspeed,
                windDirection: currentWeather.current_weather.winddirection,
                precipitation: 0,
                weatherCondition: `当前实况 (${openMeteoService.getWeatherDescription(currentWeather.current_weather.weathercode)})`,
                location: location.name,
                latitude: location.latitude,
                longitude: location.longitude
              };

              results.unshift(currentWeatherPoint);
              forecastCount = 1;
              sources.push('实时API');
            }
          } catch (fallbackError) {
            console.warn('获取当前气温数据也失败，将跳过:', fallbackError);
          }
        }
      }

      // 3. 按年份排序（历史数据从旧到新，今日数据在最前面）
      const sortedResults = results.sort((a, b) => {
        // 今日预报或当前实况数据排在最前
        if (a.weatherCondition.includes('今日预报') || a.weatherCondition.includes('当前实况')) return -1;
        if (b.weatherCondition.includes('今日预报') || b.weatherCondition.includes('当前实况')) return 1;
        
        // 其他数据按年份排序
        return new Date(a.date).getFullYear() - new Date(b.date).getFullYear();
      });

      const result = {
        data: sortedResults,
        metadata: {
          totalPoints: sortedResults.length,
          historicalPoints: historicalCount,
          forecastPoints: forecastCount,
          source: sources
        }
      };
      
      // 缓存结果（历史同期数据相对稳定，可以缓存较长时间）
      cache.set(cacheKey, result, CACHE_TTL.HISTORICAL_DATA);
      
      return result;

    } catch (error) {
      console.error('WeatherAggregateService: 获取历史同期数据失败', error);
      throw new Error(`获取历史同期数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 分析日期范围，确定需要使用的API类型
   */
  private analyzeDateRange(startDate: Date, endDate: Date) {
    const today = startOfDay(new Date());
    const startOfToday = startOfDay(today);
    
    const hasHistorical = startDate < startOfToday;
    const hasForecast = endDate >= startOfToday;
    
    // 最后一个历史日期（昨天）
    const lastHistoricalDate = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    
    // 第一个预报日期（今天）
    const firstForecastDate = startOfToday;

    return {
      hasHistorical,
      hasForecast,
      lastHistoricalDate: hasHistorical ? (endDate < startOfToday ? endDate : lastHistoricalDate) : null,
      firstForecastDate: hasForecast ? (startDate >= startOfToday ? startDate : firstForecastDate) : null
    };
  }

  /**
   * 获取历史数据
   */
  private async getHistoricalData(
    location: Location,
    startDate: Date,
    endDate: Date,
    timezone: string
  ): Promise<WeatherDataPoint[]> {
    const historicalData = await openMeteoService.getHistoricalWeather(
      location.latitude,
      location.longitude,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
      timezone,
      ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum']
    );

    return historicalData.daily.time.map((time, index) => ({
      timestamp: new Date(time).toISOString(),
      date: time,
      temperature: (historicalData.daily.temperature_2m_max[index] + historicalData.daily.temperature_2m_min[index]) / 2,
      temperatureMax: historicalData.daily.temperature_2m_max[index],
      temperatureMin: historicalData.daily.temperature_2m_min[index],
      humidity: 50,
      pressure: 1013.25,
      windSpeed: 0,
      windDirection: 0,
      precipitation: historicalData.daily.precipitation_sum?.[index] || 0,
      weatherCondition: '历史数据',
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }

  /**
   * 获取预报数据（包含今天和未来）
   */
  private async getForecastData(
    location: Location,
    startDate: Date,
    _endDate: Date,
    timezone: string
  ): Promise<WeatherDataPoint[]> {
    
    // 如果开始日期是今天，获取今日预报数据（包含最高最低温度）
    if (isToday(startDate)) {
      try {
        const todayForecast = await openMeteoService.getTodayForecast(
          location.latitude,
          location.longitude,
          timezone
        );

        if (todayForecast && todayForecast.current_weather) {
          // 使用今日预报的最高最低温度，如果没有则使用当前温度
          const maxTemp = todayForecast.daily?.temperature_2m_max?.[0] ?? todayForecast.current_weather.temperature;
          const minTemp = todayForecast.daily?.temperature_2m_min?.[0] ?? todayForecast.current_weather.temperature;
          const avgTemp = (maxTemp + minTemp) / 2;
          const precipitation = todayForecast.daily?.precipitation_sum?.[0] ?? 0;
          const windSpeed = todayForecast.daily?.windspeed_10m_max?.[0] ?? todayForecast.current_weather.windspeed;

          return [{
            timestamp: todayForecast.current_weather.time,
            date: format(new Date(todayForecast.current_weather.time), 'yyyy-MM-dd'),
            temperature: avgTemp,
            temperatureMax: maxTemp,
            temperatureMin: minTemp,
            humidity: 50,
            pressure: 1013.25,
            windSpeed: windSpeed,
            windDirection: todayForecast.current_weather.winddirection,
            precipitation: precipitation,
            weatherCondition: `今日预报 (${openMeteoService.getWeatherDescription(todayForecast.current_weather.weathercode)})`,
            location: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
          }];
        }
      } catch (error) {
        console.warn('获取今日预报数据失败，尝试获取当前气温数据:', error);
        
        // 降级处理：获取当前气温数据
        const forecastData = await openMeteoService.getCurrentWeather(
          location.latitude,
          location.longitude,
          timezone
        );

        if (forecastData && forecastData.current_weather) {
          return [{
            timestamp: forecastData.current_weather.time,
            date: format(new Date(forecastData.current_weather.time), 'yyyy-MM-dd'),
            temperature: forecastData.current_weather.temperature,
            temperatureMax: forecastData.current_weather.temperature,
            temperatureMin: forecastData.current_weather.temperature,
            humidity: 50,
            pressure: 1013.25,
            windSpeed: forecastData.current_weather.windspeed,
            windDirection: forecastData.current_weather.winddirection,
            precipitation: 0,
            weatherCondition: `当前实况 (${openMeteoService.getWeatherDescription(forecastData.current_weather.weathercode)})`,
            location: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
          }];
        }
      }
    }

    return [];
  }
}

// 导出单例实例
export const weatherAggregateService = new WeatherAggregateService();