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

interface WeatherChartProps {
  data: WeatherDataPoint[];
  type: 'line' | 'area' | 'bar';
  metrics: string[];
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

const WeatherChart: React.FC<WeatherChartProps> = ({
  data,
  type = 'line',
  metrics = ['temperature'],
  colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
  height = 400,
  showGrid = true,
  showLegend = true,
}) => {
  // 处理和格式化数据
  const chartData = useMemo(() => {
    return data.map(item => {
      const itemDate = new Date(item.date);
      // 如果是历史同期数据（相同月日不同年份），显示年份
      const isHistoricalSameDate = data.length > 1 && 
        data.every(d => {
          const dDate = new Date(d.date);
          const firstDate = new Date(data[0].date);
          return dDate.getMonth() === firstDate.getMonth() && 
                 dDate.getDate() === firstDate.getDate();
        });
      
      return {
        ...item,
        date: isHistoricalSameDate 
          ? format(itemDate, 'yyyy年', { locale: zhCN })
          : format(itemDate, 'MM-dd', { locale: zhCN }),
        fullDate: item.date,
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
      return (
        <div className="bg-primary border border-custom rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-primary mb-2">
            {payload[0]?.payload?.fullDate && 
              format(new Date(payload[0].payload.fullDate), 'yyyy年MM月dd日', { locale: zhCN })
            }
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-secondary">{entry.name}:</span>
              <span className="font-medium text-primary">
                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              </span>
            </div>
          ))}
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
      dataKey: 'date',
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
            {metrics.map((metric, index) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stackId="1"
                stroke={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index]}
                fill={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index]}
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
            {metrics.map((metric, index) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index]}
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
            {metrics.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricConfig[metric as keyof typeof metricConfig]?.color || colors[index]}
                strokeWidth={2}
                dot={{ fill: metricConfig[metric as keyof typeof metricConfig]?.color || colors[index], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: metricConfig[metric as keyof typeof metricConfig]?.color || colors[index], strokeWidth: 2 }}
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
          <p className="text-sm mt-1">请选择地点和时间范围来查看天气数据</p>
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