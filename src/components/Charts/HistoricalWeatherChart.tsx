import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { timezoneService, TimezoneInfo } from '../../services/timezoneService';
import { weatherAggregateService, WeatherDataResponse } from '../../services/weatherAggregateService';
import { WeatherDataPoint, Location } from '../../types/weather';
import { calculateHistoricalStats, generateHistoricalInsights } from '../../utils/historicalDataGenerator';
import ChartContainer from './ChartContainer';
import WeatherChart from './WeatherChart';

export interface HistoricalWeatherChartProps {
  cityName: string;
  latitude: number;
  longitude: number;
  startDate: Date;
  endDate: Date;
  
  // 可选的显示配置
  showCurrentWeather?: boolean;
  chartHeight?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  chartType?: 'line' | 'area' | 'bar';
  
  // 数据配置
  years?: number; // 历史数据年数，用于同期对比
  metrics?: string[]; // 显示的指标
  
  // UI配置
  className?: string;
  showStats?: boolean;
  showInsights?: boolean;
  
  // 回调函数
  onDataLoaded?: (data: WeatherDataPoint[]) => void;
  onError?: (error: string) => void;
  onDownload?: () => void;
}

const HistoricalWeatherChart: React.FC<HistoricalWeatherChartProps> = ({
  cityName,
  latitude,
  longitude,
  startDate,
  endDate,
  showCurrentWeather = true,
  chartHeight = 400,
  showLegend = true,
  showGrid = true,
  chartType: initialChartType = 'line',
  years = 20,
  metrics = ['temperature'],
  className = '',
  showStats = true,
  showInsights = true,
  onDataLoaded,
  onError,
  onDownload
}) => {
  // 使用 showCurrentWeather 参数，避免未使用警告
  console.log('HistoricalWeatherChart: showCurrentWeather =', showCurrentWeather);
  // 状态管理
  const [chartData, setChartData] = useState<WeatherDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo | null>(null);
  const [chartType, setChartType] = useState(initialChartType);

  // 创建Location对象
  const location: Location = useMemo(() => ({
    id: `custom_${latitude}_${longitude}`,
    name: cityName,
    latitude,
    longitude,
    country: '未知',
    timezone: timezoneInfo?.timezone || 'auto'
  }), [cityName, latitude, longitude, timezoneInfo]);

  // 获取时区信息
  const fetchTimezone = useCallback(() => {
    try {
      const timezone = timezoneService.getBestTimezone(latitude, longitude);
      setTimezoneInfo(timezone);
      
      console.log('HistoricalWeatherChart: 检测到时区', {
        cityName,
        coordinates: `${latitude}, ${longitude}`,
        timezone: timezone.timezone,
        source: timezone.source,
        confidence: timezone.confidence
      });
    } catch (error) {
      console.warn('HistoricalWeatherChart: 时区检测失败', error);
      // 使用默认时区
      setTimezoneInfo({
        timezone: 'UTC',
        offset: 0,
        source: 'default',
        confidence: 'low'
      });
    }
  }, [latitude, longitude, cityName]);

  // 判断是否使用同期数据模式（单日多年对比）
  const useSamePeriodMode = useMemo(() => {
    const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 1; // 如果日期范围<=1天，使用同期对比模式
  }, [startDate, endDate]);

  // 获取历史气温数据
  const fetchWeatherData = useCallback(async () => {
    if (!timezoneInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('HistoricalWeatherChart: 开始获取数据', {
        cityName,
        mode: useSamePeriodMode ? '同期对比' : '日期范围',
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        years: useSamePeriodMode ? years : undefined,
        timezone: timezoneInfo.timezone
      });

      let response: WeatherDataResponse;

      if (useSamePeriodMode) {
        // 使用同期对比模式
        response = await weatherAggregateService.getHistoricalSamePeriodData(
          location,
          startDate,
          years,
          timezoneInfo.timezone
        );
      } else {
        // 使用日期范围模式
        response = await weatherAggregateService.getWeatherDataRange({
          location,
          startDate,
          endDate,
          timezone: timezoneInfo.timezone
        });
      }

      console.log('HistoricalWeatherChart: 数据获取成功', {
        totalPoints: response.metadata.totalPoints,
        historicalPoints: response.metadata.historicalPoints,
        forecastPoints: response.metadata.forecastPoints,
        sources: response.metadata.source
      });

      setChartData(response.data);
      onDataLoaded?.(response.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取气温数据失败';
      console.error('HistoricalWeatherChart: 数据获取失败', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    location, 
    startDate, 
    endDate, 
    years, 
    timezoneInfo, 
    useSamePeriodMode, 
    cityName,
    onDataLoaded, 
    onError
  ]);

  // 初始化时区
  useEffect(() => {
    fetchTimezone();
  }, [fetchTimezone]);

  // 时区准备好后获取数据
  useEffect(() => {
    if (timezoneInfo) {
      fetchWeatherData();
    }
  }, [timezoneInfo, fetchWeatherData]);

  // 计算统计数据
  const historicalStats = useMemo(() => {
    return calculateHistoricalStats(chartData);
  }, [chartData]);

  // 生成历史洞察
  const historicalInsights = useMemo(() => {
    if (historicalStats && useSamePeriodMode) {
      return generateHistoricalInsights(chartData, historicalStats, startDate);
    }
    return [];
  }, [chartData, historicalStats, startDate, useSamePeriodMode]);

  // 图表标题和副标题
  const chartTitle = useMemo(() => {
    if (useSamePeriodMode) {
      return `${cityName}历史同期数据 - ${format(startDate, 'MM月dd日', { locale: zhCN })}`;
    }
    return `${cityName}气温数据 - ${format(startDate, 'MM月dd日', { locale: zhCN })} 至 ${format(endDate, 'MM月dd日', { locale: zhCN })}`;
  }, [cityName, startDate, endDate, useSamePeriodMode]);

  const chartSubtitle = useMemo(() => {
    const hasCurrentWeather = chartData.length > 0 && chartData[0].weatherCondition.includes('当前实况');
    
    if (useSamePeriodMode) {
      return `${hasCurrentWeather ? '当前实况 + ' : ''}过去${years}年同期温度变化 • ${chartData.length} 个数据点`;
    }
    return `历史和实时气温数据 • ${chartData.length} 个数据点`;
  }, [chartData, years, useSamePeriodMode]);

  // 处理图表类型变更
  const handleChartTypeChange = (newType: 'line' | 'area' | 'bar' | 'heatmap') => {
    setChartType(newType === 'heatmap' ? 'area' : newType);
  };

  // 错误状态
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-2">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            数据加载失败
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 text-sm mb-4">{error}</p>
        <button
          onClick={fetchWeatherData}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-8 text-center ${className}`}>
        <div className="text-4xl mb-4">🌤️</div>
        <h3 className="text-lg font-semibold text-primary mb-2">
          正在加载{cityName}气温数据...
        </h3>
        <p className="text-sm text-secondary">
          {useSamePeriodMode 
            ? `正在分析${format(startDate, 'MM月dd日', { locale: zhCN })}过去${years}年的历史同期数据`
            : `正在获取${format(startDate, 'MM月dd日', { locale: zhCN })}至${format(endDate, 'MM月dd日', { locale: zhCN })}的气温数据`
          }
        </p>
        {timezoneInfo && (
          <div className="mt-3 text-xs text-secondary">
            🕐 时区: {timezoneService.formatTimezoneDisplay(timezoneInfo)}
          </div>
        )}
      </div>
    );
  }

  // 主要内容
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主图表 */}
      <ChartContainer
        title={chartTitle}
        subtitle={chartSubtitle}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        showTemperatureMode={true}
        onDownload={onDownload || (() => console.log('Download data:', chartData))}
        onSettings={fetchWeatherData}
        isLoading={isLoading}
      >
        <WeatherChart
          data={chartData}
          type={chartType}
          metrics={metrics}
          height={chartHeight}
          showGrid={showGrid}
          showLegend={showLegend}
        />
      </ChartContainer>

      {/* 统计数据卡片 */}
      {showStats && historicalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ...(chartData.length > 0 && chartData[0].weatherCondition.includes('当前实况') ? [{
              title: '当前温度',
              value: `${chartData[0].temperature.toFixed(1)}°C`,
              icon: '🌡️',
              changeType: 'neutral' as const
            }] : []),
            {
              title: '历史平均温度',
              value: `${historicalStats.avgTemperature}°C`,
              change: historicalStats.temperatureTrend > 0
                ? `+${historicalStats.temperatureTrend.toFixed(2)}°C/年`
                : `${historicalStats.temperatureTrend.toFixed(2)}°C/年`,
              changeType: historicalStats.temperatureTrend > 0 ? 'positive' as const : 'negative' as const,
              icon: '📊'
            },
            {
              title: '温度范围',
              value: `${historicalStats.temperatureRange}°C`,
              change: `${historicalStats.minTemperature}°C ~ ${historicalStats.maxTemperature}°C`,
              changeType: 'neutral' as const,
              icon: '📏'
            },
            {
              title: useSamePeriodMode ? '数据年份' : '数据点数',
              value: useSamePeriodMode ? `${historicalStats.dataPoints}年` : `${chartData.length}天`,
              change: useSamePeriodMode ? '历史对比' : '时间序列',
              changeType: 'neutral' as const,
              icon: '📅'
            }
          ].slice(0, 4).map((stat, index) => (
            <div key={index} className="bg-primary border border-custom rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-secondary">{stat.title}</h4>
                <div className="text-lg">{stat.icon}</div>
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              {stat.change && (
                <div className={`text-xs flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-secondary'
                }`}>
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 历史洞察 */}
      {showInsights && historicalInsights.length > 0 && useSamePeriodMode && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">📊</div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {format(startDate, 'MM月dd日', { locale: zhCN })} 历史数据洞察
              </h3>
              <p className="text-sm text-secondary">
                基于{cityName}过去{years}年同期数据的分析结果
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
        </div>
      )}
    </div>
  );
};

export default HistoricalWeatherChart;