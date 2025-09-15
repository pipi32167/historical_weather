/**
 * 月平均温度服务
 * 基于Open-Meteo API实现月度温度数据聚合和分析
 */

import { openMeteoService } from './openMeteoWeather';
import { cache, CACHE_TTL } from '../utils/cache';
import { executeWithRetry } from '../utils/concurrencyController';
import { getYear, getMonth, getDaysInMonth } from 'date-fns';

export interface MonthlyTemperatureStats {
  year: number;
  month: number; // 1-12
  monthName: string;
  avgTemp: number;
  avgMaxTemp: number;
  avgMinTemp: number;
  recordHigh: number;
  recordLow: number;
  totalDays: number;
  dataPoints: number;
  location: string;
  latitude: number;
  longitude: number;
}

export interface MonthlyTemperatureTrends {
  location: string;
  latitude: number;
  longitude: number;
  month: number;
  monthName: string;
  years: MonthlyTemperatureStats[];
  averageTemp: number;
  trend: 'warming' | 'cooling' | 'stable';
  trendValue: number; // 度/年
}

/**
 * 月度温度数据聚合器
 */
class MonthlyTemperatureAggregator {
  /**
   * 计算数组平均值
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 从每日数据计算月度统计
   */
  static calculateMonthlyStats(
    dailyData: Array<{
      date: string;
      temperature: number;
      temperatureMax: number;
      temperatureMin: number;
    }>,
    location: string,
    latitude: number,
    longitude: number
  ): MonthlyTemperatureStats | null {
    if (dailyData.length === 0) return null;

    const firstDate = new Date(dailyData[0].date);
    const year = getYear(firstDate);
    const month = getMonth(firstDate) + 1; // getMonth返回0-11，我们需要1-12

    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    const validData = dailyData.filter(d => 
      !isNaN(d.temperature) && 
      !isNaN(d.temperatureMax) && 
      !isNaN(d.temperatureMin)
    );

    if (validData.length === 0) return null;

    const avgTemp = this.mean(validData.map(d => d.temperature));
    const avgMaxTemp = this.mean(validData.map(d => d.temperatureMax));
    const avgMinTemp = this.mean(validData.map(d => d.temperatureMin));
    const recordHigh = Math.max(...validData.map(d => d.temperatureMax));
    const recordLow = Math.min(...validData.map(d => d.temperatureMin));

    return {
      year,
      month,
      monthName: monthNames[month - 1],
      avgTemp: Math.round(avgTemp * 10) / 10,
      avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
      avgMinTemp: Math.round(avgMinTemp * 10) / 10,
      recordHigh: Math.round(recordHigh * 10) / 10,
      recordLow: Math.round(recordLow * 10) / 10,
      totalDays: getDaysInMonth(firstDate),
      dataPoints: validData.length,
      location,
      latitude,
      longitude
    };
  }

  /**
   * 计算温度趋势
   */
  static calculateTrend(yearlyData: MonthlyTemperatureStats[]): { trend: 'warming' | 'cooling' | 'stable'; trendValue: number } {
    if (yearlyData.length < 2) {
      return { trend: 'stable', trendValue: 0 };
    }

    // 线性回归计算温度趋势
    const n = yearlyData.length;
    const years = yearlyData.map(d => d.year);
    const temps = yearlyData.map(d => d.avgTemp);

    const sumX = years.reduce((sum, year) => sum + year, 0);
    const sumY = temps.reduce((sum, temp) => sum + temp, 0);
    const sumXY = years.reduce((sum, year, i) => sum + year * temps[i], 0);
    const sumXX = years.reduce((sum, year) => sum + year * year, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendValue = Math.round(slope * 1000) / 1000; // 保留3位小数

    let trend: 'warming' | 'cooling' | 'stable';
    if (Math.abs(trendValue) < 0.01) {
      trend = 'stable';
    } else if (trendValue > 0) {
      trend = 'warming';
    } else {
      trend = 'cooling';
    }

    return { trend, trendValue };
  }
}

/**
 * 月平均温度服务类
 */
export class MonthlyTemperatureService {
  /**
   * 生成缓存键
   */
  private getCacheKey(type: string, lat: number, lon: number, year: number, month: number): string {
    return `monthly_${type}_${lat.toFixed(4)}_${lon.toFixed(4)}_${year}_${month}`;
  }

  // 注意：getMonthlyTemperatureStats 方法已被移除
  // 现在使用更高效的日期范围查询来一次性获取多年数据

  /**
   * 获取指定月份多年的温度趋势（优化版本 - 使用日期范围查询）
   */
  async getMonthlyTemperatureTrends(
    latitude: number,
    longitude: number,
    month: number,
    startYear: number,
    endYear: number,
    location: string = '未知位置',
    timezone: string = 'auto'
  ): Promise<MonthlyTemperatureTrends | null> {
    // 检查缓存
    const cacheKey = `monthly_trends_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${month}_${startYear}_${endYear}`;
    const cachedResult = cache.get<MonthlyTemperatureTrends>(cacheKey);
    
    if (cachedResult) {
      console.log('从缓存获取月度温度趋势:', { month, startYear, endYear, location });
      return cachedResult;
    }

    try {
      console.log('计算月度温度趋势（日期范围查询）:', { location, month, startYear, endYear });

      // 一次性获取整个日期范围的数据
      const startDate = `${startYear}-01-01`;
      
      // 特殊处理：如果是当前年份的当前月份，只获取到今天
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const isCurrentYearCurrentMonth = endYear === currentYear && month === currentMonth;
      
      let endDate;
      if (isCurrentYearCurrentMonth) {
        // 当前年份当前月份，获取到今天
        endDate = new Date().toISOString().split('T')[0];
        console.log(`[MonthlyTemperatureService] 当前年份当前月份，获取到今天: ${endDate}`);
      } else {
        // 其他情况，获取整年数据
        endDate = `${endYear}-12-31`;
      }

      console.log(`[MonthlyTemperatureService] 获取日期范围数据: ${startDate} 到 ${endDate}`);

      const historicalData = await executeWithRetry(
        () => openMeteoService.getHistoricalWeather(
          latitude,
          longitude,
          startDate,
          endDate,
          timezone,
          ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean']
        ),
        3,
        1000
      );

      // 按年份和月份分组数据
      const yearlyStats: MonthlyTemperatureStats[] = [];
      const dataByYear: Record<number, Array<{
        date: string;
        temperature: number;
        temperatureMax: number;
        temperatureMin: number;
      }>> = {};

      // 过滤出指定月份的数据并按年份分组
      historicalData.daily.time.forEach((time, index) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const monthNum = date.getMonth() + 1; // 0-11 -> 1-12

        // 只处理指定月份的数据
        if (monthNum === month) {
          if (!dataByYear[year]) {
            dataByYear[year] = [];
          }

          const maxTemp = historicalData.daily.temperature_2m_max[index];
          const minTemp = historicalData.daily.temperature_2m_min[index];
          const meanTemp = historicalData.daily.temperature_2m_mean?.[index] || (maxTemp + minTemp) / 2;

          // 验证数据有效性
          if (!isNaN(maxTemp) && !isNaN(minTemp) && !isNaN(meanTemp)) {
            dataByYear[year].push({
              date: time,
              temperature: meanTemp,
              temperatureMax: maxTemp,
              temperatureMin: minTemp
            });
          }
        }
      });

      // 为每年计算月度统计
      for (const [yearStr, yearData] of Object.entries(dataByYear)) {
        const year = parseInt(yearStr);
        
        if (yearData.length > 0) {
          const monthlyStats = MonthlyTemperatureAggregator.calculateMonthlyStats(
            yearData,
            location,
            latitude,
            longitude
          );

          if (monthlyStats) {
            // 确保年份正确
            monthlyStats.year = year;
            monthlyStats.month = month;
            yearlyStats.push(monthlyStats);
          }
        }
      }

      console.log(`[MonthlyTemperatureService] 成功处理 ${yearlyStats.length} 年的${month}月数据`);

      if (yearlyStats.length === 0) {
        return null;
      }

      // 计算趋势
      const { trend, trendValue } = MonthlyTemperatureAggregator.calculateTrend(yearlyStats);
      const averageTemp = MonthlyTemperatureAggregator.mean(yearlyStats.map(d => d.avgTemp));

      const monthNames = [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
      ];

      const trendsData: MonthlyTemperatureTrends = {
        location,
        latitude,
        longitude,
        month,
        monthName: monthNames[month - 1],
        years: yearlyStats.sort((a, b) => a.year - b.year),
        averageTemp: Math.round(averageTemp * 10) / 10,
        trend,
        trendValue
      };

      // 缓存结果
      cache.set(cacheKey, trendsData, CACHE_TTL.HISTORICAL_DATA);

      return trendsData;
    } catch (error) {
      console.error('获取月度温度趋势失败:', error);
      return null;
    }
  }

