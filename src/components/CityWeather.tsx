import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChartContainer from './Charts/ChartContainer';
import WeatherChart from './Charts/WeatherChart';
import NaturalLanguageQuery from './Query/NaturalLanguageQuery';
import HistoricalControlsPanel from './Controls/HistoricalControlsPanel';
import HistoricalDataTable from './Tables/HistoricalDataTable';
import ErrorBoundary from './ErrorBoundary';
import { useWeatherData } from '../hooks/useWeatherData';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { calculateHistoricalStats, generateHistoricalInsights } from '../utils/historicalDataGenerator';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getCityByName, getDefaultCity } from '../data/cityMappings';
import { Location } from '../types/weather';

const CityWeather: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();

  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'heatmap'>('line');
  const [isNLQueryLoading, setIsNLQueryLoading] = useState(false);
  const [currentMetrics] = useState(['temperature']);

  // 历史数据控制状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historicalYears, setHistoricalYears] = useState(20);

  const [useRealData] = useState(true);
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // 根据URL参数获取当前城市
  const currentLocation = useMemo((): Location => {
    if (!cityName) {
      return getDefaultCity();
    }

    const city = getCityByName(cityName);
    if (!city) {
      // 如果城市不支持，重定向到默认城市
      const defaultCity = getDefaultCity();
      navigate(`/${defaultCity.id}`, { replace: true });
      return defaultCity;
    }

    return city;
  }, [cityName, navigate]);

  // 设置页面标题
  useEffect(() => {
    const title = `${currentLocation.name} - 历史天气数据分析`;
    document.title = title;
  }, [currentLocation]);

  // 使用天气数据钩子
  const { data: chartData, loading: isDataLoading, error: dataError, refetch } = useWeatherData({
    useRealData,
    selectedLocations: [currentLocation],
    targetDate: currentDate,
    years: historicalYears
  });

  const isLoading = isDataLoading || isNLQueryLoading;

  // 处理城市切换
  const handleLocationChange = (newLocation: Location) => {
    navigate(`/${newLocation.id}`, { replace: true });
  };

  // 处理自然语言查询
  const handleNLQuery = async (query: string) => {
    setIsNLQueryLoading(true);

    // 模拟 AI 处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Processing query:', query);

    setIsNLQueryLoading(false);
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
  const chartTitle = `${currentLocation.name}历史同期数据 - ${format(currentDate, 'MM月dd日', { locale: zhCN })}`;
  const chartSubtitle = `过去${historicalYears}年 ${format(currentDate, 'MM月dd日', { locale: zhCN })} 的温度变化 • ${chartData.length} 个数据点`;

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
                  {currentLocation.name} 历史天气分析
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
          isLoading={isLoading}
        />

        {/* Natural Language Query Interface */}
        {/* <NaturalLanguageQuery 
          onSubmit={handleNLQuery}
          isLoading={isLoading}
        /> */}

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
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
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
                💡 通过URL访问不同城市：/{currentLocation.id} 或切换到其他支持的城市
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
                🌐 使用真实数据
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                📡 Open-Meteo API
              </span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                🎛️ 可自定义设置
              </span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CityWeather;