import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MonthlyTemperatureStats } from '../services/monthlyTemperatureService';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import MonthlyTemperatureChart from '../components/Charts/MonthlyTemperatureChart';
import HistoricalTemperatureChart from '../components/Charts/HistoricalTemperatureChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import HeatIslandWarning from '../components/common/HeatIslandWarning';
import { YearRangeSelector } from '../components/common/YearRangeSelector';
import { useYearRangeStore } from '../store/yearRangeStore';
import { useLocationStore } from '../store/locationStore';
import { useHistoricalPageTitle } from '../hooks/usePageTitle';

interface YearlyData {
  year: number;
  months: MonthlyTemperatureStats[];
  avgTemp: number;
  avgMaxTemp: number;
  avgMinTemp: number;
  recordHigh: number;
  recordLow: number;
  totalDataPoints: number;
}

const HistoricalYearly: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { yearRange } = useYearRangeStore();
  const [viewMode, setViewMode] = useState<'trends' | 'profile'>('trends');
  const { currentLocation } = useLocationStore();
  
  // 设置页面标题
  useHistoricalPageTitle('yearly', currentLocation?.name);

  const loadYearlyData = useCallback(async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取年度历史数据（优化版本，一次API调用）:', { yearRange, location: currentLocation });

      // 使用统一的历史数据服务
      console.log(`[HistoricalYearly] 使用统一服务获取历史数据，年份范围: ${yearRange.start} - ${yearRange.end}`);

      const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
        currentLocation,
        yearRange.start
      );

      console.log(`[HistoricalYearly] 获取到 ${historicalData.daily?.time?.length || 0} 天的数据`);

      // 按年份和月份分组数据
      const dataByYearMonth: Record<string, Array<{
        date: string;
        maxTemp: number;
        minTemp: number;
        avgTemp: number;
      }>> = {};

      if (historicalData?.daily?.time) {
        historicalData.daily.time.forEach((time: string, index: number) => {
          const date = new Date(time);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!dataByYearMonth[key]) {
            dataByYearMonth[key] = [];
          }

          const maxTemp = historicalData.daily.temperature_2m_max[index];
          const minTemp = historicalData.daily.temperature_2m_min[index];
          const avgTemp = historicalData.daily.temperature_2m_mean?.[index] || (maxTemp + minTemp) / 2;

          if (!isNaN(maxTemp) && !isNaN(minTemp) && !isNaN(avgTemp)) {
            dataByYearMonth[key].push({
              date: time,
              maxTemp,
              minTemp,
              avgTemp
            });
          }
        });
      }

      // 按年份组织数据
      const yearDataMap: Record<number, MonthlyTemperatureStats[]> = {};

      for (const [key, monthData] of Object.entries(dataByYearMonth)) {
        const [year, month] = key.split('-').map(Number);

        if (monthData.length > 0) {
          if (!yearDataMap[year]) {
            yearDataMap[year] = [];
          }

          const avgTemp = monthData.reduce((sum, d) => sum + d.avgTemp, 0) / monthData.length;
          const avgMaxTemp = monthData.reduce((sum, d) => sum + d.maxTemp, 0) / monthData.length;
          const avgMinTemp = monthData.reduce((sum, d) => sum + d.minTemp, 0) / monthData.length;
          const recordHigh = Math.max(...monthData.map(d => d.maxTemp));
          const recordLow = Math.min(...monthData.map(d => d.minTemp));


          yearDataMap[year].push({
            year,
            month,
            avgTemp: Math.round(avgTemp * 10) / 10,
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            recordHigh: Math.round(recordHigh * 10) / 10,
            recordLow: Math.round(recordLow * 10) / 10,
            totalDays: new Date(year, month, 0).getDate(),
            dataPoints: monthData.length,
            location: currentLocation.name,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          });
        }
      }

      const yearlyResults: YearlyData[] = [];

      // 为每年生成年度数据
      for (let year = yearRange.start; year <= yearRange.end; year++) {
        const yearMonthData = yearDataMap[year] || [];

        if (yearMonthData.length > 0) {
          // 按月份排序
          yearMonthData.sort((a, b) => a.month - b.month);

          // 计算年度统计
          const avgTemp = yearMonthData.reduce((sum, month) => sum + month.avgTemp, 0) / yearMonthData.length;
          const avgMaxTemp = yearMonthData.reduce((sum, month) => sum + month.avgMaxTemp, 0) / yearMonthData.length;
          const avgMinTemp = yearMonthData.reduce((sum, month) => sum + month.avgMinTemp, 0) / yearMonthData.length;
          const recordHigh = Math.max(...yearMonthData.map(month => month.recordHigh));
          const recordLow = Math.min(...yearMonthData.map(month => month.recordLow));
          const totalDataPoints = yearMonthData.reduce((sum, month) => sum + month.dataPoints, 0);

          yearlyResults.push({
            year,
            months: yearMonthData,
            avgTemp: Math.round(avgTemp * 10) / 10,
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            recordHigh: Math.round(recordHigh * 10) / 10,
            recordLow: Math.round(recordLow * 10) / 10,
            totalDataPoints
          });
        }
      }

      // 按年份排序
      yearlyResults.sort((a, b) => a.year - b.year);
      console.log('成功处理年度数据:', yearlyResults.length, '年');
      setData(yearlyResults);

    } catch (error) {
      console.error('获取年度历史数据失败:', error);
      setError(t('errors.loadingFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentLocation, yearRange, t]);

  useEffect(() => {
    void loadYearlyData();
  }, [loadYearlyData]);


  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 15) return 'text-blue-400';
    if (temp < 25) return 'text-green-500';
    if (temp < 35) return 'text-yellow-500';
    return 'text-red-500';
  };

  // 计算整体统计
  const avgYearlyTemp = data.length > 0 ?
    Math.round((data.reduce((sum, d) => sum + d.avgTemp, 0) / data.length) * 10) / 10 : 0;

  const overallRecordHigh = data.length > 0 ? Math.max(...data.map(d => d.recordHigh)) : 0;
  const overallRecordLow = data.length > 0 ? Math.min(...data.map(d => d.recordLow)) : 0;

  // 计算年度温度趋势
  const calculateYearlyTrend = (): { trend: 'warming' | 'cooling' | 'stable'; trendValue: number } => {
    if (data.length < 2) return { trend: 'stable', trendValue: 0 };

    const n = data.length;
    const years = data.map(d => d.year);
    const temps = data.map(d => d.avgTemp);

    const sumX = years.reduce((sum, year) => sum + year, 0);
    const sumY = temps.reduce((sum, temp) => sum + temp, 0);
    const sumXY = years.reduce((sum, year, i) => sum + year * temps[i], 0);
    const sumXX = years.reduce((sum, year) => sum + year * year, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendValue = Math.round(slope * 1000) / 1000;

    let trend: 'warming' | 'cooling' | 'stable';
    if (Math.abs(trendValue) < 0.01) {
      trend = 'stable';
    } else if (trendValue > 0) {
      trend = 'warming';
    } else {
      trend = 'cooling';
    }

    return { trend, trendValue };
  };

  const { trend, trendValue } = calculateYearlyTrend();

  const getTrendIcon = (trend: 'warming' | 'cooling' | 'stable') => {
    switch (trend) {
      case 'warming':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'cooling':
        return <TrendingDown className="h-5 w-5 text-blue-500" />;
      case 'stable':
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendDescription = (trend: 'warming' | 'cooling' | 'stable', trendValue: number) => {
    switch (trend) {
      case 'warming':
        return t('analysis.warmingTrend', { value: Math.abs(trendValue).toFixed(3) });
      case 'cooling':
        return t('analysis.coolingTrend', { value: trendValue.toFixed(3) });
      case 'stable':
        return t('analysis.stableTemperature');
    }
  };

  const getTrendColor = (trend: 'warming' | 'cooling' | 'stable') => {
    switch (trend) {
      case 'warming':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'cooling':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'stable':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // 准备图表数据
  const yearlyChartData = data.map(item => ({
    year: item.year,
    recordHigh: item.recordHigh,
    maxTemp: item.avgMaxTemp,
    avgTemp: item.avgTemp,
    minTemp: item.avgMinTemp,
    recordLow: item.recordLow
  }));



  console.log('渲染 HistoricalYearly 组件:', yearlyChartData);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <LineChart className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('navigation.yearly')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {t('analysis.yearlyDescription')}
        </p>
      </div>

      {/* 1. 当前位置信息卡片 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentLocation?.name || t('location.notSelected')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {currentLocation ? (
                  <>
                    {viewMode === 'trends' ? t('analysis.yearlyTrends') : t('analysis.monthlyProfile')}{t('analysis.analysisSuffix')}
                  </>
                ) : (
                  t('homepage.pleaseSelectLocation')
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {yearRange.start} - {yearRange.end}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('analysis.dataYears')}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* 2. 核心统计和图表 */}
      {!loading && !error && data.length > 0 && (
        <>
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <LineChart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.multiYearAvgTemp')}</p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(avgYearlyTemp)}`}>
                    {avgYearlyTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.basedOnYearsData', { years: data.length })}
                  </p>
                </div>
              </div>
            </div>

            {/* Temperature Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.yearlyTrend')}</p>
                  <p className={`text-lg font-semibold ${getTrendColor(trend).split(' ')[0]}`}>
                    {getTrendDescription(trend, trendValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Record High */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.historicalMaxTemp')}</p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(overallRecordHigh)}`}>
                    {overallRecordHigh}°C
                  </p>
                </div>
              </div>
            </div>

            {/* Record Low */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.historicalMinTemp')}</p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(overallRecordLow)}`}>
                    {overallRecordLow}°C
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {viewMode === 'trends' && (
            <HistoricalTemperatureChart
              data={yearlyChartData}
              type="yearly"
              title={t('analysis.yearlyTrendChartTitle')}
              subtitle={t('analysis.yearlyTrendChartSubtitle')}
              yearRange={yearRange}
            />
          )}

          {viewMode === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('analysis.multiYearMonthlyProfile', { startYear: yearRange.start, endYear: yearRange.end })}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('analysis.monthlyProfileDescription')}
                </p>
              </div>

              <MonthlyTemperatureChart
                location={currentLocation!}
                mode="annual-profile"
                startYear={yearRange.start}
                endYear={yearRange.end}
              />
            </div>
          )}
        </>
      )}

      {/* 3. 控制面板 */}
      {/* 当前位置显示 */}
      {currentLocation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('location.currentLocation')}: <span className="font-medium">{currentLocation.name}</span>
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('analysis.viewMode')}
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'trends' | 'profile')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="trends">{t('analysis.yearlyTrends')}</option>
              <option value="profile">{t('analysis.monthlyProfile')}</option>
            </select>
          </div>

          {/* Year Range */}
          <div>
            <YearRangeSelector />
          </div>

          {/* Current Analysis Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('analysis.current')}
            </label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">
                {currentLocation?.name || t('location.notSelected')}
              </span>
              {currentLocation && (
                <span className="text-gray-500 text-sm">
                  - {viewMode === 'trends' ? t('analysis.yearlyTrends') : t('analysis.monthlyProfile')}{t('analysis.analysisSuffix')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('analysis.yearlyDetailedDataTitle', { years: data.length })}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('time.year')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.yearlyAvgTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.yearlyAvgMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.yearlyAvgMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.yearlyMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.yearlyMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.dataDays')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((item) => (
                    <tr key={item.year} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.year}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgTemp)}`}>
                        {item.avgTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgMaxTemp)}`}>
                        {item.avgMaxTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgMinTemp)}`}>
                        {item.avgMinTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.recordHigh)}`}>
                        {item.recordHigh}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.recordLow)}`}>
                        {item.recordLow}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.totalDataPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && data.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('app.noData')}
          </p>
        </div>
      )}

      {/* 城市热岛效应说明 */}
      {currentLocation && <HeatIslandWarning />}
    </div>
  );
};

export default HistoricalYearly;