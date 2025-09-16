import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { WeatherDataPoint } from '../../types/weather';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TemperatureDisplayMode } from './ChartContainer';

interface WeatherChartProps {
  data: WeatherDataPoint[];
  type: 'line' | 'area' | 'bar';
  metrics: string[];
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  temperatureMode?: TemperatureDisplayMode;
}

const WeatherChart: React.FC<WeatherChartProps> = ({
  data,
  type = 'line',
  metrics = ['temperature'],
  colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
  height = 400,
  showGrid = true,
  showLegend = true,
  temperatureMode = 'maxMin',
}) => {
  // 处理和格式化数据 - 按年份从旧到新排序
  const chartData = useMemo(() => {
    // 首先按年份从旧到新排序
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getFullYear() - new Date(b.date).getFullYear()
    );

    // 检查是否是历史同期数据
    const isHistoricalSameDate = sortedData.length > 1 && 
      sortedData.every(d => {
        const dDate = new Date(d.date);
        const firstDate = new Date(sortedData[0].date);
        return dDate.getMonth() === firstDate.getMonth() && 
               dDate.getDate() === firstDate.getDate();
      });

    return sortedData.map(item => {
      const itemDate = new Date(item.date);
      const year = itemDate.getFullYear();
      
      // 设定温度显示值（最高/最低模式）
      const temperatureValue = item.temperature; // 主线还是平均温度
      const maxTemp = item.temperatureMax;
      const minTemp = item.temperatureMin;
      
      return {
        ...item,
        displayDate: isHistoricalSameDate 
          ? `${year}年`
          : format(itemDate, 'MM-dd', { locale: zhCN }),
        fullDate: format(itemDate, 'yyyy年MM月dd日', { locale: zhCN }),
        year: year,
        temperature: temperatureValue,
        temperatureMax: maxTemp,
        temperatureMin: minTemp,
        originalTemperature: item.temperature,
      };
    });
  }, [data]);

  // 指标配置
  const metricConfig = {
    temperature: { name: '温度 (°C)', color: colors[0] },
    humidity: { name: '湿度 (%)', color: colors[1] },
    pressure: { name: '气压 (hPa)', color: colors[2] },
    windSpeed: { name: '风速 (km/h)', color: colors[3] },
    precipitation: { name: '降水 (mm)', color: colors[4] },
  };


  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-primary border border-custom rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-primary mb-2">
            {data?.fullDate}
          </p>
          
          {/* 温度显示 */}
          <div className="space-y-1 text-sm">
            {data && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-secondary">最高温度:</span>
                  <span className="font-medium text-primary">{data.temperatureMax?.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-secondary">最低温度:</span>
                  <span className="font-medium text-primary">{data.temperatureMin?.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-secondary">平均温度:</span>
                  <span className="font-medium text-primary">{data.originalTemperature?.toFixed(1)}°C</span>
                </div>
              </>
            )}
          </div>

          {/* 其他指标 */}
          {data && (
            <div className="mt-2 pt-2 border-t border-custom text-xs text-secondary">
              <div>湿度: {data.humidity}%</div>
              <div>降水: {data.precipitation > 0 ? `${data.precipitation.toFixed(1)}mm` : '无'}</div>
              <div>风速: {data.windSpeed.toFixed(1)} km/h</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 渲染不同类型的图表
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const xAxisProps = {
      dataKey: 'displayDate',
      tick: { fontSize: 12, fill: 'var(--text-secondary)' },
      axisLine: { stroke: 'var(--border-color)' },
      tickLine: { stroke: 'var(--border-color)' },
    };

    const yAxisProps = {
      tick: { fontSize: 12, fill: 'var(--text-secondary)' },
      axisLine: { stroke: 'var(--border-color)' },
      tickLine: { stroke: 'var(--border-color)' },
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {/* 显示最高/最低温度区域 */}
            <Area
              key="temperatureMax"
              type="monotone"
              dataKey="temperatureMax"
              stackId="temp"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              strokeWidth={2}
              name="最高温度 (°C)"
            />
            <Area
              key="temperatureMin"
              type="monotone"
              dataKey="temperatureMin"
              stackId="temp"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
              name="最低温度 (°C)"
            />
            {/* 其他指标 */}
            {metrics.filter(metric => metric !== 'temperature').map((metric, index) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stackId="1"
                stroke={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1]}
                fill={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1]}
                fillOpacity={0.6}
                strokeWidth={2}
                name={metricConfig[metric as keyof typeof metricConfig]?.name || metric}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {/* 显示最高/最低温度柱状图 */}
            <Bar
              key="temperatureMax"
              dataKey="temperatureMax"
              fill="#ef4444"
              name="最高温度 (°C)"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              key="temperatureMin"
              dataKey="temperatureMin"
              fill="#3b82f6"
              name="最低温度 (°C)"
              radius={[2, 2, 0, 0]}
            />
            {/* 其他指标 */}
            {metrics.filter(metric => metric !== 'temperature').map((metric, index) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1]}
                name={metricConfig[metric as keyof typeof metricConfig]?.name || metric}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {/* 显示最高/最低温度线 */}
            <Line
              key="temperatureMax"
              type="monotone"
              dataKey="temperatureMax"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="最高温度 (°C)"
            />
            <Line
              key="temperatureMin"
              type="monotone"
              dataKey="temperatureMin"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="最低温度 (°C)"
            />
            <Line
              key="temperature"
              type="monotone"
              dataKey="originalTemperature"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 1 }}
              name="平均温度 (°C)"
            />
            {/* 其他指标 */}
            {metrics.filter(metric => metric !== 'temperature').map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1]}
                strokeWidth={2}
                dot={{ fill: metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: metricConfig[metric as keyof typeof metricConfig]?.color || colors[index + 1], strokeWidth: 2 }}
                name={metricConfig[metric as keyof typeof metricConfig]?.name || metric}
              />
            ))}
          </LineChart>
        );
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-lg font-medium">暂无数据</p>
          <p className="text-sm mt-1">请选择地点和时间范围来查看气温数据</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default WeatherChart;