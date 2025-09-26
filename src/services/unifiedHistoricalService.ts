/**
 * 统一历史数据服务
 * 为所有页面(daily/monthly/quarterly/yearly)提供统一的历史数据获取和缓存
 */

import { openMeteoService } from './openMeteoWeather';
import { Location } from '../types/weather';

interface CachedHistoricalData {
  location: Location;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  data: any;
  timestamp: number;
}

interface TodayForecastData {
  location: Location;
  data: any;
  timestamp: number;
}

class UnifiedHistoricalService {
  private historicalCache = new Map<string, CachedHistoricalData>();
  private forecastCache = new Map<string, TodayForecastData>();
  private historicalCacheTimeout = 60 * 60 * 1000; // 1小时缓存
  private forecastCacheTimeout = 10 * 60 * 1000;   // 10分钟缓存

  /**
   * 生成位置缓存键
   */
  private getLocationKey(location: Location): string {
    return `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isValidCache(timestamp: number, timeout: number): boolean {
    return Date.now() - timestamp < timeout;
  }

  /**
   * 获取统一的历史数据范围
   * 从指定开始年份的1月1日到昨天
   */
  async getUnifiedHistoricalData(
    location: Location,
    startYear: number,
    signal?: AbortSignal
  ): Promise<any> {
    const locationKey = this.getLocationKey(location);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const startDateStr = `${startYear}-01-01`;

    // 检查缓存
    const cached = this.historicalCache.get(locationKey);
    if (cached &&
      cached.startDate === startDateStr &&
      cached.endDate === yesterdayStr &&
      this.isValidCache(cached.timestamp, this.historicalCacheTimeout)) {
      console.log(`✅ 使用历史数据缓存: ${locationKey} (${startDateStr} 到 ${yesterdayStr})`);
      return cached.data;
    }

    // 获取新数据
    console.log(`🔄 获取历史数据: ${location.name} (${startDateStr} 到 ${yesterdayStr})`);

    const historicalData = await openMeteoService.getHistoricalWeather(
      location.latitude,
      location.longitude,
      startDateStr,
      yesterdayStr,
      location.timezone,
      ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean', 'precipitation_sum', 'windspeed_10m_max', 'weather_code']
    );

    // 更新缓存
    this.historicalCache.set(locationKey, {
      location,
      startDate: startDateStr,
      endDate: yesterdayStr,
      data: historicalData,
      timestamp: Date.now()
    });

    console.log(`💾 历史数据已缓存: ${locationKey}, 数据天数: ${historicalData.daily?.time?.length || 0}`);

    return historicalData;
  }

  /**
   * 获取今天的预报数据
   * 仅用于daily页面显示今天的预报
   */
  async getTodayForecast(
    location: Location,
    signal?: AbortSignal
  ): Promise<any | null> {
    const locationKey = this.getLocationKey(location);

    // 检查缓存
    const cached = this.forecastCache.get(locationKey);
    if (cached && this.isValidCache(cached.timestamp, this.forecastCacheTimeout)) {
      console.log(`✅ 使用今日预报缓存: ${locationKey}`);
      return cached.data;
    }

    try {
      console.log(`🔄 获取今日预报: ${location.name}`);

      const forecastData = await openMeteoService.getTodayForecast(
        location.latitude,
        location.longitude,
        location.timezone
      );

      // 更新缓存
      this.forecastCache.set(locationKey, {
        location,
        data: forecastData,
        timestamp: Date.now()
      });

      console.log(`💾 今日预报已缓存: ${locationKey}`);
      return forecastData;

    } catch (error) {
      console.warn(`⚠️ 获取今日预报失败: ${location.name}`, error);
      return null;
    }
  }

  /**
   * 过滤指定日期的历史数据
   * @param historicalData 完整的历史数据
   * @param targetMonth 目标月份 (1-12)
   * @param targetDay 目标日期 (1-31)
   */
  filterByDate(historicalData: any, targetMonth: number, targetDay: number) {
    if (!historicalData?.daily?.time) {
      return [];
    }

    const results: Array<{
      year: number;
      date: string;
      maxTemp: number;
      minTemp: number;
      avgTemp: number;
      precipitation: number;
      windSpeed: number;
      weatherCode: number;
    }> = [];

    historicalData.daily.time.forEach((time: string, index: number) => {
      const date = new Date(time);
      const month = date.getMonth() + 1;
      const day = date.getDate();

      if (month === targetMonth && day === targetDay) {
        const maxTemp = historicalData.daily.temperature_2m_max[index];
        const minTemp = historicalData.daily.temperature_2m_min[index];

        // 验证数据有效性
        if (maxTemp != null && minTemp != null &&
          !isNaN(maxTemp) && !isNaN(minTemp) &&
          maxTemp >= -60 && maxTemp <= 60 &&
          minTemp >= -60 && minTemp <= 60) {

          const windSpeed = historicalData.daily.windspeed_10m_max?.[index] || 0;
          const weatherCode = historicalData.daily.weather_code?.[index] || 0;

          results.push({
            year: date.getFullYear(),
            date: time,
            maxTemp: Math.round(maxTemp * 10) / 10,
            minTemp: Math.round(minTemp * 10) / 10,
            avgTemp: Math.round((maxTemp + minTemp) / 2 * 10) / 10,
            precipitation: Math.round((historicalData.daily.precipitation_sum?.[index] || 0) * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            weatherCode: weatherCode
          });
        }
      }
    });

    return results.sort((a, b) => b.year - a.year);
  }

  /**
   * 过滤指定周的历史数据
   * @param historicalData 完整的历史数据
   * @param weekStart 周开始日期
   * @param weekEnd 周结束日期
   */
  filterByWeek(historicalData: any, weekStart: Date, weekEnd: Date) {
    if (!historicalData?.daily?.time) {
      return [];
    }

    const results: Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
      avgTemp: number;
      precipitation: number;
      windSpeed: number;
      weatherCode: number;
    }> = [];

    const startTime = weekStart.getTime();
    const endTime = weekEnd.getTime();

    historicalData.daily.time.forEach((time: string, index: number) => {
      const date = new Date(time);
      const dateTime = date.getTime();

      if (dateTime >= startTime && dateTime <= endTime) {
        const maxTemp = historicalData.daily.temperature_2m_max[index];
        const minTemp = historicalData.daily.temperature_2m_min[index];

        // 验证数据有效性
        if (maxTemp != null && minTemp != null &&
          !isNaN(maxTemp) && !isNaN(minTemp) &&
          maxTemp >= -60 && maxTemp <= 60 &&
          minTemp >= -60 && minTemp <= 60) {

          const windSpeed = historicalData.daily.windspeed_10m_max?.[index] || 0;
          const weatherCode = historicalData.daily.weather_code?.[index] || 0;

          results.push({
            date: time,
            maxTemp: Math.round(maxTemp * 10) / 10,
            minTemp: Math.round(minTemp * 10) / 10,
            avgTemp: Math.round((maxTemp + minTemp) / 2 * 10) / 10,
            precipitation: Math.round((historicalData.daily.precipitation_sum?.[index] || 0) * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            weatherCode: weatherCode
          });
        }
      }
    });

    return results;
  }

  /**
   * 过滤指定月份的历史数据
   * @param historicalData 完整的历史数据
   * @param targetMonth 目标月份 (1-12)
   */
  filterByMonth(historicalData: any, targetMonth: number) {
    if (!historicalData?.daily?.time) {
      return {};
    }

    const dataByYear: Record<number, Array<{
      date: string;
      maxTemp: number;
      minTemp: number;
      avgTemp: number;
      precipitation: number;
      windSpeed: number;
      weatherCode: number;
    }>> = {};

    historicalData.daily.time.forEach((time: string, index: number) => {
      const date = new Date(time);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month === targetMonth) {
        const maxTemp = historicalData.daily.temperature_2m_max[index];
        const minTemp = historicalData.daily.temperature_2m_min[index];

        // 验证数据有效性
        if (maxTemp != null && minTemp != null &&
          !isNaN(maxTemp) && !isNaN(minTemp)) {

          if (!dataByYear[year]) {
            dataByYear[year] = [];
          }

          const windSpeed = historicalData.daily.windspeed_10m_max?.[index] || 0;
          const weatherCode = historicalData.daily.weather_code?.[index] || 0;

          dataByYear[year].push({
            date: time,
            maxTemp: Math.round(maxTemp * 10) / 10,
            minTemp: Math.round(minTemp * 10) / 10,
            avgTemp: Math.round((maxTemp + minTemp) / 2 * 10) / 10,
            precipitation: Math.round((historicalData.daily.precipitation_sum?.[index] || 0) * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            weatherCode: weatherCode
          });
        }
      }
    });

    return dataByYear;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.historicalCache.clear();
    this.forecastCache.clear();
    console.log('🗑️ 历史数据和预报缓存已清除');
  }

  /**
   * 获取月度温度趋势数据
   * 使用统一的历史数据来计算月度统计
   */
  async getMonthlyTemperatureTrends(
    location: Location,
    targetMonth: number,
    startYear: number,
    endYear: number
  ) {
    console.log(`📊 获取月度温度趋势: ${location.name} ${targetMonth}月 (${startYear}-${endYear})`);

    // 获取统一的历史数据
    const historicalData = await this.getUnifiedHistoricalData(location, startYear);

    // 过滤指定月份的数据并按年份分组
    const monthlyDataByYear = this.filterByMonth(historicalData, targetMonth);

    const results = [];

    for (let year = startYear; year <= endYear; year++) {
      const yearData = monthlyDataByYear[year];

      if (yearData && yearData.length > 0) {
        const avgTemp = yearData.reduce((sum, d) => sum + d.avgTemp, 0) / yearData.length;
        const avgMaxTemp = yearData.reduce((sum, d) => sum + d.maxTemp, 0) / yearData.length;
        const avgMinTemp = yearData.reduce((sum, d) => sum + d.minTemp, 0) / yearData.length;
        const recordHigh = Math.max(...yearData.map(d => d.maxTemp));
        const recordLow = Math.min(...yearData.map(d => d.minTemp));

        results.push({
          year,
          month: targetMonth,
          avgTemp: Math.round(avgTemp * 10) / 10,
          avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
          avgMinTemp: Math.round(avgMinTemp * 10) / 10,
          recordHigh: Math.round(recordHigh * 10) / 10,
          recordLow: Math.round(recordLow * 10) / 10,
          totalDays: new Date(year, targetMonth, 0).getDate(),
          dataPoints: yearData.length,
          location: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    }

    // 计算趋势
    const averageTemp = results.length > 0 ?
      results.reduce((sum, r) => sum + r.avgTemp, 0) / results.length : 0;

    let trend: 'warming' | 'cooling' | 'stable' = 'stable';
    let trendValue = 0;

    if (results.length >= 2) {
      const firstYearTemp = results[0].avgTemp;
      const lastYearTemp = results[results.length - 1].avgTemp;
      trendValue = (lastYearTemp - firstYearTemp) / results.length;

      if (Math.abs(trendValue) > 0.05) {
        trend = trendValue > 0 ? 'warming' : 'cooling';
      }
    }

    return {
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      month: targetMonth,
      years: results,
      averageTemp: Math.round(averageTemp * 10) / 10,
      trend,
      trendValue: Math.round(trendValue * 1000) / 1000
    };
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      historicalCacheSize: this.historicalCache.size,
      forecastCacheSize: this.forecastCache.size,
      historicalEntries: Array.from(this.historicalCache.keys()),
      forecastEntries: Array.from(this.forecastCache.keys())
    };
  }
}

// 导出单例实例
export const unifiedHistoricalService = new UnifiedHistoricalService();