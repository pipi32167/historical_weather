import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Droplets, Wind, Eye } from 'lucide-react';
import { openMeteoService, HourlyWeatherData } from '../services/openMeteoWeather';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface HourlyForecastProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  latitude,
  longitude,
  className = ''
}) => {
  const { t } = useTranslation();
  const [hourlyData, setHourlyData] = useState<HourlyWeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHourlyForecast = async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const data = await openMeteoService.getTodayHourlyForecast(latitude, longitude);
      setHourlyData(data);
    } catch (err) {
      console.error('获取逐小时预报失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHourlyForecast();
  }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.getHours().toString().padStart(2, '0') + ':00';
  };

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode === 0) return '☀️';
    if (weatherCode <= 3) return '⛅';
    if (weatherCode >= 61 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80 && weatherCode <= 82) return '🌦️';
    if (weatherCode >= 95) return '⛈️';
    return '☁️';
  };

  const getCurrentHourIndex = () => {
    const currentHour = new Date().getHours();
    return hourlyData.findIndex(item => {
      const itemHour = new Date(item.time).getHours();
      return itemHour >= currentHour;
    });
  };

  // 显示从当前时间开始的接下来12小时
  const getDisplayData = () => {
    const currentIndex = getCurrentHourIndex();
    if (currentIndex === -1) return hourlyData.slice(0, 12);
    return hourlyData.slice(currentIndex, currentIndex + 12);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <ErrorMessage message={error} onRetry={loadHourlyForecast} />
      </div>
    );
  }

  if (hourlyData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          {t('weather.todayHourlyForecast')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center">{t('common.noData')}</p>
      </div>
    );
  }

  const displayData = getDisplayData();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        {t('weather.todayHourlyForecast')}
      </h3>
      
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
          {displayData.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center min-w-[80px] p-3 rounded-lg 
                         bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 
                         transition-colors"
            >
              {/* 时间 */}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                {formatTime(item.time)}
              </div>
              
              {/* 天气图标 */}
              <div className="text-2xl mb-2">
                {getWeatherIcon(item.weathercode)}
              </div>
              
              {/* 温度 */}
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {item.temperature}°C
              </div>
              
              {/* 降水概率 */}
              {item.precipitation_probability > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
                  <Droplets className="w-3 h-3" />
                  {item.precipitation_probability}%
                </div>
              )}
              
              {/* 风速 */}
              {item.windspeed > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Wind className="w-3 h-3" />
                  {item.windspeed}km/h
                </div>
              )}
              
              {/* 湿度 */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Eye className="w-3 h-3" />
                {item.humidity}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        {t('weather.forecastDisclaimer')}
      </p>
    </div>
  );
};

export default HourlyForecast;