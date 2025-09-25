import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Thermometer, Calendar, Loader, AlertTriangle } from 'lucide-react';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import HistoricalDataTable from './HistoricalDataTable';

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

interface WeatherDataDisplayProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

const WeatherDataDisplay: React.FC<WeatherDataDisplayProps> = ({
  latitude,
  longitude,
  locationName
}) => {
  const { t } = useTranslation();
  const [historicalData, setHistoricalData] = useState<DailyHistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create stable location object using useMemo
  const location = useMemo(() => ({
    id: `${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
    latitude,
    longitude,
    name: locationName,
    country: '',
    timezone: 'UTC'
  }), [latitude, longitude, locationName]);

  // Get today's date for historical comparison - use stable date string
  const todayDateString = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  }, []);

  // Remove unused selectedDate variable - we use todayDateString directly

  // Load historical data
  useEffect(() => {
    // Prevent duplicate calls
    if (dataLoaded || loading) {
      console.log('🚫 跳过重复的API请求:', { dataLoaded, loading });
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const loadDailyHistoricalData = async () => {
      console.log('📊 开始获取地图历史数据:', { latitude, longitude, locationName, date: todayDateString });
      setLoading(true);
      setError(null);

      try {
        // Parse target date from stable string
        const dateObj = new Date(todayDateString);
        const targetMonth = dateObj.getMonth() + 1;
        const targetDay = dateObj.getDate();

        // Use last 20 years as default range
        const startYear = new Date().getFullYear() - 20;

        // Get unified historical data
        console.log(`📅 获取历史数据范围: ${startYear}-01-01 到昨天`);
        const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
          location,
          startYear
        );

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🚫 请求已被取消');
          return;
        }

        // Filter by target date
        const historicalResults = unifiedHistoricalService.filterByDate(
          historicalData,
          targetMonth,
          targetDay
        );

        console.log(`📈 找到 ${historicalResults.length} 年的历史数据:`,
          historicalResults.map(r => r.year).sort());

        // Sort by year (newest first)
        historicalResults.sort((a, b) => b.year - a.year);
        setHistoricalData(historicalResults);
        setDataLoaded(true);

        console.log(`🎯 最终显示 ${historicalResults.length} 年的数据`);

      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('❌ 获取历史同期数据失败:', error);
          setError('获取历史同期数据失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a delay to prevent rapid consecutive calls
    const timeoutId = setTimeout(() => {
      loadDailyHistoricalData();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [latitude, longitude, locationName, todayDateString, dataLoaded, loading]); // 使用稳定的依赖项

  // Reset data when location changes
  useEffect(() => {
    setDataLoaded(false);
    setHistoricalData([]);
    setError(null);
  }, [latitude, longitude, locationName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading', { defaultValue: '加载中...' })}
          </p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('map.weatherDataError', { defaultValue: '无法获取该位置的天气数据' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Location Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {locationName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {t('map.analysisDate', { defaultValue: '分析日期' })}: {todayDateString}
              </span>
            </div>
          </div>
        </div>

        {/* Weather Statistics */}
        {historicalData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {t('homepage.historyAvgTemp', { defaultValue: '历史平均温度' })}
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {(historicalData.reduce((sum, d) => sum + d.avgTemp, 0) / historicalData.length).toFixed(1)}°C
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('homepage.historyAvgMax', { defaultValue: '历史平均最高温' })}
                </h3>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {(historicalData.reduce((sum, d) => sum + d.maxTemp, 0) / historicalData.length).toFixed(1)}°C
              </p>
            </div>

            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                  {t('homepage.historyAvgMin', { defaultValue: '历史平均最低温' })}
                </h3>
              </div>
              <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                {(historicalData.reduce((sum, d) => sum + d.minTemp, 0) / historicalData.length).toFixed(1)}°C
              </p>
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {historicalData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('homepage.dataTable', { count: historicalData.length, defaultValue: '历史同期数据 ({{count}} 年)' })}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('map.historicalDescription', { 
                  date: todayDateString,
                  defaultValue: '{{date}} 的历史天气数据'
                })}
              </p>
            </div>
            <div className="p-6">
              <HistoricalDataTable data={historicalData} />
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!loading && !error && historicalData.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800 dark:text-yellow-200">
                {t('map.noWeatherData', { defaultValue: '该位置暂无历史天气数据' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDataDisplay;