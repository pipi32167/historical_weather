import React, { useState, useEffect } from 'react';
import { ClockIcon, MapPinIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { monthlyTemperatureService, MonthlyTemperatureTrends } from '../services/monthlyTemperatureService';
import MonthlyTemperatureChart from '../components/Charts/MonthlyTemperatureChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { useLocationStore } from '../store/locationStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const HistoricalMonthly: React.FC = () => {
  const [data, setData] = useState<MonthlyTemperatureTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [yearRange, setYearRange] = useState({ start: 2004, end: 2023 });
  const { currentLocation } = useLocationStore();

  const loadMonthlyData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取月度历史数据:', { month: selectedMonth, yearRange, location: currentLocation });
      
      const result = await monthlyTemperatureService.getMonthlyTemperatureTrends(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedMonth,
        yearRange.start,
        yearRange.end,
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

  const handleYearRangeChange = (start: number, end: number) => {
    setYearRange({ start, end });
  };


  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
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
        return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />;
      case 'cooling':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-blue-500" />;
      case 'stable':
        return <MinusIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendDescription = (trend: 'warming' | 'cooling' | 'stable', trendValue: number) => {
    switch (trend) {
      case 'warming':
        return `升温趋势 +${Math.abs(trendValue).toFixed(3)}°C/年`;
      case 'cooling':
        return `降温趋势 ${trendValue.toFixed(3)}°C/年`;
      case 'stable':
        return '温度稳定';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ClockIcon className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            本月历史同期数据
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          分析指定月份在多年中的温度变化趋势，了解月度气候特征和长期变化规律
        </p>
      </div>

      {/* Location Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MapPinIcon className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            选择分析位置
          </h2>
        </div>
        <QuickLocationSelector compact={false} onLocationChange={loadMonthlyData} />
      </div>

      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择月份
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              年份范围
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={yearRange.start}
                onChange={(e) => handleYearRangeChange(parseInt(e.target.value), yearRange.end)}
                min="1980"
                max="2023"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="px-2 py-2 text-gray-500">至</span>
              <input
                type="number"
                value={yearRange.end}
                onChange={(e) => handleYearRangeChange(yearRange.start, parseInt(e.target.value))}
                min="1980"
                max="2023"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Current Analysis Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              当前分析
            </label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <MapPinIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">
                {currentLocation?.name || '未选择位置'}
              </span>
              {currentLocation && (
                <span className="text-gray-500 text-sm">
                  - {monthNames[selectedMonth - 1]}份分析
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

      {/* Data Display */}
      {!loading && !error && data && (
        <>
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-green-100 dark:bg-green-900/20`}>
                  <ClockIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.monthName}平均温度
                  </p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(data.averageTemp)}`}>
                    {data.averageTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    基于 {data.years.length} 年数据
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">温度趋势</p>
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
                  <ClockIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">数据年份</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {yearRange.start} - {yearRange.end}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    共 {data.years.length} 年
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.monthName}温度趋势图 ({yearRange.start}-{yearRange.end})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                显示历年{data.monthName}的平均温度变化趋势
              </p>
            </div>
            
            <MonthlyTemperatureChart
              location={currentLocation!}
              mode="monthly-trends"
              selectedMonth={selectedMonth}
              startYear={yearRange.start}
              endYear={yearRange.end}
            />
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.monthName}详细数据 ({data.years.length} 年)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      年份
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      平均温度 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      最高温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      最低温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      极值高温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      极值低温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      数据天数
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
        </>
      )}

      {/* No Data State */}
      {!loading && !error && !data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            暂无数据
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalMonthly;