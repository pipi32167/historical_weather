import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ChartContainer from './Charts/ChartContainer';
import WeatherChart from './Charts/WeatherChart';
import HistoricalControlsPanel from './Controls/HistoricalControlsPanel';
import HistoricalDataTable from './Tables/HistoricalDataTable';
import ErrorBoundary from './ErrorBoundary';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { openMeteoService } from '../services/openMeteoWeather';
import { calculateHistoricalStats, generateHistoricalInsights } from '../utils/historicalDataGenerator';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Location } from '../types/weather';

import { WeatherDataPoint } from '../types/weather';

const DynamicLocationWeather: React.FC = () => {
  const { coordinates } = useParams<{ coordinates: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'heatmap'>('line');
  const [isNLQueryLoading, setIsNLQueryLoading] = useState(false);
  const [currentMetrics] = useState(['temperature']);

  // 历史数据控制状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historicalYears, setHistoricalYears] = useState(20);

  // 数据状态
  const [chartData, setChartData] = useState<WeatherDataPoint[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const { isOnline, isSlowConnection } = useNetworkStatus();

  const locationName = searchParams.get('name') || '未知位置';

  // 简单的时区估算函数
  const getTimezoneFromCoordinates = (lat: number, lon: number): string => {
    // 中国大陆范围
    if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) {
      return 'Asia/Shanghai';
    }
    
    // 根据经度粗略估算时区
    const timezoneOffset = Math.round(lon / 15);
    
    const timezoneMap: Record<number, string> = {
      '-12': 'Pacific/Baker_Island',
      '-11': 'Pacific/Midway',
      '-10': 'Pacific/Honolulu',
      '-9': 'America/Anchorage',
      '-8': 'America/Los_Angeles',
      '-7': 'America/Denver',
      '-6': 'America/Chicago',
      '-5': 'America/New_York',
      '-4': 'America/Halifax',
      '-3': 'America/Argentina/Buenos_Aires',
      '-2': 'Atlantic/South_Georgia',
      '-1': 'Atlantic/Azores',
      '0': 'Europe/London',
      '1': 'Europe/Paris',
      '2': 'Europe/Berlin',
      '3': 'Europe/Moscow',
      '4': 'Asia/Dubai',
      '5': 'Asia/Karachi',
      '6': 'Asia/Dhaka',
      '7': 'Asia/Bangkok',
      '8': 'Asia/Shanghai',
      '9': 'Asia/Tokyo',
      '10': 'Australia/Sydney',
      '11': 'Pacific/Norfolk',
      '12': 'Pacific/Auckland'
    };
    
    return timezoneMap[timezoneOffset] || 'UTC';
  };

  // 创建动态Location对象
  const currentLocation = useMemo((): Location | null => {
    console.log('=== Debugging coordinate parsing ===');
    console.log('Raw coordinates param:', coordinates);
    console.log('Location name param:', locationName);

    if (!coordinates) {
      console.log('No coordinates provided');
      return null;
    }

    try {
      const decodedCoords = decodeURIComponent(coordinates);
      console.log('Decoded coordinates:', decodedCoords);

      const [latStr, lonStr] = decodedCoords.split(',');
      console.log('Split results:', { latStr, lonStr });

      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lonStr);
      console.log('Parsed numbers:', { latitude, longitude, latIsNaN: isNaN(latitude), lonIsNaN: isNaN(longitude) });

      if (isNaN(latitude) || isNaN(longitude)) {
        console.log('Coordinates are NaN, returning null');
        return null;
      }

      // 验证坐标范围
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.log('Coordinates out of range, returning null');
        return null;
      }

      const dynamicLocation: Location = {
        id: `dynamic_${latitude}_${longitude}`,
        name: locationName,
        latitude,
        longitude,
        country: '搜索位置',
        timezone: getTimezoneFromCoordinates(latitude, longitude)
      };

      console.log('Successfully created location:', dynamicLocation);
      return dynamicLocation;
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  }, [coordinates, locationName]);

  // 设置页面标题
  useEffect(() => {
    if (currentLocation) {
      const title = `${currentLocation.name} - 历史天气数据分析`;
      document.title = title;
    }
  }, [currentLocation]);

  // 获取历史同期天气数据
  const fetchHistoricalWeatherData = async () => {
    if (!currentLocation || !openMeteoService.isValidCoordinates(currentLocation.latitude, currentLocation.longitude)) {
      setDataError('无效的坐标信息');
      return;
    }

    setIsDataLoading(true);
    setDataError(null);

    try {
      console.log('开始获取历史天气数据...', {
        location: currentLocation.name,
        coordinates: [currentLocation.latitude, currentLocation.longitude],
        date: currentDate,
        years: historicalYears
      });

      // 获取多年同期数据
      const historicalData = await openMeteoService.getHistoricalSamePeriod(
        currentLocation.latitude,
        currentLocation.longitude,
        currentDate,
        historicalYears,
        currentLocation.timezone
      );

      console.log('收到历史天气数据:', historicalData);

      // 转换为应用内部格式
      const transformedData: WeatherDataPoint[] = historicalData.map(({ year, data }) => {
        const firstDay = data.daily.time[0];
        const maxTemp = data.daily.temperature_2m_max[0] || 0;
        const minTemp = data.daily.temperature_2m_min[0] || 0;
        const avgTemp = (maxTemp + minTemp) / 2;
        const precipitation = data.daily.precipitation_sum?.[0] || 0;

        return {
          timestamp: firstDay,
          date: firstDay,
          temperature: avgTemp,
          temperatureMax: maxTemp,
          temperatureMin: minTemp,
          humidity: 50, // Open-Meteo历史数据默认不包含湿度，使用默认值
          pressure: 1013.25, // 默认海平面气压
          windSpeed: 0, // 默认无风
          windDirection: 0, // 默认风向
          precipitation: precipitation,
          weatherCondition: '历史数据', // 默认天气状况
          location: currentLocation.name,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        };
      }).filter(point => point.date); // 过滤掉无效数据

      console.log('转换后的数据:', transformedData);

      setChartData(transformedData);

      if (transformedData.length === 0) {
        setDataError('暂无该日期的历史数据');
      }
    } catch (error) {
      console.error('获取历史天气数据失败:', error);
      setDataError(error instanceof Error ? error.message : '获取天气数据失败');
    } finally {
      setIsDataLoading(false);
    }
  };

  // 当位置或日期改变时重新获取数据
  useEffect(() => {
    if (currentLocation && isOnline) {
      fetchHistoricalWeatherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, currentDate, historicalYears, isOnline]);

  const isLoading = isDataLoading || isNLQueryLoading;

  // 处理位置变更（跳转到首页进行新搜索）
  const handleLocationChange = (newLocation: Location) => {
    navigate('/', { replace: true });
  };

  // 处理自然语言查询
  const handleNLQuery = async (query: string) => {
    setIsNLQueryLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Processing query:', query);
    setIsNLQueryLoading(false);
  };

  // 重新获取数据
  const refetch = () => {
    if (currentLocation && isOnline) {
      fetchHistoricalWeatherData();
    }
  };

  // 计算历史统计数据
  const historicalStats = useMemo(() => {
    return calculateHistoricalStats(chartData);
  }, [chartData]);

  // 生成历史洞察
  const historicalInsights = useMemo(() => {
    if (historicalStats) {
      return generateHistoricalInsights(chartData, historicalStats, currentDate);
    }
    return [];
  }, [chartData, historicalStats, currentDate]);

  // 图表标题和副标题
  const chartTitle = currentLocation ? `${currentLocation.name}历史同期数据 - ${format(currentDate, 'MM月dd日', { locale: zhCN })}` : '历史同期数据';
  const chartSubtitle = currentLocation ? `过去${historicalYears}年 ${format(currentDate, 'MM月dd日', { locale: zhCN })} 的温度变化 • ${chartData.length} 个数据点` : '';

  const handleError = (error: Error, errorInfo: any) => {
    console.error('DynamicLocationWeather Error:', error, errorInfo);
  };

  console.log('Rendering DynamicLocationWeather with:', {
    currentLocation,
    currentDate,
    historicalYears,
    isLoading,
    dataError,
    chartData,
    historicalStats,
    historicalInsights
  });
  // 错误处理
  if (!coordinates || !currentLocation) {
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
                  {currentLocation.name} 历史天气分析
                </h1>
                <p className="text-secondary mt-1">
                  📍 {currentLocation.country} • {currentLocation.latitude.toFixed(4)}°N, {Math.abs(currentLocation.longitude).toFixed(4)}°{currentLocation.longitude >= 0 ? 'E' : 'W'}
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
        <HistoricalControlsPanel
          selectedDate={currentDate}
          selectedLocation={currentLocation}
          selectedRange={historicalYears}
          onDateChange={setCurrentDate}
          onLocationChange={handleLocationChange}
          onRangeChange={setHistoricalYears}
          isLoading={isLoading}
        />

        {/* Main Chart */}
        <ChartContainer
          title={chartTitle}
          subtitle={chartSubtitle}
          chartType={chartType}
          onChartTypeChange={setChartType}
          showTemperatureMode={true}
          onDownload={() => {
            console.log('Download data:', chartData);
          }}
          onSettings={() => {
            refetch();
          }}
          isLoading={isLoading}
        >
          <WeatherChart
            data={chartData}
            type={chartType === 'heatmap' ? 'area' : chartType}
            metrics={currentMetrics}
            height={400}
            showGrid={true}
            showLegend={true}
          />
        </ChartContainer>

        {/* Data Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {historicalStats && [
            {
              title: '历史平均温度',
              value: `${historicalStats.avgTemperature}°C`,
              change: historicalStats.temperatureTrend > 0
                ? `+${historicalStats.temperatureTrend.toFixed(2)}°C/年`
                : `${historicalStats.temperatureTrend.toFixed(2)}°C/年`,
              changeType: historicalStats.temperatureTrend > 0 ? 'positive' as const : 'negative' as const
            },
            {
              title: '温度范围',
              value: `${historicalStats.temperatureRange}°C`,
              change: `${historicalStats.minTemperature}°C ~ ${historicalStats.maxTemperature}°C`,
              changeType: 'neutral' as const
            },
            {
              title: '历史平均湿度',
              value: `${historicalStats.avgHumidity}%`,
              change: '20年平均',
              changeType: 'neutral' as const
            },
            {
              title: '数据年份',
              value: `${historicalStats.dataPoints}年`,
              change: `${format(currentDate, 'yyyy年', { locale: zhCN })} - ${format(new Date(currentDate.getFullYear() - 19, currentDate.getMonth(), currentDate.getDate()), 'yyyy年', { locale: zhCN })}`,
              changeType: 'neutral' as const
            },
          ].map((stat, index) => (
            <div key={index} className="bg-primary border border-custom rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-secondary">{stat.title}</h4>
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className={`text-xs flex items-center ${stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' : 'text-secondary'
                }`}>
                <span>{stat.change}</span>
                <span className="ml-1">较去年同期</span>
              </div>
            </div>
          ))}
        </div>

        {/* Historical Insights */}
        {historicalInsights.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {format(currentDate, 'MM月dd日', { locale: zhCN })} 历史数据洞察
                </h3>
                <p className="text-sm text-secondary">
                  基于{currentLocation.name}过去{historicalYears}年同期数据的分析结果
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {historicalInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg">
                  <div className="text-lg flex-shrink-0">
                    {insight.includes('上升') ? '📈' :
                      insight.includes('下降') ? '📉' :
                        insight.includes('最热') ? '🔥' :
                          insight.includes('温差') ? '🌡️' :
                            insight.includes('湿度') ? '💧' : '📊'}
                  </div>
                  <p className="text-sm text-primary leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-custom">
              <p className="text-xs text-secondary text-center">
                💡 通过搜索功能查找其他地点的历史天气数据 | 数据来源: Open-Meteo
              </p>
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {chartData.length > 0 && !dataError && (
          <HistoricalDataTable
            data={chartData}
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

        {/* Error Message */}
        {dataError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="text-2xl">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                数据加载失败
              </h3>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">
              {dataError}
              {!isOnline && ' (网络连接不可用)'}
            </p>
            <button
              onClick={refetch}
              disabled={!isOnline}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              {isOnline ? '重新加载' : '网络连接后重试'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isDataLoading && !dataError && (
          <div className="bg-primary border border-custom rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              正在加载{currentLocation.name}历史数据...
            </h3>
            <p className="text-secondary mb-4">
              正在分析{format(currentDate, 'MM月dd日', { locale: zhCN })}过去{historicalYears}年的天气变化
            </p>
            <div className="flex justify-center space-x-2 mt-2">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                🌐 Open-Meteo 免费API
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                📡 80年历史数据
              </span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                🎛️ 无需API密钥
              </span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DynamicLocationWeather;