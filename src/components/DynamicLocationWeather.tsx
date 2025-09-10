import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import HistoricalWeatherChart from './Charts/HistoricalWeatherChart';
import HistoricalControlsPanel from './Controls/HistoricalControlsPanel';
import HistoricalDataTable from './Tables/HistoricalDataTable';
import ErrorBoundary from './ErrorBoundary';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Location, WeatherDataPoint } from '../types/weather';

const DynamicLocationWeather: React.FC = () => {
  const { coordinates } = useParams<{ coordinates: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentDataForTable, setCurrentDataForTable] = useState<WeatherDataPoint[]>([]);

  // 历史数据控制状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historicalYears, setHistoricalYears] = useState(20);

  const { isOnline, isSlowConnection } = useNetworkStatus();

  const locationName = searchParams.get('name') || '未知位置';

  // 解析坐标信息
  const { latitude, longitude, isValidCoordinates } = useMemo(() => {
    console.log('=== Debugging coordinate parsing ===');
    console.log('Raw coordinates param:', coordinates);
    console.log('Location name param:', locationName);

    if (!coordinates) {
      console.log('No coordinates provided');
      return { latitude: 0, longitude: 0, isValidCoordinates: false };
    }

    try {
      const decodedCoords = decodeURIComponent(coordinates);
      console.log('Decoded coordinates:', decodedCoords);

      const [latStr, lonStr] = decodedCoords.split(',');
      console.log('Split results:', { latStr, lonStr });

      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      console.log('Parsed numbers:', { lat, lon, latIsNaN: isNaN(lat), lonIsNaN: isNaN(lon) });

      if (isNaN(lat) || isNaN(lon)) {
        console.log('Coordinates are NaN');
        return { latitude: 0, longitude: 0, isValidCoordinates: false };
      }

      // 验证坐标范围
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.log('Coordinates out of range');
        return { latitude: 0, longitude: 0, isValidCoordinates: false };
      }

      console.log('Successfully parsed coordinates:', { lat, lon });
      return { latitude: lat, longitude: lon, isValidCoordinates: true };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return { latitude: 0, longitude: 0, isValidCoordinates: false };
    }
  }, [coordinates, locationName]);

  // 创建 Location 对象供控制面板使用
  const currentLocation = useMemo((): Location | null => {
    if (!isValidCoordinates) return null;
    
    return {
      id: `dynamic_${latitude}_${longitude}`,
      name: locationName,
      latitude,
      longitude,
      country: '搜索位置',
      timezone: 'auto'
    };
  }, [latitude, longitude, locationName, isValidCoordinates]);

  // 设置页面标题
  useEffect(() => {
    if (currentLocation) {
      const title = `${currentLocation.name} - 历史天气数据分析`;
      document.title = title;
    }
  }, [currentLocation]);

  // 处理位置变更（跳转到首页进行新搜索）
  const handleLocationChange = () => {
    navigate('/', { replace: true });
  };

  // 处理数据加载完成
  const handleDataLoaded = (data: WeatherDataPoint[]) => {
    setCurrentDataForTable(data);
  };

  const handleError = (error: Error, errorInfo: any) => {
    console.error('DynamicLocationWeather Error:', error, errorInfo);
  };

  // 错误处理
  if (!coordinates || !isValidCoordinates) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">无效的位置参数</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-secondary mb-4">
              提供的坐标格式不正确，请检查URL参数。
            </p>
            <div className="text-left text-sm text-secondary space-y-2">
              <div><strong>URL参数：</strong> <code className="bg-secondary px-2 py-1 rounded">{coordinates || 'undefined'}</code></div>
              <div><strong>解码后：</strong> <code className="bg-secondary px-2 py-1 rounded">{coordinates ? decodeURIComponent(coordinates) : 'N/A'}</code></div>
              <div><strong>位置名：</strong> <code className="bg-secondary px-2 py-1 rounded">{locationName}</code></div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-secondary">
              正确的URL格式应该是：<br />
              <code className="bg-primary px-2 py-1 rounded">/location/纬度,经度?name=城市名</code>
            </p>
            <p className="text-xs text-secondary">
              例如：<code className="bg-secondary px-1 rounded">/location/39.9042,116.4074?name=北京</code>
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div className="space-y-6">
        {/* Location Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-custom rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🗺️</div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {locationName} 历史天气分析
                </h1>
                <p className="text-secondary mt-1">
                  📍 搜索位置 • {latitude.toFixed(4)}°N, {Math.abs(longitude).toFixed(4)}°{longitude >= 0 ? 'E' : 'W'}
                </p>
                <p className="text-xs text-secondary mt-1">
                  🌐 数据来源: Open-Meteo免费天气API
                </p>
              </div>
            </div>

            {/* URL indicator */}
            <div className="text-right">
              <div className="text-sm text-secondary mb-1">当前URL:</div>
              <div className="font-mono text-xs bg-primary border border-custom rounded px-2 py-1">
                /location/{coordinates}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Controls Panel */}
        {currentLocation && (
          <HistoricalControlsPanel
            selectedDate={currentDate}
            selectedLocation={currentLocation}
            selectedRange={historicalYears}
            onDateChange={setCurrentDate}
            onLocationChange={handleLocationChange}
            onRangeChange={setHistoricalYears}
            isLoading={false}
          />
        )}

        {/* Main Historical Weather Chart */}
        <HistoricalWeatherChart
          cityName={locationName}
          latitude={latitude}
          longitude={longitude}
          startDate={currentDate}
          endDate={currentDate}
          years={historicalYears}
          showCurrentWeather={true}
          showStats={true}
          showInsights={true}
          chartHeight={400}
          onDataLoaded={handleDataLoaded}
        />

        {/* Historical Data Table */}
        {currentDataForTable.length > 0 && (
          <HistoricalDataTable
            data={currentDataForTable}
            targetDate={currentDate}
          />
        )}

        {/* Network Status Banner */}
        {!isOnline && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-xl">📡</div>
              <div>
                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  网络连接已断开
                </h4>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  应用将使用缓存数据，连接恢复后自动更新
                </p>
              </div>
            </div>
          </div>
        )}

        {isOnline && isSlowConnection && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-xl">🐌</div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  网络连接较慢
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  数据加载可能需要更长时间
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DynamicLocationWeather;