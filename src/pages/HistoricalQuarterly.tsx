import React, { useState, useEffect } from 'react';
import { ChartBarSquareIcon, MapPinIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { MonthlyTemperatureStats } from '../services/monthlyTemperatureService';
import { openMeteoService } from '../services/openMeteoWeather';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { useLocationStore } from '../store/locationStore';

interface QuarterlyData {
  quarter: string;
  quarterNumber: number;
  months: MonthlyTemperatureStats[];
  avgTemp: number;
  avgMaxTemp: number;
  avgMinTemp: number;
  totalDataPoints: number;
}

interface QuarterlyYearData {
  year: number;
  quarters: QuarterlyData[];
}

const HistoricalQuarterly: React.FC = () => {
  const [data, setData] = useState<QuarterlyYearData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [yearRange, setYearRange] = useState({ start: 2014, end: 2024 });
  const { currentLocation } = useLocationStore();

  const quarterNames = ['第一季度', '第二季度', '第三季度', '第四季度'];
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
      console.log('获取季度历史数据（优化版本，一次API调用）:', { quarter: selectedQuarter, yearRange, location: currentLocation });
      
      const quarterlyResults: QuarterlyYearData[] = [];
      
      // 获取当前季度的所有月份
      const currentQuarterMonths = quarterMonths[selectedQuarter - 1];
      
      // 只进行一次API调用，获取整个日期范围的数据
      const startDate = `${yearRange.start}-01-01`;
      const endDate = `${yearRange.end}-12-31`;
      
      console.log(`[HistoricalQuarterly] 获取日期范围数据: ${startDate} 到 ${endDate}`);
      
      const historicalData = await openMeteoService.getHistoricalWeather(
        currentLocation.latitude,
        currentLocation.longitude,
        startDate,
        endDate,
        currentLocation.timezone,
        ['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean']
      );
      
      console.log(`[HistoricalQuarterly] 获取到 ${historicalData.daily.time.length} 天的数据`);
      
      // 按年份和月份分组数据
      const dataByYearMonth: Record<string, Array<{
        date: string;
        maxTemp: number;
        minTemp: number;
        avgTemp: number;
      }>> = {};
      
      historicalData.daily.time.forEach((time, index) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // 只处理当前季度的月份
        if (currentQuarterMonths.includes(month)) {
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
        }
      });
      
      // 按年份组织数据
      const yearDataMap: Record<number, Record<number, {
        avgTemp: number;
        avgMaxTemp: number;
        avgMinTemp: number;
        dataPoints: number;
      }>> = {};
      
      for (const [key, monthData] of Object.entries(dataByYearMonth)) {
        const [year, month] = key.split('-').map(Number);
        
        if (monthData.length > 0) {
          if (!yearDataMap[year]) {
            yearDataMap[year] = {};
          }
          
          const avgTemp = monthData.reduce((sum, d) => sum + d.avgTemp, 0) / monthData.length;
          const avgMaxTemp = monthData.reduce((sum, d) => sum + d.maxTemp, 0) / monthData.length;
          const avgMinTemp = monthData.reduce((sum, d) => sum + d.minTemp, 0) / monthData.length;
          
          yearDataMap[year][month] = {
            avgTemp: Math.round(avgTemp * 10) / 10,
            avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
            avgMinTemp: Math.round(avgMinTemp * 10) / 10,
            dataPoints: monthData.length
          };
        }
      }
      
      // 为每年生成季度数据
      for (let year = yearRange.start; year <= yearRange.end; year++) {
        const yearMonthData = yearDataMap[year];
        
        if (yearMonthData && Object.keys(yearMonthData).length > 0) {
          // 获取当前季度的所有月份数据
          const quarterData = currentQuarterMonths
            .map(month => yearMonthData[month])
            .filter(data => data !== undefined);
          
          if (quarterData.length > 0) {
            // 计算季度平均值
            const avgTemp = quarterData.reduce((sum, month) => sum + month.avgTemp, 0) / quarterData.length;
            const avgMaxTemp = quarterData.reduce((sum, month) => sum + month.avgMaxTemp, 0) / quarterData.length;
            const avgMinTemp = quarterData.reduce((sum, month) => sum + month.avgMinTemp, 0) / quarterData.length;
            const totalDataPoints = quarterData.reduce((sum, month) => sum + month.dataPoints, 0);
            
            // 创建季度数据（只创建当前选中的季度）
            const quarters: QuarterlyData[] = quarterNames.map((name, index) => {
              if (index === selectedQuarter - 1) {
                // 为当前季度创建模拟MonthlyTemperatureStats数据
                const monthStats = currentQuarterMonths.map(month => {
                  const monthData = yearMonthData[month];
                  if (monthData) {
                    return {
                      year,
                      month,
                      monthName: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][month - 1],
                      avgTemp: monthData.avgTemp,
                      avgMaxTemp: monthData.avgMaxTemp,
                      avgMinTemp: monthData.avgMinTemp,
                      recordHigh: monthData.avgMaxTemp, // 简化处理
                      recordLow: monthData.avgMinTemp,   // 简化处理
                      totalDays: new Date(year, month, 0).getDate(),
                      dataPoints: monthData.dataPoints,
                      location: currentLocation.name,
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude
                    };
                  }
                  return null;
                }).filter(Boolean) as MonthlyTemperatureStats[];
                
                return {
                  quarter: name,
                  quarterNumber: index + 1,
                  months: monthStats,
                  avgTemp: Math.round(avgTemp * 10) / 10,
                  avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
                  avgMinTemp: Math.round(avgMinTemp * 10) / 10,
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
      setError('获取季度历史数据失败，请稍后重试');
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
  const chartData = selectedQuarterData.map(item => ({
    year: item.year,
    avgTemp: item.avgTemp,
    maxTemp: item.avgMaxTemp,
    minTemp: item.avgMinTemp
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ChartBarSquareIcon className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            本季度历史同期数据
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          分析指定季度在多年中的温度变化趋势，了解季节性气候特征和长期变化规律
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
        <QuickLocationSelector compact={false} onLocationChange={loadQuarterlyData} />
      </div>

      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quarter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择季度
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
                  {name} ({quarterMonths[index].join('-')}月)
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
                max="2024"
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
                max="2024"
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
                  - {quarterNames[selectedQuarter - 1]}分析
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
                  <ChartBarSquareIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quarterNames[selectedQuarter - 1]}平均温度
                  </p>
                  <p className={`text-2xl font-bold ${getTemperatureColor(avgQuarterTemp)}`}>
                    {avgQuarterTemp}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    基于 {selectedQuarterData.length} 年数据
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">温度趋势</p>
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
                  <ChartBarSquareIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">数据年份</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {yearRange.start} - {yearRange.end}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    共 {selectedQuarterData.length} 年
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {quarterNames[selectedQuarter - 1]}温度趋势图 ({yearRange.start}-{yearRange.end})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                显示历年{quarterNames[selectedQuarter - 1]}的平均温度变化趋势
              </p>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                      name === 'avgTemp' ? '平均温度' : 
                      name === 'maxTemp' ? '最高温度' : '最低温度'
                    ]}
                  />
                  <Legend 
                    formatter={(value: string) => 
                      value === 'avgTemp' ? '平均温度' : 
                      value === 'maxTemp' ? '最高温度' : '最低温度'
                    }
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
                    dataKey="maxTemp" 
                    stroke="#ef4444" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minTemp" 
                    stroke="#3b82f6" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {quarterNames[selectedQuarter - 1]}详细数据 ({selectedQuarterData.length} 年)
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
                      包含月份
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      数据天数
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.months.map(m => m.monthName).join(', ')}
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
            暂无数据
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalQuarterly;