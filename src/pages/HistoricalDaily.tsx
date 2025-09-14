import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, FireIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { openMeteoService } from '../services/openMeteoWeather';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { useLocationStore } from '../store/locationStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DailyHistoricalData {
  year: number;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitation?: number;
}

const HistoricalDaily: React.FC = () => {
  const [data, setData] = useState<DailyHistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { currentLocation } = useLocationStore();

  const loadDailyHistoricalData = async () => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取历史同期数据:', { date: selectedDate, location: currentLocation });
      
      const results = await openMeteoService.getHistoricalSamePeriod(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedDate,
        20, // 20年历史数据
        currentLocation.timezone
      );

      const processedData: DailyHistoricalData[] = results.map(result => {
        const dailyData = result.data.daily;
        const maxTemp = dailyData.temperature_2m_max[0] || 0;
        const minTemp = dailyData.temperature_2m_min[0] || 0;
        const avgTemp = (maxTemp + minTemp) / 2;
        const precipitation = dailyData.precipitation_sum?.[0] || 0;

        return {
          year: result.year,
          date: dailyData.time[0],
          maxTemp: Math.round(maxTemp * 10) / 10,
          minTemp: Math.round(minTemp * 10) / 10,
          avgTemp: Math.round(avgTemp * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10
        };
      });

      // 按年份排序
      processedData.sort((a, b) => b.year - a.year);
      setData(processedData);

    } catch (error) {
      console.error('获取历史同期数据失败:', error);
      setError('获取历史同期数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyHistoricalData();
  }, [selectedDate, currentLocation]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
  };


  const formatDate = (date: Date) => {
    return format(date, 'MM月dd日', { locale: zhCN });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 15) return 'text-blue-400';
    if (temp < 25) return 'text-green-500';
    if (temp < 35) return 'text-yellow-500';
    return 'text-red-500';
  };

  const currentData = data.length > 0 ? data : [];
  const avgMaxTemp = currentData.length > 0 ? 
    Math.round((currentData.reduce((sum, d) => sum + d.maxTemp, 0) / currentData.length) * 10) / 10 : 0;
  const avgMinTemp = currentData.length > 0 ? 
    Math.round((currentData.reduce((sum, d) => sum + d.minTemp, 0) / currentData.length) * 10) / 10 : 0;
  const avgAvgTemp = currentData.length > 0 ? 
    Math.round((currentData.reduce((sum, d) => sum + d.avgTemp, 0) / currentData.length) * 10) / 10 : 0;

  // 准备图表数据
  const chartData = currentData.map(item => ({
    year: item.year,
    maxTemp: item.maxTemp,
    minTemp: item.minTemp,
    avgTemp: item.avgTemp,
    precipitation: item.precipitation || 0
  }));

  // 计算温度趋势
  const calculateTrend = (data: DailyHistoricalData[], tempType: 'maxTemp' | 'minTemp' | 'avgTemp'): { trend: 'warming' | 'cooling' | 'stable'; trendValue: number } => {
    if (data.length < 2) return { trend: 'stable', trendValue: 0 };

    const n = data.length;
    const years = data.map(d => d.year);
    const temps = data.map(d => d[tempType]);

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

  const avgTempTrend = calculateTrend(currentData, 'avgTemp');
  
  const getTrendIcon = (trend: 'warming' | 'cooling' | 'stable') => {
    switch (trend) {
      case 'warming':
        return '🔥';
      case 'cooling':
        return '❄️';
      case 'stable':
        return '🟢';
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

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}年</p>
          <div className="space-y-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-gray-700 dark:text-gray-300">
                <span 
                  className="inline-block w-3 h-3 rounded mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></span>
                {entry.name}: {entry.value}°C
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CalendarDaysIcon className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            本日历史同期数据
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          查看指定日期在历史年份中的天气表现，分析同期温度变化趋势
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
        <QuickLocationSelector compact={false} onLocationChange={loadDailyHistoricalData} />
      </div>

      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择日期
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              当前选择: {formatDate(selectedDate)}
            </p>
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
                  - {formatDate(selectedDate)}历史同期
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {currentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <FireIcon className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">历史平均最高温</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgMaxTemp)}`}>
                  {avgMaxTemp}°C
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <FireIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">历史平均最低温</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgMinTemp)}`}>
                  {avgMinTemp}°C
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <FireIcon className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">历史平均温度</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgAvgTemp)}`}>
                  {avgAvgTemp}°C
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && currentData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(selectedDate)} 历史同期温度趋势图
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                显示历年{formatDate(selectedDate)}的温度变化趋势 ({currentData.length} 年数据)
              </p>
              {currentData.length > 2 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span>{getTrendIcon(avgTempTrend.trend)}</span>
                  <span className={`font-medium ${
                    avgTempTrend.trend === 'warming' ? 'text-red-600' :
                    avgTempTrend.trend === 'cooling' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {getTrendDescription(avgTempTrend.trend, avgTempTrend.trendValue)}
                  </span>
                </div>
              )}
            </div>
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
                <YAxis tickFormatter={(value) => `${value}°C`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value: string) => 
                    value === 'maxTemp' ? '最高温度' : 
                    value === 'minTemp' ? '最低温度' : '平均温度'
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="maxTemp" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="最高温度"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgTemp" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="平均温度"
                />
                <Line 
                  type="monotone" 
                  dataKey="minTemp" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="最低温度"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(selectedDate)} 历史同期数据 ({currentData.length} 年)
          </h2>
        </div>

        {loading && (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {!loading && !error && currentData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    年份
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    最高温 (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    最低温 (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    平均温 (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    降水量 (mm)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((item) => (
                  <tr key={item.year} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.date}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.maxTemp)}`}>
                      {item.maxTemp}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.minTemp)}`}>
                      {item.minTemp}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgTemp)}`}>
                      {item.avgTemp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.precipitation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && currentData.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              暂无数据
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalDaily;