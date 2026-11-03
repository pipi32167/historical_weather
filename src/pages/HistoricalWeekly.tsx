import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useYearRangeStore } from '../store/yearRangeStore';
import { useLocationStore } from '../store/locationStore';
import { useHistoricalPageTitle } from '../hooks/usePageTitle';
import HeatIslandWarning from '../components/common/HeatIslandWarning';

interface WeeklyData {
  year: number;
  week: number;
  weekLabel: string;
  avgMaxTemp: number;
  avgMinTemp: number;
  avgTemp: number;
  recordHigh: number;
  recordLow: number;
  totalPrecipitation: number;
  dataPoints: number;
}

const HistoricalWeekly: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { yearRange } = useYearRangeStore();
  const { currentLocation } = useLocationStore();

  // 设置页面标题
  useHistoricalPageTitle('weekly', currentLocation?.name);

  const getWeekDateRange = (date: Date) => {
    const locale = i18n.language.startsWith('zh') ? zhCN : enUS;
    const weekStart = startOfWeek(date, { locale, weekStartsOn: 1 }); // Monday as first day
    const weekEnd = endOfWeek(date, { locale, weekStartsOn: 1 });
    return { weekStart, weekEnd };
  };

  const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
    const locale = i18n.language.startsWith('zh') ? zhCN : enUS;
    if (i18n.language.startsWith('zh')) {
      return `${format(weekStart, 'M月d日', { locale })} - ${format(weekEnd, 'M月d日', { locale })}`;
    } else {
      return `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d', { locale })}`;
    }
  };

  const loadWeeklyData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📊 获取历史同期周数据:', { 
        date: selectedDate, 
        location: currentLocation,
        yearRange 
      });

      const startYear = yearRange.start;
      const endYear = yearRange.end;
      const results: WeeklyData[] = [];

      // 获取统一的历史数据
      const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
        currentLocation,
        startYear
      );

      // 对每一年，找到对应周的数据
      for (let year = startYear; year <= endYear; year++) {
        // 计算该年对应日期的那一周
        const targetDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate());
        const { weekStart, weekEnd } = getWeekDateRange(targetDate);

        // 过滤出这一周的历史数据
        const weekData = unifiedHistoricalService.filterByWeek(
          historicalData,
          weekStart,
          weekEnd
        );

        if (weekData.length > 0) {
          const avgMaxTemp = weekData.reduce((sum, d) => sum + d.maxTemp, 0) / weekData.length;
          const avgMinTemp = weekData.reduce((sum, d) => sum + d.minTemp, 0) / weekData.length;
          const avgTemp = weekData.reduce((sum, d) => sum + d.avgTemp, 0) / weekData.length;
          const recordHigh = Math.max(...weekData.map(d => d.maxTemp));
          const recordLow = Math.min(...weekData.map(d => d.minTemp));
          const totalPrecipitation = weekData.reduce((sum, d) => sum + d.precipitation, 0);

          results.push({
            year,
            week: getWeek(targetDate, { weekStartsOn: 1 }),
            weekLabel: formatWeekLabel(weekStart, weekEnd),
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            avgTemp: Math.round(avgTemp * 10) / 10,
            recordHigh: Math.round(recordHigh * 10) / 10,
            recordLow: Math.round(recordLow * 10) / 10,
            totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
            dataPoints: weekData.length
          });
        }
      }

      // 按年份排序（最新的在前）
      results.sort((a, b) => b.year - a.year);
      setData(results);

      console.log(`🎯 找到 ${results.length} 年的周数据`);

    } catch (error) {
      console.error('获取周数据失败:', error);
      setError(t('errors.dataLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyData();
  }, [selectedDate, yearRange, currentLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
  };

  // 计算温度趋势
  const calculateTrend = (data: WeeklyData[]): { trend: 'warming' | 'cooling' | 'stable'; trendValue: number } => {
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

  const getTrendIcon = (trend: 'warming' | 'cooling' | 'stable') => {
    switch (trend) {
      case 'warming':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'cooling':
        return <TrendingDown className="w-5 h-5 text-blue-500" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const { weekStart, weekEnd } = getWeekDateRange(selectedDate);
  const currentWeekLabel = formatWeekLabel(weekStart, weekEnd);
  const tempTrend = calculateTrend(data);

  // 计算统计信息
  const statistics = data.length > 0 ? {
    avgMaxTemp: Math.round((data.reduce((sum, d) => sum + d.avgMaxTemp, 0) / data.length) * 10) / 10,
    avgMinTemp: Math.round((data.reduce((sum, d) => sum + d.avgMinTemp, 0) / data.length) * 10) / 10,
    avgTemp: Math.round((data.reduce((sum, d) => sum + d.avgTemp, 0) / data.length) * 10) / 10,
    absoluteHigh: Math.max(...data.map(d => d.recordHigh)),
    absoluteLow: Math.min(...data.map(d => d.recordLow)),
    avgPrecipitation: Math.round((data.reduce((sum, d) => sum + d.totalPrecipitation, 0) / data.length) * 10) / 10
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary-600" />
          {t('navigation.historical.weekly')}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          {t('analysis.weeklyDescription')}
        </p>
      </div>

      {/* 控制面板 */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 日期选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('time.selectDate')}
          </label>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('analysis.weekRange')}: {currentWeekLabel}
          </p>
        </div>

        {/* 当前位置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('location.currentLocation')}
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentLocation?.name || t('location.notSelected')}
          </p>
          {data.length > 1 && (
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(tempTrend.trend)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tempTrend.trend === 'warming' && t('analysis.warmingTrend', { value: Math.abs(tempTrend.trendValue).toFixed(3) })}
                {tempTrend.trend === 'cooling' && t('analysis.coolingTrend', { value: Math.abs(tempTrend.trendValue).toFixed(3) })}
                {tempTrend.trend === 'stable' && t('analysis.stableTemperature')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-8">
          <ErrorMessage message={error} onRetry={loadWeeklyData} />
        </div>
      )}

      {/* 数据展示 */}
      {!loading && !error && data.length > 0 && (
        <>
          {/* 统计概览 */}
          {statistics && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('analysis.weeklyStatsSummary')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.avgMaxTemp')}</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.avgMaxTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.avgMinTemp')}</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.avgMinTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.avgTemp')}</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.avgTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.recordHigh')}</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.absoluteHigh}°C</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.recordLow')}</p>
                  <p className="text-2xl font-bold text-indigo-600">{statistics.absoluteLow}°C</p>
                </div>
                <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.avgPrecipitation')}</p>
                  <p className="text-2xl font-bold text-cyan-600">{statistics.avgPrecipitation}mm</p>
                </div>
              </div>
            </div>
          )}

          {/* 温度趋势图表 */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('analysis.weeklyTemperatureTrend')}
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    label={{ value: t('weather.temperature'), angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `${value}${t('time.year')} - ${data.find(d => d.year === value)?.weekLabel || ''}`}
                    formatter={(value: number, name: string) => [
                      `${value}°C`,
                      name === 'avgMaxTemp' ? t('analysis.avgMaxTemp') :
                      name === 'avgMinTemp' ? t('analysis.avgMinTemp') :
                      name === 'avgTemp' ? t('weather.avgTemp') : name
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'avgMaxTemp' ? t('analysis.avgMaxTemp') :
                      value === 'avgMinTemp' ? t('analysis.avgMinTemp') :
                      value === 'avgTemp' ? t('weather.avgTemp') : value
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgMaxTemp" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgTemp" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgMinTemp" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('analysis.weeklyHistoricalData')}
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
                      {t('time.weekRange')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.avgMaxTemp')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.avgMinTemp')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.avgTemp')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.recordHigh')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.recordLow')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.totalPrecipitation')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.dataPoints')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((item) => (
                    <tr key={item.year} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.year}
                        {item.year === new Date().getFullYear() && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {t('time.thisYear')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.weekLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-red-600">
                        {item.avgMaxTemp}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                        {item.avgMinTemp}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-green-600">
                        {item.avgTemp}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-orange-600">
                        {item.recordHigh}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-indigo-600">
                        {item.recordLow}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-cyan-600">
                        {item.totalPrecipitation}mm
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                        {item.dataPoints}/7
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 无数据提示 */}
      {!loading && !error && currentLocation && data.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            {t('common.noData')}
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            {t('analysis.noWeeklyDataForPeriod')}
          </p>
        </div>
      )}

      {/* 城市热岛效应说明 */}
      {currentLocation && <HeatIslandWarning />}
    </div>
  );
};

export default HistoricalWeekly;