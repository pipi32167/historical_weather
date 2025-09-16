import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HistoricalWeatherChart from './Charts/HistoricalWeatherChart';
import HistoricalControlsPanel from './Controls/HistoricalControlsPanel';
import HistoricalDataTable from './Tables/HistoricalDataTable';
import MonthlyTemperatureAnalysis from './MonthlyTemperatureAnalysis';
import ErrorBoundary from './ErrorBoundary';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getCityByName, getDefaultCity } from '../data/cityMappings';
import { Location, WeatherDataPoint } from '../types/weather';

const CityWeather: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();

  const [currentDataForTable, setCurrentDataForTable] = useState<WeatherDataPoint[]>([]);

  // 历史数据控制状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historicalYears, setHistoricalYears] = useState(20);

  const { isOnline, isSlowConnection } = useNetworkStatus();

  // 根据URL参数获取当前城市
  const currentLocation = useMemo((): Location => {
    if (!cityName) {
      return getDefaultCity();
    }

    const city = getCityByName(cityName);
    if (!city) {
      // 如果城市不支持，返回默认城市，在useEffect中处理重定向
      return getDefaultCity();
    }

    return city;
  }, [cityName]);

  // 处理无效城市的重定向
  useEffect(() => {
    if (cityName && !getCityByName(cityName)) {
      const defaultCity = getDefaultCity();
      navigate(`/${defaultCity.id}`, { replace: true });
    }
  }, [cityName, navigate]);

  // 设置页面标题
  useEffect(() => {
    const title = `${currentLocation.name} - 历史气温数据分析`;
    document.title = title;
  }, [currentLocation]);


  // 处理城市切换 - 使用 useCallback 避免重复创建
  const handleLocationChange = React.useCallback((newLocation: Location) => {
    navigate(`/${newLocation.id}`, { replace: true });
  }, [navigate]);

  // 处理数据加载完成 - 使用 useCallback 避免重复创建
  const handleDataLoaded = React.useCallback((data: WeatherDataPoint[]) => {
    setCurrentDataForTable(data);
  }, []);

  const handleError = (error: Error, errorInfo: any) => {
    console.error('CityWeather Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <div className="space-y-6">
        {/* City Header */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🌍</div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {currentLocation.name} 历史气温分析
                </h1>
                <p className="text-secondary mt-1">
                  📍 {currentLocation.country} • {currentLocation.latitude.toFixed(4)}°N, {Math.abs(currentLocation.longitude).toFixed(4)}°{currentLocation.longitude >= 0 ? 'E' : 'W'}
                </p>
              </div>
            </div>

            {/* URL indicator */}
            <div className="text-right">
              <div className="text-sm text-secondary mb-1">当前URL:</div>
              <div className="font-mono text-xs bg-primary border border-custom rounded px-2 py-1">
                /{currentLocation.id}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Controls Panel */}
        <HistoricalControlsPanel
          selectedDate={currentDate}
          selectedLocation={currentLocation}
          selectedRange={historicalYears}
          onDateChange={setCurrentDate}
          onLocationChange={handleLocationChange}
          onRangeChange={setHistoricalYears}
          isLoading={false}
        />

        {/* Natural Language Query Interface */}
        {/* <NaturalLanguageQuery 
          onSubmit={handleNLQuery}
          isLoading={false}
        /> */}

        {/* Main Historical Temperature Chart */}
        <HistoricalWeatherChart
          cityName={currentLocation.name}
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
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

        {/* Monthly Temperature Analysis */}
        <MonthlyTemperatureAnalysis 
          location={currentLocation}
          defaultMode="monthly-trends"
          defaultMonth={currentDate.getMonth() + 1}
          defaultStartYear={new Date().getFullYear() - 15}
          defaultEndYear={new Date().getFullYear() - 1}
        />

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

export default CityWeather;