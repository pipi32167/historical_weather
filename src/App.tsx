import React, { useState, useMemo } from 'react';
import MainLayout from './components/Layout/MainLayout';
import ChartContainer from './components/Charts/ChartContainer';
import WeatherChart from './components/Charts/WeatherChart';
import NaturalLanguageQuery from './components/Query/NaturalLanguageQuery';
import { useAppStore } from './store/appStore';
import { useWeatherData } from './hooks/useWeatherData';
import { calculateHistoricalStats, generateHistoricalInsights } from './utils/historicalDataGenerator';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function App(): React.ReactElement {
  const { selectedLocations } = useAppStore();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'heatmap'>('line');
  const [isNLQueryLoading, setIsNLQueryLoading] = useState(false);
  const [currentMetrics] = useState(['temperature']);
  const [currentDate] = useState(new Date());
  const [useRealData] = useState(true); // Toggle for real vs mock data

  // Use the weather data hook
  const { data: chartData, loading: isDataLoading, error: dataError, refetch, searchLocations } = useWeatherData({
    useRealData,
    selectedLocations,
    targetDate: currentDate,
    years: 20
  });

  const isLoading = isDataLoading || isNLQueryLoading;

  // 处理自然语言查询
  const handleNLQuery = async (query: string) => {
    setIsNLQueryLoading(true);
    
    // 模拟 AI 处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: 这里将来集成真实的 NLP 服务
    console.log('Processing query:', query);
    
    setIsNLQueryLoading(false);
  };

  // 图表数据处理 - 根据选中的地点调整显示的指标
  const displayMetrics = useMemo(() => {
    if (selectedLocations.length <= 1) {
      return currentMetrics;
    }
    
    // 多地点对比时，为每个地点创建独立的指标
    const metrics: string[] = [];
    selectedLocations.forEach(location => {
      metrics.push(`${location.name}_temperature`);
    });
    
    return metrics;
  }, [selectedLocations, currentMetrics]);

  // 计算历史统计数据
  const historicalStats = useMemo(() => {
    if (selectedLocations.length === 0) {
      return calculateHistoricalStats(chartData);
    }
    return null;
  }, [chartData, selectedLocations]);

  // 生成历史洞察
  const historicalInsights = useMemo(() => {
    if (selectedLocations.length === 0 && historicalStats) {
      return generateHistoricalInsights(chartData, historicalStats, currentDate);
    }
    return [];
  }, [chartData, historicalStats, currentDate, selectedLocations]);

  // 图表标题和副标题
  const chartTitle = selectedLocations.length === 0 
    ? `上海历史同期数据 - ${format(currentDate, 'MM月dd日', { locale: zhCN })}` 
    : selectedLocations.length === 1
    ? `${selectedLocations[0].name}天气数据概览`
    : `${selectedLocations.map(loc => loc.name).join(' vs ')} 数据对比`;

  const chartSubtitle = selectedLocations.length === 0 
    ? `过去20年 ${format(currentDate, 'MM月dd日', { locale: zhCN })} 的温度变化 • ${chartData.length} 个数据点`
    : `过去两年数据趋势 • ${chartData.length} 个数据点`;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Natural Language Query Interface */}
        <NaturalLanguageQuery 
          onSubmit={handleNLQuery}
          isLoading={isLoading}
        />

        {/* Main Chart */}
        <ChartContainer
          title={chartTitle}
          subtitle={chartSubtitle}
          chartType={chartType}
          onChartTypeChange={setChartType}
          onDownload={() => {
            // TODO: 实现数据导出功能
            console.log('Download data:', chartData);
          }}
          onSettings={() => {
            // Refresh data
            refetch();
          }}
          isLoading={isLoading}
        >
          <WeatherChart
            data={chartData}
            type={chartType === 'heatmap' ? 'area' : chartType}
            metrics={displayMetrics}
            height={400}
            showGrid={true}
            showLegend={true}
          />
        </ChartContainer>

        {/* Data Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            if (selectedLocations.length === 0 && historicalStats) {
              // 显示历史统计数据
              return [
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
              ];
            } else {
              // 显示常规统计数据
              return [
                { 
                  title: '平均温度', 
                  value: chartData.length > 0 ? `${(chartData.reduce((sum, d) => sum + d.temperature, 0) / chartData.length).toFixed(1)}°C` : 'N/A',
                  change: '+2.3°C',
                  changeType: 'positive' as const
                },
                { 
                  title: '平均湿度', 
                  value: chartData.length > 0 ? `${Math.round(chartData.reduce((sum, d) => sum + d.humidity, 0) / chartData.length)}%` : 'N/A',
                  change: '-1.2%',
                  changeType: 'negative' as const
                },
                { 
                  title: '总降水量', 
                  value: chartData.length > 0 ? `${chartData.reduce((sum, d) => sum + d.precipitation, 0).toFixed(1)}mm` : 'N/A',
                  change: '+15.8mm',
                  changeType: 'positive' as const
                },
                { 
                  title: '数据点', 
                  value: `${chartData.length}`,
                  change: '完整覆盖',
                  changeType: 'neutral' as const
                },
              ];
            }
          })().map((stat, index) => (
            <div key={index} className="bg-primary border border-custom rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-secondary">{stat.title}</h4>
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className={`text-xs flex items-center ${
                stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' : 'text-secondary'
              }`}>
                <span>{stat.change}</span>
                <span className="ml-1">较去年同期</span>
              </div>
            </div>
          ))}
        </div>

        {/* Historical Insights */}
        {selectedLocations.length === 0 && historicalInsights.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {format(currentDate, 'MM月dd日', { locale: zhCN })} 历史数据洞察
                </h3>
                <p className="text-sm text-secondary">
                  基于上海过去20年同期数据的分析结果
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
                💡 添加其他城市进行对比，或使用自然语言查询获取更多分析
              </p>
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
            </p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              重新加载
            </button>
          </div>
        )}

        {/* Instructions for when no locations selected but no insights yet */}
        {selectedLocations.length === 0 && historicalInsights.length === 0 && !dataError && (
          <div className="bg-primary border border-custom rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              {isDataLoading ? '正在加载上海历史数据...' : '上海历史天气数据'}
            </h3>
            <p className="text-secondary mb-4">
              {isDataLoading 
                ? `正在分析${format(currentDate, 'MM月dd日', { locale: zhCN })}过去20年的天气变化`
                : `显示${format(currentDate, 'MM月dd日', { locale: zhCN })}过去20年的真实天气数据`
              }
            </p>
            {useRealData && (
              <div className="flex justify-center space-x-2 mt-2">
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  🌐 使用真实数据
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  📡 Open-Meteo API
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions for when locations are selected */}
        {selectedLocations.length > 0 && (
          <div className="bg-primary border border-custom rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              数据对比分析
            </h3>
            <p className="text-secondary mb-4">
              正在展示{selectedLocations.map(loc => loc.name).join('、')}的天气数据对比
            </p>
            <div className="flex justify-center space-x-2">
              <span className="text-xs bg-secondary px-2 py-1 rounded">💡 尝试自然语言查询获取更深入的分析</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
