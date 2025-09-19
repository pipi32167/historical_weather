import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MonthlyTemperatureStats } from '../services/monthlyTemperatureService';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import HistoricalTemperatureChart from '../components/Charts/HistoricalTemperatureChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { YearRangeSelector } from '../components/common/YearRangeSelector';
import { useLocationStore } from '../store/locationStore';
import { useHistoricalPageTitle } from '../hooks/usePageTitle';

interface QuarterlyData {
  quarter: string;
  quarterNumber: number;
  months: MonthlyTemperatureStats[];
  avgTemp: number;
  avgMaxTemp: number;
  avgMinTemp: number;
  recordHigh: number;
  recordLow: number;
  totalDataPoints: number;
}

interface QuarterlyYearData {
  year: number;
  quarters: QuarterlyData[];
}

const HistoricalQuarterly: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<QuarterlyYearData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [yearRange, setYearRange] = useState({ start: new Date().getFullYear() - 20, end: new Date().getFullYear() });
  const { currentLocation } = useLocationStore();
  
  // 设置页面标题
  useHistoricalPageTitle('quarterly', currentLocation?.name);

  const quarterNames = [t('time.firstQuarter'), t('time.secondQuarter'), t('time.thirdQuarter'), t('time.fourthQuarter')];
  const quarterMonths = [
    [1, 2, 3],    // Q1: 1-3月
    [4, 5, 6],    // Q2: 4-6月
    [7, 8, 9],    // Q3: 7-9月
    [10, 11, 12]  // Q4: 10-12月
  ];

  const loadQuarterlyData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔢 使用统一服务获取季度历史数据:', { quarter: selectedQuarter, yearRange, location: currentLocation });

      const quarterlyResults: QuarterlyYearData[] = [];

      // 获取当前季度的所有月份
      const currentQuarterMonths = quarterMonths[selectedQuarter - 1];

      // 使用统一服务获取历史数据
      const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
        currentLocation,
        yearRange.start
      );

      console.log(`[HistoricalQuarterly] 开始处理季度数据，年份范围: ${yearRange.start}-${Math.min(yearRange.end, new Date().getFullYear())}`);

      // 使用统一服务获取季度月份的月度趋势数据
      const monthlyTrendsPromises = currentQuarterMonths.map(month =>
        unifiedHistoricalService.getMonthlyTemperatureTrends(
          currentLocation,
          month,
          yearRange.start,
          Math.min(yearRange.end, new Date().getFullYear())
        )
      );

      const monthlyTrendsResults = await Promise.all(monthlyTrendsPromises);

      // 按年份重新组织数据
      const yearMap: Record<number, Record<number, MonthlyTemperatureStats>> = {};

      // 将月度趋势数据按年份和月份归类
      monthlyTrendsResults.forEach((monthTrend, monthIndex) => {
        if (monthTrend?.years) {
          const month = currentQuarterMonths[monthIndex];
          monthTrend.years.forEach(yearData => {
            if (!yearMap[yearData.year]) {
              yearMap[yearData.year] = {};
            }
            yearMap[yearData.year][month] = yearData;
          });
        }
      });

      // 为每年生成季度数据
      for (let year = yearRange.start; year <= Math.min(yearRange.end, new Date().getFullYear()); year++) {
        const monthsData = yearMap[year];

        if (monthsData) {
          const quarterMonthStats: MonthlyTemperatureStats[] = [];
          let totalAvgTemp = 0;
          let totalAvgMaxTemp = 0;
          let totalAvgMinTemp = 0;
          let totalRecordHigh = -Infinity;
          let totalRecordLow = Infinity;
          let totalDataPoints = 0;

          // 收集该年份在当前季度的所有月份数据
          for (const month of currentQuarterMonths) {
            const monthData = monthsData[month];
            if (monthData) {
              quarterMonthStats.push(monthData);
              totalAvgTemp += monthData.avgTemp;
              totalAvgMaxTemp += monthData.avgMaxTemp;
              totalAvgMinTemp += monthData.avgMinTemp;
              totalRecordHigh = Math.max(totalRecordHigh, monthData.recordHigh);
              totalRecordLow = Math.min(totalRecordLow, monthData.recordLow);
              totalDataPoints += monthData.dataPoints;
            }
          }

          if (quarterMonthStats.length > 0) {
            // 计算季度平均值
            const avgTemp = totalAvgTemp / quarterMonthStats.length;
            const avgMaxTemp = totalAvgMaxTemp / quarterMonthStats.length;
            const avgMinTemp = totalAvgMinTemp / quarterMonthStats.length;

            // 创建季度数据（只创建当前选中的季度）
            const quarters: QuarterlyData[] = quarterNames.map((name, index) => {
              if (index === selectedQuarter - 1) {
                return {
                  quarter: name,
                  quarterNumber: index + 1,
                  months: quarterMonthStats,
                  avgTemp: Math.round(avgTemp * 10) / 10,
                  avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
                  avgMinTemp: Math.round(avgMinTemp * 10) / 10,
                  recordHigh: totalRecordHigh === -Infinity ? 0 : Math.round(totalRecordHigh * 10) / 10,
                  recordLow: totalRecordLow === Infinity ? 0 : Math.round(totalRecordLow * 10) / 10,
                  totalDataPoints
                };
              } else {
                return {
                  quarter: name,
                  quarterNumber: index + 1,
                  months: [],
                  avgTemp: 0,
                  avgMaxTemp: 0,
                  avgMinTemp: 0,
                  recordHigh: 0,
                  recordLow: 0,
                  totalDataPoints: 0
                };
              }
            });

            quarterlyResults.push({
              year,
              quarters
            });
          }
        }
      }

      console.log('成功处理季度数据:', quarterlyResults.length, '年');
      quarterlyResults.forEach(result => {
        console.log(`年份 ${result.year} 的${quarterNames[selectedQuarter - 1]}数据:`, result.quarters[selectedQuarter - 1]);
      });
      setData(quarterlyResults);

    } catch (error) {
      console.error('获取季度历史数据失败:', error);
      setError(t('errors.loadingFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      loadQuarterlyData();
    }
  }, [selectedQuarter, yearRange, currentLocation]);

  const handleQuarterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuarter(parseInt(event.target.value));
  };

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

  // 获取选定季度的历史数据
  const selectedQuarterData = data.map(yearData => {
    const quarterData = yearData.quarters[selectedQuarter - 1];
    return {
      year: yearData.year,
      ...quarterData
    };
  }).filter(item => item.months.length > 0);

  // 计算平均值和趋势
  const avgQuarterTemp = selectedQuarterData.length > 0 ?
    Math.round((selectedQuarterData.reduce((sum, d) => sum + d.avgTemp, 0) / selectedQuarterData.length) * 10) / 10 : 0;

  // 计算趋势
  const calculateTrend = (): { trend: 'warming' | 'cooling' | 'stable'; trendValue: number } => {
    if (selectedQuarterData.length < 2) return { trend: 'stable', trendValue: 0 };

    const n = selectedQuarterData.length;
    const years = selectedQuarterData.map(d => d.year);
    const temps = selectedQuarterData.map(d => d.avgTemp);

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

  const { trend, trendValue } = calculateTrend();

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
  const chartData = selectedQuarterData.map(item => ({
    year: item.year,
    recordHigh: item.recordHigh,
    maxTemp: item.avgMaxTemp,
    avgTemp: item.avgTemp,
    minTemp: item.avgMinTemp,
    recordLow: item.recordLow
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('navigation.quarterly')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {t('analysis.quarterlyDescription')}
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
                    {quarterNames[selectedQuarter - 1]}{t('analysis.quarterlyAnalysisSuffix')}
                  </>
                ) : (
                  t('homepage.pleaseSelectLocation')
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {quarterNames[selectedQuarter - 1]}
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
      {!loading && !error && selectedQuarterData.length > 0 && (
        <>
          {/* Chart */}
          <HistoricalTemperatureChart
            data={chartData}
            type="quarterly"
            title={`${quarterNames[selectedQuarter - 1]}${t('analysis.temperatureTrendChart')}`}
            subtitle={t('analysis.showQuarterlyTrendDescription', { quarter: quarterNames[selectedQuarter - 1] })}
            yearRange={yearRange}
          />

          {/* Statistics Summary - 移到图表下方 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quarterNames[selectedQuarter - 1]}{t('weather.avgTempSuffix')}
                  </p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(avgQuarterTemp)}`}>
                    {avgQuarterTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.basedOnYearsData', { years: selectedQuarterData.length })}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.temperatureTrend')}</p>
                  <p className={`text-lg font-semibold ${getTrendColor(trend).split(' ')[0]}`}>
                    {getTrendDescription(trend, trendValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Years */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.dataYears')}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {yearRange.start} - {yearRange.end}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.totalYears', { years: selectedQuarterData.length })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. 控制面板 */}
      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Location Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <QuickLocationSelector compact={false} onLocationChange={loadQuarterlyData} />
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quarter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('time.selectQuarter')}
            </label>
            <select
              value={selectedQuarter}
              onChange={handleQuarterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {quarterNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name} ({quarterMonths[index].join('-')} {t('time.month')})
                </option>
              ))}
            </select>
          </div>

          {/* Year Range */}
          <div>
            <YearRangeSelector
              yearRange={yearRange}
              onChange={handleYearRangeChange}
            />
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
                  - {quarterNames[selectedQuarter - 1]}{t('analysis.quarterlyAnalysisSuffix')}
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
      {!loading && !error && selectedQuarterData.length > 0 && (
        <>
          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Temperature */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quarterNames[selectedQuarter - 1]}{t('weather.avgTempSuffix')}
                  </p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(avgQuarterTemp)}`}>
                    {avgQuarterTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.basedOnYearsData', { years: selectedQuarterData.length })}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.temperatureTrend')}</p>
                  <p className={`text-lg font-semibold ${getTrendColor(trend).split(' ')[0]}`}>
                    {getTrendDescription(trend, trendValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Years */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.dataYears')}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {yearRange.start} - {yearRange.end}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analysis.totalYears', { years: selectedQuarterData.length })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <HistoricalTemperatureChart
            data={chartData}
            type="quarterly"
            title={`${quarterNames[selectedQuarter - 1]}${t('analysis.temperatureTrendChart')}`}
            subtitle={t('analysis.showQuarterlyTrendDescription', { quarter: quarterNames[selectedQuarter - 1] })}
            yearRange={yearRange}
          />

          {/* Detailed Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {quarterNames[selectedQuarter - 1]}{t('analysis.detailedDataTitle', { years: selectedQuarterData.length })}
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
                      {t('weather.quarterlyAvgTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.quarterlyAvgMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.quarterlyAvgMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.quarterlyMaxTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('weather.quarterlyMinTemp')} (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('analysis.dataDays')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedQuarterData.map((item) => (
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
      {!loading && !error && selectedQuarterData.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('app.noData')}
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalQuarterly;