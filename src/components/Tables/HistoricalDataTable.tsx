import React, { useMemo } from 'react';
import { WeatherDataPoint } from '../../types/weather';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { calculateMedian, calculateMean, calculateTemperatureTrend, formatStatistic, getTemperatureTrendDescription } from '../../utils/statisticsHelpers';

interface HistoricalDataTableProps {
  data: WeatherDataPoint[];
  targetDate: Date;
  className?: string;
}


const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({
  data,
  targetDate,
  className = ''
}) => {

  // 按年份从旧到新排序
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => 
      new Date(a.date).getFullYear() - new Date(b.date).getFullYear()
    );
  }, [data]);

  // 计算统计数据
  const statistics = useMemo(() => {
    if (data.length === 0) return null;

    const temperatures = data.map(d => d.temperature);
    const maxTemps = data.map(d => d.temperatureMax);
    const minTemps = data.map(d => d.temperatureMin);
    const humidities = data.map(d => d.humidity);
    const precipitations = data.map(d => d.precipitation);

    // 计算温度趋势
    const temperatureTrend = calculateTemperatureTrend(data);

    return {
      avgTemperature: calculateMean(temperatures),
      medianTemperature: calculateMedian(temperatures),
      maxTemperature: Math.max(...maxTemps),
      minTemperature: Math.min(...minTemps),
      avgHumidity: calculateMean(humidities),
      medianHumidity: calculateMedian(humidities),
      totalPrecipitation: precipitations.reduce((sum, p) => sum + p, 0),
      avgPrecipitation: calculateMean(precipitations),
      temperatureTrend,
      trendDescription: getTemperatureTrendDescription(temperatureTrend),
      dataPoints: data.length
    };
  }, [data]);

  // 获取温度显示值
  const getTemperatureDisplay = (point: WeatherDataPoint) => {
    return `${point.temperatureMax.toFixed(1)}° / ${point.temperatureMin.toFixed(1)}°`;
  };

  // 获取统计显示的温度值
  const getStatisticalTemperature = () => {
    if (!statistics) return 'N/A';
    return `${formatStatistic(statistics.maxTemperature, 1, '°C')} / ${formatStatistic(statistics.minTemperature, 1, '°C')}`;
  };

  // 获取温度标题
  const getTemperatureTitle = () => {
    return '最高 / 最低温度';
  };

  if (data.length === 0) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-6 text-center ${className}`}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-primary mb-2">暂无数据</h3>
        <p className="text-secondary">请选择日期和地点查看历史同期数据</p>
      </div>
    );
  }

  return (
    <div className={`bg-primary border border-custom rounded-lg overflow-hidden ${className}`}>
      {/* 表格头部 */}
      <div className="px-6 py-4 border-b border-custom bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {format(targetDate, 'MM月dd日', { locale: zhCN })} 历史同期数据表
              </h3>
              <p className="text-sm text-secondary">
                共 {sortedData.length} 年数据 • 按年份从旧到新排列
              </p>
            </div>
          </div>

          {/* 温度显示模式标签 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary">温度显示：</span>
            <div className="px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg">
              最高/最低温度
            </div>
          </div>
        </div>
      </div>

      {/* 统计摘要 */}
      {statistics && (
        <div className="px-6 py-3 bg-secondary border-b border-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">🌡️</span>
              <span className="text-secondary">{getTemperatureTitle()}:</span>
              <span className="font-semibold text-primary">
                {getStatisticalTemperature()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">📈</span>
              <span className="text-secondary">温度趋势:</span>
              <span className="font-semibold text-primary">
                {statistics.trendDescription} ({formatStatistic(statistics.temperatureTrend, 2, '°/年')})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-500">💧</span>
              <span className="text-secondary">湿度:</span>
              <span className="font-semibold text-primary">
                平均{formatStatistic(statistics.avgHumidity, 0, '%')} / 中位{formatStatistic(statistics.medianHumidity, 0, '%')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-cyan-500">🌧️</span>
              <span className="text-secondary">降水:</span>
              <span className="font-semibold text-primary">
                总计{formatStatistic(statistics.totalPrecipitation, 1, 'mm')} / 平均{formatStatistic(statistics.avgPrecipitation, 1, 'mm')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 表格内容 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                年份
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                {getTemperatureTitle()}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                湿度
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                降水量
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                天气条件
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                风速
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-custom">
            {sortedData.map((point, index) => {
              const year = new Date(point.date).getFullYear();
              const isCurrentYear = year === new Date().getFullYear();
              
              return (
                <tr 
                  key={point.date} 
                  className={`hover:bg-secondary transition-colors ${
                    isCurrentYear ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${
                        isCurrentYear ? 'text-blue-600 dark:text-blue-400' : 'text-primary'
                      }`}>
                        {year}
                      </span>
                      {isCurrentYear && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                          今年
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-primary">
                      {getTemperatureDisplay(point)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-primary">{point.humidity}%</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-primary">
                      {point.precipitation > 0 ? `${point.precipitation.toFixed(1)}mm` : '无'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      {point.weatherCondition}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-primary">{point.windSpeed.toFixed(1)} km/h</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 表格底部信息 */}
      <div className="px-6 py-3 bg-secondary border-t border-custom">
        <div className="flex items-center justify-between text-sm text-secondary">
          <div className="flex items-center space-x-4">
            <span>总计 {sortedData.length} 年数据</span>
            <span>•</span>
            <span>数据来源: Open-Meteo API</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">💡</span>
            <span>数据按年份从旧到新排列</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDataTable;