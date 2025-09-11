import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, FireIcon } from '@heroicons/react/24/outline';
import { openMeteoService } from '../services/openMeteoWeather';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
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
  const [location, setLocation] = useState({ latitude: 39.9042, longitude: 116.4074, name: '北京' });

  const loadDailyHistoricalData = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      console.log('获取历史同期数据:', { date: selectedDate, location });
      
      const results = await openMeteoService.getHistoricalSamePeriod(
        location.latitude,
        location.longitude,
        selectedDate,
        20, // 20年历史数据
        'auto'
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
  }, [selectedDate, location]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
  };

  const handleLocationChange = (newLocation: { latitude: number; longitude: number; name: string }) => {
    setLocation(newLocation);
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

          {/* Location Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              当前位置
            </label>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <MapPinIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">{location.name}</span>
              <span className="text-gray-500 text-sm">
                ({location.latitude.toFixed(2)}, {location.longitude.toFixed(2)})
              </span>
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