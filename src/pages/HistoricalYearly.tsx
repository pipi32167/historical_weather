import React, { useState, useEffect } from 'react';
import { PresentationChartLineIcon, MapPinIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { monthlyTemperatureService, MonthlyTemperatureStats } from '../services/monthlyTemperatureService';
import MonthlyTemperatureChart from '../components/Charts/MonthlyTemperatureChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { useLocationStore } from '../store/locationStore';

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
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState({ start: 2014, end: 2023 });
  const [viewMode, setViewMode] = useState<'trends' | 'profile'>('trends');
  const { currentLocation } = useLocationStore();

  const loadYearlyData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取年度历史数据:', { yearRange, location: currentLocation });
      
      const yearlyResults: YearlyData[] = [];
      
      // 为每年获取年度概况数据
      for (let year = yearRange.start; year <= yearRange.end; year++) {
        try {
          const annualProfile = await monthlyTemperatureService.getAnnualTemperatureProfile(
            currentLocation.latitude,
            currentLocation.longitude,
            year,
            year,
            currentLocation.name,
            currentLocation.timezone
          );

          if (annualProfile.length > 0) {
            // 计算年度统计
            const avgTemp = annualProfile.reduce((sum, month) => sum + month.avgTemp, 0) / annualProfile.length;
            const avgMaxTemp = annualProfile.reduce((sum, month) => sum + month.avgMaxTemp, 0) / annualProfile.length;
            const avgMinTemp = annualProfile.reduce((sum, month) => sum + month.avgMinTemp, 0) / annualProfile.length;
            const recordHigh = Math.max(...annualProfile.map(month => month.recordHigh));
            const recordLow = Math.min(...annualProfile.map(month => month.recordLow));
            const totalDataPoints = annualProfile.reduce((sum, month) => sum + month.dataPoints, 0);

            yearlyResults.push({
              year,
              months: annualProfile,
              avgTemp: Math.round(avgTemp * 10) / 10,
              avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
              avgMinTemp: Math.round(avgMinTemp * 10) / 10,
              recordHigh: Math.round(recordHigh * 10) / 10,
              recordLow: Math.round(recordLow * 10) / 10,
              totalDataPoints
            });
          }
        } catch (yearError) {
          console.warn(`获取${year}年数据失败:`, yearError);
        }
      }

      // 按年份排序
      yearlyResults.sort((a, b) => a.year - b.year);
      setData(yearlyResults);

    } catch (error) {
      console.error('获取年度历史数据失败:', error);
      setError('获取年度历史数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYearlyData();
  }, [yearRange, currentLocation]);

  const handleYearRangeChange = (start: number, end: number) => {
    setYearRange({ start, end });
  };

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

  // 准备图表数据
  const yearlyChartData = data.map(item => ({
    year: item.year,
    avgTemp: item.avgTemp,
    maxTemp: item.avgMaxTemp,
    minTemp: item.avgMinTemp,
    recordHigh: item.recordHigh,
    recordLow: item.recordLow
  }));

  // 计算多年平均的月度概况
  const averageMonthlyProfile = () => {
    if (data.length === 0) return [];

    const monthlyAverages = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = data
        .map(yearData => yearData.months.find(m => m.month === month))
        .filter(Boolean) as MonthlyTemperatureStats[];

      if (monthData.length > 0) {
        const avgTemp = monthData.reduce((sum, m) => sum + m.avgTemp, 0) / monthData.length;
        const avgMaxTemp = monthData.reduce((sum, m) => sum + m.avgMaxTemp, 0) / monthData.length;
        const avgMinTemp = monthData.reduce((sum, m) => sum + m.avgMinTemp, 0) / monthData.length;
        const recordHigh = Math.max(...monthData.map(m => m.recordHigh));
        const recordLow = Math.min(...monthData.map(m => m.recordLow));

        monthlyAverages.push({
          month,
          monthName: monthData[0].monthName,
          avgTemp: Math.round(avgTemp * 10) / 10,
          avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
          avgMinTemp: Math.round(avgMinTemp * 10) / 10,
          recordHigh: Math.round(recordHigh * 10) / 10,
          recordLow: Math.round(recordLow * 10) / 10
        });
      }
    }

    return monthlyAverages;
  };

  const monthlyProfileData = averageMonthlyProfile();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PresentationChartLineIcon className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            本年度历史同期数据
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          分析多年的年度温度变化趋势，了解长期气候变化规律和年度气候特征
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
        <QuickLocationSelector compact={false} onLocationChange={loadYearlyData} />
      </div>

      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示模式
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'trends' | 'profile')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="trends">年度趋势</option>
              <option value="profile">月度概况</option>
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
                  - {viewMode === 'trends' ? '年度趋势' : '月度概况'}分析
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
      {!loading && !error && data.length > 0 && (
        <>
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <PresentationChartLineIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">多年平均温度</p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(avgYearlyTemp)}`}>
                    {avgYearlyTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    基于 {data.length} 年数据
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">年度趋势</p>
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
                  <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">历史最高温</p>
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
                  <ArrowTrendingDownIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">历史最低温</p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(overallRecordLow)}`}>
                    {overallRecordLow}°C
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {viewMode === 'trends' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  年度温度趋势图 ({yearRange.start}-{yearRange.end})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  显示历年的平均温度、极值变化趋势
                </p>
              </div>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value}°C`, 
                        name === 'avgTemp' ? '年平均温度' :
                        name === 'maxTemp' ? '年平均最高温' : 
                        name === 'minTemp' ? '年平均最低温' :
                        name === 'recordHigh' ? '年最高温' : '年最低温'
                      ]}
                    />
                    <Legend 
                      formatter={(value: string) => 
                        value === 'avgTemp' ? '年平均温度' :
                        value === 'maxTemp' ? '年平均最高温' : 
                        value === 'minTemp' ? '年平均最低温' :
                        value === 'recordHigh' ? '年最高温' : '年最低温'
                      }
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTemp" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maxTemp" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="minTemp" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recordHigh" 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recordLow" 
                      stroke="#1e40af" 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {viewMode === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  多年平均月度概况 ({yearRange.start}-{yearRange.end})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  显示各月份的多年平均温度分布
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

          {/* Detailed Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                年度详细数据 ({data.length} 年)
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
                      年平均温度 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      年平均最高温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      年平均最低温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      年最高温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      年最低温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      数据天数
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
        </>
      )}

      {/* No Data State */}
      {!loading && !error && data.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            暂无数据
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalYearly;