/**
 * 月平均温度服务
 * 基于Open-Meteo API实现月度温度数据聚合和分析
 */

import { unifiedHistoricalService } from './unifiedHistoricalService';
import { getYear, getMonth, getDaysInMonth } from 'date-fns';

export interface MonthlyTemperatureStats {
  year: number;
  month: number; // 1-12
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

    const validData = dailyData.filter(d =>
      !isNaN(d.temperature) &&
      !isNaN(d.temperatureMax) &&
      !isNaN(d.temperatureMin) &&
      d.temperature !== null &&
      d.temperatureMax !== null &&
      d.temperatureMin !== null &&
      typeof d.temperature === 'number' &&
      typeof d.temperatureMax === 'number' &&
      typeof d.temperatureMin === 'number'
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
   * 获取特定月份的温度趋势（多年对比）
   * 使用统一历史数据服务
   */
  async getMonthlyTemperatureTrends(
    latitude: number,
    longitude: number,
    month: number,
    startYear: number,
    endYear: number,
    locationName: string = 'Unknown',
    timezone: string = 'auto'
  ): Promise<MonthlyTemperatureTrends | null> {
    try {
      // 构造 Location 对象
      const location = {
        id: `${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
        name: locationName,
        latitude,
        longitude,
        country: 'Unknown',
        timezone
      };

      // 使用统一服务获取月度趋势数据
      console.log('📊 使用统一服务计算月度温度趋势:', { locationName, month, startYear, endYear });

      const result = await unifiedHistoricalService.getMonthlyTemperatureTrends(
        location,
        month,
        startYear,
        Math.min(endYear, new Date().getFullYear()) // 确保不超过当前年份
      );

      return result;
    } catch (error) {
      console.error('获取月度温度趋势失败:', error);
      return null;
    }
  }

  /**
   * 获取指定位置全年各月的平均温度（基于多年数据）- 优化版本
   * 使用统一历史数据服务
   */
  async getAnnualTemperatureProfile(
    latitude: number,
    longitude: number,
    startYear: number,
    endYear: number,
    locationName: string = '未知位置',
    timezone: string = 'auto'
  ): Promise<MonthlyTemperatureStats[]> {
    try {
      console.log('📈 使用统一服务计算年度温度概况:', { locationName, startYear, endYear });

      // 构造 Location 对象
      const location = {
        id: `${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
        name: locationName,
        latitude,
        longitude,
        country: 'Unknown',
        timezone
      };

      // 计算每个月的多年平均值
      const monthlyProfiles: MonthlyTemperatureStats[] = [];

      for (let month = 1; month <= 12; month++) {
        // 使用统一服务获取单个月份的多年趋势
        const monthTrends = await unifiedHistoricalService.getMonthlyTemperatureTrends(
          location,
          month,
          startYear,
          Math.min(endYear, new Date().getFullYear())
        );

        if (monthTrends && monthTrends.years.length > 0) {
          // 计算该月的多年平均值
          const yearData = monthTrends.years;
          const avgTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgTemp));
          const avgMaxTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgMaxTemp));
          const avgMinTemp = MonthlyTemperatureAggregator.mean(yearData.map(d => d.avgMinTemp));
          const recordHigh = Math.max(...yearData.map(d => d.recordHigh));
          const recordLow = Math.min(...yearData.map(d => d.recordLow));

          monthlyProfiles.push({
            year: Math.round((startYear + endYear) / 2),
            month,
            avgTemp: Math.round(avgTemp * 10) / 10,
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            recordHigh: Math.round(recordHigh * 10) / 10,
            recordLow: Math.round(recordLow * 10) / 10,
            totalDays: new Date(2000, month, 0).getDate(), // 该月的总天数
            dataPoints: yearData.length,
            location: locationName,
            latitude,
            longitude
          });
        }
      }

      console.log(`[MonthlyTemperatureService] 成功计算 ${monthlyProfiles.length}/12 个月的年度概况`);
      return monthlyProfiles;
    } catch (error) {
      console.error('获取年度温度概况失败:', error);
      return [];
    }
  }
}

// 导出单例实例
export const monthlyTemperatureService = new MonthlyTemperatureService();