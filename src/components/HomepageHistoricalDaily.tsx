import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { unifiedHistoricalService } from '../services/unifiedHistoricalService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { QuickLocationSelector } from './common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from './common/AnalysisTypeSwitcher';
import { YearRangeSelector } from './common/YearRangeSelector';
import { useYearRangeStore } from '../store/yearRangeStore';
import { useLocationStore } from '../store/locationStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { osmGeocodingService } from '../services/osmGeocodingService';
import { useHomePageTitle } from '../hooks/usePageTitle';
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

const HomepageHistoricalDaily: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // 设置页面标题
  useHomePageTitle();
  const [data, setData] = useState<DailyHistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { yearRange } = useYearRangeStore();
  const [currentLocationCity, setCurrentLocationCity] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [skipGeolocation, setSkipGeolocation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetryReached, setMaxRetryReached] = useState(false);

  const { currentLocation, setCurrentLocation } = useLocationStore();
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition
  } = useGeolocation();

  // Initial state logging and cache cleanup
  useEffect(() => {
    console.log('🚀 HomepageHistoricalDaily component mounted');
    console.log('📦 Initial state:', {
      currentLocation: currentLocation?.name || 'null',
      locationInitialized,
      skipGeolocation,
      latitude,
      longitude,
      geoError: !!geoError,
      geoLoading
    });

    // 清理过期的OSM缓存
    osmGeocodingService.cleanExpiredCache();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reverse geocoding function using OSM service
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string | null> => {
    // 获取当前语言设置
    const currentLanguage = i18n.language || 'zh-CN';
    const languageParam = osmGeocodingService.getLanguageParam(currentLanguage);

    return await osmGeocodingService.reverseGeocode(lat, lon, {
      language: languageParam,
      zoom: 10,
      enableCache: true,
      cacheTime: 24 * 60 * 60 * 1000 // 24小时缓存
    });
  }, [i18n.language]);

  // Initialize location on component mount
  useEffect(() => {
    console.log('🔧 Location initialization effect triggered:', {
      locationInitialized,
      skipGeolocation,
      hasCurrentLocation: !!currentLocation,
      currentLocationName: currentLocation?.name
    });

    // Always try to get user's current location first, unless explicitly skipped
    if (!locationInitialized && !skipGeolocation) {
      console.log('🌍 尝试获取用户当前位置...');
      setLocationLoading(true);

      // Check if browser supports geolocation
      if (!navigator.geolocation) {
        console.log('❌ 浏览器不支持地理位置');
        setSkipGeolocation(true);
        setLocationLoading(false);
        if (currentLocation) {
          console.log('🏠 使用默认位置:', currentLocation.name);
          setLocationInitialized(true);
        }
        return;
      }

      getCurrentPosition();

      // Set a timeout to fallback to default location if geolocation takes too long
      const timeoutId = setTimeout(() => {
        if (!locationInitialized) {
          console.log('⏰ 位置获取超时，使用默认位置');
          if (currentLocation) {
            console.log('🏠 回退使用已有位置:', currentLocation.name);
            setLocationInitialized(true);
          }
          setSkipGeolocation(true);
          setLocationLoading(false);
        }
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeoutId);
    } else if (!locationInitialized && currentLocation) {
      // If geolocation is skipped and we have a default location, use it
      console.log('🏠 使用默认位置:', currentLocation.name);
      setLocationInitialized(true);
    }
  }, [getCurrentPosition, locationInitialized, skipGeolocation, currentLocation]);

  // Handle geolocation result
  useEffect(() => {
    console.log('🔍 Geolocation effect triggered:', {
      locationInitialized,
      latitude,
      longitude,
      geoError: !!geoError,
      geoLoading
    });

    if (!locationInitialized && latitude && longitude && !geoError) {
      console.log('📍 获取到位置坐标:', { latitude, longitude });
      setLocationLoading(true);
      setIsUsingCurrentLocation(true);

      // Use an async function to handle the geocoding
      (async () => {
        try {
          console.log('🏙️ 正在反向地理编码获取城市名称...');
          const cityName = await reverseGeocode(latitude, longitude);
          console.log('🏙️ 获取到城市名称:', cityName);
          setCurrentLocationCity(cityName);

          // Set location in store
          const location = {
            id: 'current-location',
            name: cityName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
            country: '',
            timezone: 'auto'
          };

          setCurrentLocation(location);
          setLocationInitialized(true);
          console.log('✅ 位置设置完成:', location.name);
        } catch (error) {
          console.error('Failed to process current location:', error);
          setError(t('errors.locationError'));
          setSkipGeolocation(true);
          setLocationInitialized(true);
        } finally {
          setLocationLoading(false);
        }
      })();
    } else if (!locationInitialized && geoError) {
      console.log('❌ 地理位置获取失败:', geoError);
      setLocationLoading(false);
      setIsUsingCurrentLocation(false);
      setSkipGeolocation(true);
      // Initialize with default location if available
      if (currentLocation) {
        console.log('🏠 回退使用默认位置:', currentLocation.name);
        setLocationInitialized(true);
      }
    }
  }, [latitude, longitude, geoError, locationInitialized, reverseGeocode, setCurrentLocation, t, currentLocation, geoLoading]);

  const loadDailyHistoricalData = useCallback(async (isRetry: boolean = false) => {
    if (!currentLocation || !locationInitialized) {
      console.log('⚠️ 位置未初始化，跳过API调用');
      return;
    }

    // Check if max retry reached
    if (maxRetryReached) {
      console.log('❌ 已达到最大重试次数，停止重试');
      setError(t('errors.maxRetryMessage'));
      return;
    }

    setLoading(true);
    if (!isRetry) {
      setError(null);
      setRetryCount(0);
    }

    try {
      const currentRetry = isRetry ? retryCount : 0;
      console.log(`📊 获取历史同期数据 (尝试 ${currentRetry + 1}/4):`, { date: selectedDate, location: currentLocation });

      const currentDate = new Date();
      const targetMonth = selectedDate.getMonth() + 1;
      const targetDay = selectedDate.getDate();
      const isToday = selectedDate.toDateString() === currentDate.toDateString();

      // 数据获取范围：使用用户选择的年份范围
      const startYear = yearRange.start;

      // 1. 获取统一的历史数据（从startYear-01-01到昨天）
      console.log(`📅 获取历史数据范围: ${startYear}-01-01 到昨天`);
      const historicalData = await unifiedHistoricalService.getUnifiedHistoricalData(
        currentLocation,
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

        const todayForecast = await unifiedHistoricalService.getTodayForecast(currentLocation);

        if (todayForecast?.daily?.time?.length > 0) {
          const todayData = todayForecast.daily;
          const maxTemp = todayData.temperature_2m_max?.[0];
          const minTemp = todayData.temperature_2m_min?.[0];

          if (maxTemp != null && minTemp != null && !isNaN(maxTemp) && !isNaN(minTemp)) {
            const currentYear = new Date().getFullYear();

            processedData.unshift({
              year: currentYear,
              date: todayData.time[0],
              maxTemp: Math.round(maxTemp * 10) / 10,
              minTemp: Math.round(minTemp * 10) / 10,
              avgTemp: Math.round((maxTemp + minTemp) / 2 * 10) / 10,
              precipitation: Math.round((todayData.precipitation_sum?.[0] || 0) * 10) / 10
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

      // Reset retry state on success
      setRetryCount(0);
      setMaxRetryReached(false);

    } catch (error) {
      const currentRetry = isRetry ? retryCount : 0;
      console.error(`❌ 获取历史同期数据失败 (尝试 ${currentRetry + 1}/4):`, error);

      if (currentRetry < 3) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, currentRetry) * 1000; // 1s, 2s, 4s
        console.log(`⏳ ${retryDelay / 1000}秒后重试...`);

        setRetryCount(currentRetry + 1);
        setError(t('errors.retryMessage', { current: currentRetry + 1, max: 3 }));

        setTimeout(() => {
          loadDailyHistoricalData(true);
        }, retryDelay);
      } else {
        // Max retries reached
        setMaxRetryReached(true);
        setError(t('errors.maxRetryMessage'));
        console.error('🚫 已达到最大重试次数 (3次)');
      }
    } finally {
      if (!isRetry || retryCount >= 3) {
        setLoading(false);
      }
    }
  }, [currentLocation, locationInitialized, selectedDate, yearRange, maxRetryReached, retryCount, t]);

  useEffect(() => {
    // Reset retry state when location or date changes
    setRetryCount(0);
    setMaxRetryReached(false);

    // Only load data after location is initialized
    if (locationInitialized && currentLocation) {
      console.log('🚀 位置已初始化，开始加载历史气温数据');
      loadDailyHistoricalData();
    } else {
      console.log('⏳ 等待位置初始化...', { locationInitialized, hasLocation: !!currentLocation });
    }
  }, [selectedDate, yearRange, currentLocation, locationInitialized, loadDailyHistoricalData]);

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
        return t('analysis.warmingTrend', { value: Math.abs(trendValue).toFixed(3) });
      case 'cooling':
        return t('analysis.coolingTrend', { value: trendValue.toFixed(3) });
      case 'stable':
        return t('analysis.stableTemperature');
    }
  };

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
          <Calendar className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('homepage.title')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('homepage.description')}
        </p>

        {/* SEO优化内容 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('homepage.banner.historicalTrendAnalysis')}</p>
                <p className="text-gray-600 dark:text-gray-300">{t('homepage.banner.temperatureChangeComparison')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌍</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('homepage.banner.globalCityTemperatureData')}</p>
                <p className="text-gray-600 dark:text-gray-300">{t('homepage.banner.supportAnyLocationQuery')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('homepage.banner.professionalDataVisualization')}</p>
                <p className="text-gray-600 dark:text-gray-300">{t('homepage.banner.openMeteoAuthoritativeDataSource')}</p>
              </div>
            </div>
          </div>
        </div>
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
                    {formatDate(selectedDate)}{t('analysis.historicalSamePeriod')}
                    {isUsingCurrentLocation && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {locationLoading || geoLoading ? t('location.detecting') : t('homepage.currentLocation')}
                      </span>
                    )}
                  </>
                ) : (
                  t('homepage.pleaseSelectLocation')
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(selectedDate)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('analysis.analysisDate')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. 核心图表 */}
      {/* Chart */}
      {!loading && !error && currentData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(selectedDate)} {t('analysis.temperatureTrendChart')}
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('analysis.showTrendDescription', { date: formatDate(selectedDate), years: currentData.length })}
              </p>
              {currentData.length > 2 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span>{getTrendIcon(avgTempTrend.trend)}</span>
                  <span className={`font-medium ${avgTempTrend.trend === 'warming' ? 'text-red-600' :
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

      {/* Statistics Summary - 移到图表下方 */}
      {currentData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Flame className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.historyAvgMax')}</p>
                <p className={`text-2xl font-bold ${getTemperatureColor(avgMaxTemp)}`}>
                  {avgMaxTemp}°C
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
                  {avgMinTemp}°C
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
                  {avgAvgTemp}°C
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 控制面板 */}
      {/* Analysis Type Switcher */}
      <AnalysisTypeSwitcher />

      {/* Location Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <QuickLocationSelector
          compact={false}
          defaultCollapsed={true}
          onLocationChange={() => {
            setIsUsingCurrentLocation(false);
            setLocationInitialized(true);
            // Data will be loaded automatically by the useEffect above
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('time.currentSelection')}: {formatDate(selectedDate)}
            </p>
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
                  - {formatDate(selectedDate)}{t('analysis.historicalSamePeriod')}
                </span>
              )}
            </div>
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

        {(loading || !locationInitialized) && (
          <div className="p-8">
            <LoadingSpinner />
            {!locationInitialized && (
              <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
                {t('homepage.initializingLocation')}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="p-6">
            <ErrorMessage message={error} />
            {maxRetryReached && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setRetryCount(0);
                    setMaxRetryReached(false);
                    setError(null);
                    loadDailyHistoricalData();
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                           focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                           transition-colors duration-200"
                >
                  {t('errors.manualRetry')}
                </button>
              </div>
            )}
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
                    {t('weather.maxTemp')} (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.minTemp')} (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.avgTemp')} (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weather.precipitation')} (mm)
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

        {!loading && !error && locationInitialized && currentData.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t('app.noData')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomepageHistoricalDaily;