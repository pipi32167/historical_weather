import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { monthlyTemperatureService, MonthlyTemperatureTrends } from '../services/monthlyTemperatureService';
import HistoricalTemperatureChart from '../components/Charts/HistoricalTemperatureChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { YearRangeSelector } from '../components/common/YearRangeSelector';
import HeatIslandWarning from '../components/common/HeatIslandWarning';
import { useYearRangeStore } from '../store/yearRangeStore';
import { useLocationStore } from '../store/locationStore';
import { useHistoricalPageTitle } from '../hooks/usePageTitle';

const HistoricalMonthly: React.FC = () => {
  const { t } = useTranslation();
  
  // 获取月份名称的函数
  const getMonthName = useCallback((monthNumber: number): string => {
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(`time.${monthKeys[monthNumber - 1]}`);
  }, [t]);
  const [data, setData] = useState<MonthlyTemperatureTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const { yearRange } = useYearRangeStore();
  const { currentLocation } = useLocationStore();
  
  // 设置页面标题
  useHistoricalPageTitle('monthly', currentLocation?.name);

  const loadMonthlyData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取月度历史数据:', { month: selectedMonth, yearRange, location: currentLocation });

      // 计算当前年份和月份
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 判断选择的月份在当前年份是否已经过去
      const selectedMonthInCurrentYear = selectedMonth <= currentMonth;

      // 设置实际的结束年份
      let actualEndYear = yearRange.end;

      if (actualEndYear === currentYear && !selectedMonthInCurrentYear) {
        // 当前年份的未来月份，排除当前年份
        actualEndYear = currentYear - 1;
        console.log(`[HistoricalMonthly] 当前年份${selectedMonth}月未到，排除当年，实际结束年份: ${actualEndYear}`);
      } else if (actualEndYear === currentYear && selectedMonthInCurrentYear) {
        console.log(`[HistoricalMonthly] 当前年份${selectedMonth}月已过去，包含当年数据`);
      }

      const result = await monthlyTemperatureService.getMonthlyTemperatureTrends(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedMonth,
        yearRange.start,
        actualEndYear,
        currentLocation.name,
        currentLocation.timezone
      );

      setData(result);

    } catch (error) {
      console.error('获取月度历史数据失败:', error);
      setError('获取月度历史数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, yearRange, currentLocation]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(event.target.value));
  };



  const monthNames = [
    t('time.january'), t('time.february'), t('time.march'), t('time.april'),
    t('time.may'), t('time.june'), t('time.july'), t('time.august'),
    t('time.september'), t('time.october'), t('time.november'), t('time.december')
  ];

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 15) return 'text-blue-400';
    if (temp < 25) return 'text-green-500';
    if (temp < 35) return 'text-yellow-500';
    return 'text-red-500';
  };

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

  // 转换数据格式为通用图表组件所需的格式
  const chartData = data ? data.years.map(yearData => ({
    year: yearData.year,
    recordHigh: yearData.recordHigh,
    maxTemp: yearData.avgMaxTemp,
    avgTemp: yearData.avgTemp,
    minTemp: yearData.avgMinTemp,
    recordLow: yearData.recordLow
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('navigation.monthly')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {t('analysis.monthlyDescription')}
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
                    {monthNames[selectedMonth - 1]}{t('analysis.monthlyAnalysis')}
                  </>
                ) : (
                  t('homepage.pleaseSelectLocation')
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {monthNames[selectedMonth - 1]}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {yearRange.start} - {yearRange.end}
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

      {/* 2. 核心图表 */}
      {!loading && !error && data && (
        <>
          {/* Chart */}
          <HistoricalTemperatureChart
            data={chartData}
            type="monthly"
            title={`${getMonthName(data.month)}${t('analysis.temperatureTrendChart')}`}
            subtitle={t('analysis.showMonthlyTrendDescription', { month: getMonthName(data.month) })}
            yearRange={yearRange}
          />

          {/* Statistics Summary - 移到图表下方 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-green-100 dark:bg-green-900/20`}>
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getMonthName(data.month)}{t('weather.avgTempSuffix')}
                  </p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(data.averageTemp)}`}>
                    {data.averageTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.basedOnYearsData', { years: data.years.length })}
                  </p>
                </div>
              </div>
            </div>

            {/* Temperature Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getTrendColor(data.trend)}`}>
                  {getTrendIcon(data.trend)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.temperatureTrend')}</p>
                  <p className={`text-lg font-semibold ${getTrendColor(data.trend).split(' ')[0]}`}>
                    {getTrendDescription(data.trend, data.trendValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Years */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.dataYears')}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {yearRange.start} - {yearRange.end}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.totalYears', { years: data.years.length })}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('time.selectMonth')}
            </label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
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
                  - {monthNames[selectedMonth - 1]}{t('analysis.monthlyAnalysis')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

          {/* 4. 详细数据表格 */}
          {!loading && !error && data && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
{getMonthName(data.month)}{t('analysis.detailedDataTitle', { years: data.years.length })}
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
                      {t('weather.monthlyAvgTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.monthlyAvgMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.monthlyAvgMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.monthlyMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.monthlyMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.dataDays')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.years.map((yearData) => (
                    <tr key={yearData.year} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {yearData.year}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(yearData.avgTemp)}`}>
                        {yearData.avgTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(yearData.avgMaxTemp)}`}>
                        {yearData.avgMaxTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(yearData.avgMinTemp)}`}>
                        {yearData.avgMinTemp}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(yearData.recordHigh)}`}>
                        {yearData.recordHigh}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(yearData.recordLow)}`}>
                        {yearData.recordLow}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {yearData.dataPoints}/{yearData.totalDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

      {/* No Data State */}
      {!loading && !error && !data && (
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

export default HistoricalMonthly;