  /**
   * 获取指定位置全年各月的平均温度（基于多年数据）- 优化版本
   */
  async getAnnualTemperatureProfile(
    latitude: number,
    longitude: number,
    startYear: number,
    endYear: number,
    location: string = '未知位置',
    timezone: string = 'auto'
  ): Promise<MonthlyTemperatureStats[]> {
    const cacheKey = `annual_profile_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${startYear}_${endYear}`;
    const cachedResult = cache.get<MonthlyTemperatureStats[]>(cacheKey);
    
    if (cachedResult) {
      console.log('从缓存获取年度温度概况:', { startYear, endYear, location });
      return cachedResult;
    }

    try {
      console.log('计算年度温度概况（日期范围查询）:', { location, startYear, endYear });

      // 一次性获取整个日期范围的数据
      const startDate = `${startYear}-01-01`;
      const endDate = `${endYear}-12-31`;

      console.log(`[MonthlyTemperatureService] 获取年度概况数据: ${startDate} 到 ${endDate}`);

      const historicalData = await executeWithRetry(
        () => openMeteoService.getHistoricalWeather(
          latitude,
          longitude,
          startDate,
          endDate,
          timezone,
          ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean']
        ),
        3,
        1000
      );

      // 按年份和月份分组数据
      const dataByYearMonth: Record<string, Array<{
        date: string;
        temperature: number;
        temperatureMax: number;
        temperatureMin: number;
      }>> = {};

      // 分组数据
      historicalData.daily.time.forEach((time, index) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 0-11 -> 1-12
        const key = `${year}-${month}`;

        if (!dataByYearMonth[key]) {
          dataByYearMonth[key] = [];
        }

        const maxTemp = historicalData.daily.temperature_2m_max[index];
        const minTemp = historicalData.daily.temperature_2m_min[index];
        const meanTemp = historicalData.daily.temperature_2m_mean?.[index] || (maxTemp + minTemp) / 2;

        // 验证数据有效性
        if (!isNaN(maxTemp) && !isNaN(minTemp) && !isNaN(meanTemp)) {
          dataByYearMonth[key].push({
            date: time,
            temperature: meanTemp,
            temperatureMax: maxTemp,
            temperatureMin: minTemp
          });
        }
      });

      // 按月份聚合多年数据
      const monthlyData: Record<number, Array<{
        year: number;
        avgTemp: number;
        avgMaxTemp: number;
        avgMinTemp: number;
        recordHigh: number;
        recordLow: number;
      }>> = {};

      for (let month = 1; month <= 12; month++) {
        monthlyData[month] = [];
      }

      // 计算每个年月的统计数据
      for (const [key, monthData] of Object.entries(dataByYearMonth)) {
        const [year, month] = key.split('-').map(Number);
        
        if (monthData.length > 0) {
          const monthlyStats = MonthlyTemperatureAggregator.calculateMonthlyStats(
            monthData,
            location,
            latitude,
            longitude
          );

          if (monthlyStats) {
            monthlyData[month].push({
              year,
              avgTemp: monthlyStats.avgTemp,
              avgMaxTemp: monthlyStats.avgMaxTemp,
              avgMinTemp: monthlyStats.avgMinTemp,
              recordHigh: monthlyStats.recordHigh,
              recordLow: monthlyStats.recordLow
            });
          }
        }
      }

      // 计算每个月的多年平均值
      const monthlyProfiles: MonthlyTemperatureStats[] = [];
      const monthNames = [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
      ];

      for (let month = 1; month <= 12; month++) {
        const yearData = monthlyData[month];
        
        if (yearData.length > 0) {
          const avgTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgTemp));
          const avgMaxTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgMaxTemp));
          const avgMinTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgMinTemp));
          const recordHigh = Math.max(...yearData.map(d => d.recordHigh));
          const recordLow = Math.min(...yearData.map(d => d.recordLow));

          monthlyProfiles.push({
            year: Math.round((startYear + endYear) / 2),
            month,
            monthName: monthNames[month - 1],
            avgTemp: Math.round(avgTemp * 10) / 10,
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            recordHigh: Math.round(recordHigh * 10) / 10,
            recordLow: Math.round(recordLow * 10) / 10,
            totalDays: new Date(2000, month, 0).getDate(), // 该月的总天数
            dataPoints: yearData.length,
            location,
            latitude,
            longitude
          });
        }
      }

      console.log(`[MonthlyTemperatureService] 成功计算 ${monthlyProfiles.length}/12 个月的年度概况（基于${Object.keys(dataByYearMonth).length}个年月数据）`);

      // 缓存结果
      if (monthlyProfiles.length > 0) {
        cache.set(cacheKey, monthlyProfiles, CACHE_TTL.HISTORICAL_DATA);
      }

      return monthlyProfiles;
    } catch (error) {
      console.error('获取年度温度概况失败:', error);
      return [];
    }
  }
}

// 导出单例实例
export const monthlyTemperatureService = new MonthlyTemperatureService();