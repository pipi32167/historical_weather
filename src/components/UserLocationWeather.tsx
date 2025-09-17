import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../hooks/useGeolocation';
import { timezoneService, TimezoneInfo } from '../services/timezoneService';
import HistoricalWeatherChart from './Charts/HistoricalWeatherChart';
import { WeatherDataPoint, Location } from '../types/weather';
import { getDefaultCity } from '../data/cityMappings';

interface UserLocationWeatherProps {
  className?: string;
}

const UserLocationWeather: React.FC<UserLocationWeatherProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userLocationName, setUserLocationName] = useState<string>(t('common.unknownLocation'));
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo | null>(null);

  // 使用地理位置hook
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes cache
  });

  // 默认使用上海作为fallback - 使用与cityMappings完全相同的数据确保一致性
  const fallbackLocation: Location = useMemo(() => getDefaultCity(), []);

  // 创建当前位置的Location对象
  const currentLocation: Location | null = useMemo(() => {
    if (latitude && longitude) {
      return {
        id: `user_location_${latitude}_${longitude}`,
        name: userLocationName,
        latitude,
        longitude,
        country: '用户位置',
        timezone: timezoneInfo?.timezone || 'auto'
      };
    }
    return null;
  }, [latitude, longitude, userLocationName, timezoneInfo]);

  // 获取位置名称和时区信息
  const fetchLocationInfo = useCallback(async (lat: number, lon: number) => {
    try {
      // 获取时区信息
      const timezone = timezoneService.getBestTimezone(lat, lon);
      setTimezoneInfo(timezone);
      
      // 使用反向地理编码获取位置名称
      // 这里可以使用Open-Meteo的geocoding API或其他服务
      // 暂时使用简单的坐标显示
      const locationName = `位置 (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
      setUserLocationName(locationName);
      
      console.log('时区检测结果:', {
        timezone: timezone.timezone,
        offset: timezone.offset,
        source: timezone.source,
        confidence: timezone.confidence,
        display: timezoneService.formatTimezoneDisplay(timezone)
      });
    } catch (error) {
      console.warn('获取位置信息失败:', error);
      setUserLocationName(`位置 (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`);
      // 设置默认时区
      setTimezoneInfo(timezoneService.getBestTimezone());
    }
  }, []);


  // 当获得用户位置时，获取位置信息
  useEffect(() => {
    if (latitude && longitude) {
      fetchLocationInfo(latitude, longitude);
    }
  }, [latitude, longitude, fetchLocationInfo]);

  // 自动获取位置（仅在组件挂载时执行一次）
  useEffect(() => {
    if (!latitude && !longitude && !geoLoading && !geoError) {
      getCurrentPosition();
    }
    
    // 同时获取默认时区信息（基于浏览器）
    if (!timezoneInfo) {
      const defaultTimezone = timezoneService.getBestTimezone();
      setTimezoneInfo(defaultTimezone);
      console.log('默认时区检测结果:', {
        timezone: defaultTimezone.timezone,
        source: defaultTimezone.source,
        confidence: defaultTimezone.confidence,
        display: timezoneService.formatTimezoneDisplay(defaultTimezone)
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const handleViewMore = () => {
    if (currentLocation) {
      const encodedCoords = encodeURIComponent(`${currentLocation.latitude},${currentLocation.longitude}`);
      navigate(`/location/${encodedCoords}?name=${encodeURIComponent(currentLocation.name)}`);
    } else if (geoError) {
      // 如果地理位置失败，跳转到上海
      const encodedCoords = encodeURIComponent(`${fallbackLocation.latitude},${fallbackLocation.longitude}`);
      navigate(`/location/${encodedCoords}?name=${encodeURIComponent(fallbackLocation.name)}`);
    }
  };

  const effectiveLocation = currentLocation || fallbackLocation;
  const isUsingFallback = !currentLocation && geoError;
  
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {geoLoading ? '🔄' : geoError ? '📍' : '🌍'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">
              {geoLoading 
                ? '正在获取您的位置...' 
                : isUsingFallback 
                  ? '上海历史气温数据' 
                  : `${effectiveLocation.name} 历史气温数据`
              }
            </h2>
            <p className="text-sm text-secondary">
              {geoLoading 
                ? '请允许位置权限以获取您当前位置的气温数据'
                : isUsingFallback
                  ? '无法获取您的位置，显示上海的数据作为示例'
                  : `基于您当前位置的历史同期气温分析`
              }
            </p>
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={getCurrentPosition}
            disabled={geoLoading}
            className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors mb-2"
          >
            {geoLoading ? '定位中...' : '📍 重新定位'}
          </button>
          {!geoLoading && (
            <div className="text-xs text-secondary space-y-1">
              <div>📍 {effectiveLocation.latitude.toFixed(4)}°, {effectiveLocation.longitude.toFixed(4)}°</div>
              {timezoneInfo && (
                <div>🕐 {timezoneService.formatTimezoneDisplay(timezoneInfo)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {geoError && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {geoError} - 显示上海数据作为示例
            </span>
          </div>
        </div>
      )}

      {/* Main Historical Temperature Chart */}
      {latitude && longitude ? (
        <div className="space-y-4">
          <HistoricalWeatherChart
            cityName={effectiveLocation.name}
            latitude={effectiveLocation.latitude}
            longitude={effectiveLocation.longitude}
            startDate={new Date()}
            endDate={new Date()}
            years={20}
            showCurrentWeather={true}
            showStats={true}
            showInsights={false} // 简化首页显示，不显示详细洞察
            chartHeight={300}
            className="bg-transparent border-0 p-0"
          />

          {/* View More Button */}
          <div className="text-center pt-4">
            <button
              onClick={handleViewMore}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              查看完整历史数据分析 →
            </button>
          </div>
        </div>
      ) : geoError ? (
        <div className="space-y-4">
          <HistoricalWeatherChart
            cityName={fallbackLocation.name}
            latitude={fallbackLocation.latitude}
            longitude={fallbackLocation.longitude}
            startDate={new Date()}
            endDate={new Date()}
            years={20}
            showCurrentWeather={true}
            showStats={true}
            showInsights={false}
            chartHeight={300}
            className="bg-transparent border-0 p-0"
          />

          {/* View More Button */}
          <div className="text-center pt-4">
            <button
              onClick={handleViewMore}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              查看完整历史数据分析 →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-primary border border-custom rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            正在定位...
          </h3>
          <p className="text-sm text-secondary">
            请允许位置权限以获取您当前位置的气温数据
          </p>
        </div>
      )}
    </div>
  );
};

export default UserLocationWeather;