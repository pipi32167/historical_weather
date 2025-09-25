import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { YearRangeSelector } from './common/YearRangeSelector';
import HeatIslandWarning from './common/HeatIslandWarning';
import HourlyForecast from './HourlyForecast';
import { useYearRangeStore } from '../store/yearRangeStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getWeatherConditionKey } from '../utils/weatherUtils';
import { Location } from '../types/weather';
import { useTemperatureDisplay } from '../hooks/useTemperatureDisplay';

interface DailyHistoricalData {
  year: number;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
}

interface CityHistoricalDailyProps {
  location: Location;
}

const CityHistoricalDaily: React.FC<CityHistoricalDailyProps> = ({ location }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<DailyHistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { yearRange } = useYearRangeStore();
  const { formatTemp, displayTemp, formatChartTick, getUnitSymbol } = useTemperatureDisplay();

  const loadDailyHistoricalData = useCallback(async () => {
    if (!location) {
      console.log('⚠️ 无位置信息，跳过API调用');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📊 获取城市历史同期数据:`, { 
        date: selectedDate.toISOString().split('T')[0], 
        location: location.name,
        coords: `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
      });

      const currentDate = new Date();
      const targetMonth = selectedDate.getMonth() + 1;
      const targetDay = selectedDate.getDate();
      const isToday = selectedDate.toDateString() === currentDate.toDateString();

      // 数据获取范围：使用用户选择的年份范围
      const startYear = yearRange.start;

      // 1. 获取统一的历史数据（从startYear-01-01到昨天）
      console.log(`📅 获取历史数据范围: ${startYear}-01-01 到昨天`);
      const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
        location,
        startYear
      );

      // 2. 过滤出目标日期的历史数据
      const historicalResults = unifiedHistoricalService.filterByDate(
        historicalData,
        targetMonth,
        targetDay
      );

      console.log(`📈 找到 ${historicalResults.length} 年的历史数据:`,
        historicalResults.map(r => r.year).sort());

      let processedData: DailyHistoricalData[] = [...historicalResults];

      // 3. 如果查看的是今天，添加今日预报数据
      if (isToday) {
        console.log('📡 获取今日预报数据...');

        const todayForecast = await unifiedHistoricalService.getTodayForecast(location);

        if (todayForecast?.daily?.time?.length > 0) {
          const todayData = todayForecast.daily;
          const maxTemp = todayData.temperature_2m_max?.[0];
          const minTemp = todayData.temperature_2m_min?.[0];

          if (maxTemp != null && minTemp != null && !isNaN(maxTemp) && !isNaN(minTemp)) {
            const currentYear = new Date().getFullYear();
            const windSpeed = todayData.windspeed_10m_max?.[0] || 0;
            const weatherCode = todayData.weather_code?.[0] || 0;

            processedData.unshift({
              year: currentYear,
              date: todayData.time[0],
              maxTemp: Math.round(maxTemp * 10) / 10,
              minTemp: Math.round(minTemp * 10) / 10,
              avgTemp: Math.round((maxTemp + minTemp) / 2 * 10) / 10,
              precipitation: Math.round((todayData.precipitation_sum?.[0] || 0) * 10) / 10,
              windSpeed: Math.round(windSpeed * 10) / 10,
              weatherCode: weatherCode
            });

            console.log(`✅ 添加今日预报数据: ${currentYear}年`, {
              maxTemp, minTemp, avgTemp: (maxTemp + minTemp) / 2
            });
          }
        } else {
          console.warn('⚠️ 今日预报数据不可用');
        }
      }

      // 4. 按年份排序并设置数据
      processedData.sort((a, b) => b.year - a.year);
      setData(processedData);

      console.log(`🎯 最终显示 ${processedData.length} 年的数据`);

    } catch (error) {
      console.error(`❌ 获取历史同期数据失败:`, error);
      setError(t('errors.dataLoadError'));
    } finally {
      setLoading(false);
    }
  }, [location, selectedDate, yearRange.start, t]);

  // 当位置、日期或年份范围变化时加载数据
  useEffect(() => {
    loadDailyHistoricalData();
  }, [loadDailyHistoricalData]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    const isChina = i18n.language.startsWith('zh');
    return format(date, isChina ? 'MM月dd日' : 'MMM dd', { locale: isChina ? zhCN : undefined });
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
    precipitation: item.precipitation,
    windSpeed: item.windSpeed,
    weatherCode: item.weatherCode
  }));

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}{t('time.year')}</p>
          <div className="space-y-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-gray-700 dark:text-gray-300">
                <span
                  className="inline-block w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: entry.color }}
                ></span>
                {entry.name}: {displayTemp(entry.value)}
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
      {/* 1. 当前位置信息和天气预报 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：位置信息 */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 h-full">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-primary-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {location?.name || t('location.notSelected')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(selectedDate)}{t('analysis.historicalSamePeriod')}
                  </p>
                </div>
              </div>
              <div className="text-right mt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(selectedDate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('analysis.analysisDate')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：天气预报 */}
        <div className="lg:col-span-2">
          <HourlyForecast
            latitude={location.latitude}
            longitude={location.longitude}
            className=""
          />
        </div>
      </div>

      {/* 2. 核心图表 */}
      {!loading && !error && currentData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(selectedDate)} {t('analysis.temperatureTrendChart')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('analysis.showTrendDescription', { date: formatDate(selectedDate), years: currentData.length })}
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
                <YAxis tickFormatter={formatChartTick} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) =>
                    value === 'maxTemp' ? t('weather.maxTemp') :
                      value === 'minTemp' ? t('weather.minTemp') : t('weather.avgTemp')
                  }
                />
                <Line
                  type="monotone"
                  dataKey="maxTemp"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('weather.maxTemp')}
                />
                <Line
                  type="monotone"
                  dataKey="avgTemp"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('weather.avgTemp')}
                />
                <Line
                  type="monotone"
                  dataKey="minTemp"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('weather.minTemp')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {currentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Flame className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.historyAvgMax')}</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgMaxTemp)}`}>
                  {displayTemp(avgMaxTemp)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Flame className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.historyAvgMin')}</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgMinTemp)}`}>
                  {displayTemp(avgMinTemp)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Flame className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.historyAvgTemp')}</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgAvgTemp)}`}>
                  {displayTemp(avgAvgTemp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('time.selectDate')}
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('time.currentSelection')}: {formatDate(selectedDate)}
            </p>
          </div>

          {/* Year Range */}
          <div>
            <YearRangeSelector />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(selectedDate)} {t('analysis.historicalDataTitle', { years: currentData.length })}
          </h2>
        </div>

        {loading && (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="p-6">
            <ErrorMessage message={error} onRetry={loadDailyHistoricalData} />
          </div>
        )}

        {!loading && !error && currentData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('time.year')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('time.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.maxTemp')} ({getUnitSymbol()})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.minTemp')} ({getUnitSymbol()})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.avgTemp')} ({getUnitSymbol()})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.precipitation')} (mm)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.windSpeed')} (km/h)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.condition')}
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
                      {formatTemp(item.maxTemp)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.minTemp)}`}>
                      {formatTemp(item.minTemp)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgTemp)}`}>
                      {formatTemp(item.avgTemp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.precipitation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.windSpeed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {t(getWeatherConditionKey(item.weatherCode))}
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
              {t('app.noData')}
            </p>
          </div>
        )}

        {/* 城市热岛效应说明 */}
        {location && <HeatIslandWarning />}
      </div>
    </div>
  );
};

export default CityHistoricalDaily;