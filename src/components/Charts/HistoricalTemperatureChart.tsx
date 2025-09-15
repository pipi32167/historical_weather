/**
 * 历史温度数据通用图表组件
 * 支持年度、季度、月度数据的统一展示
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface HistoricalChartData {
  year: number;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  recordHigh: number;
  recordLow: number;
}

export type ChartType = 'yearly' | 'quarterly' | 'monthly';

interface HistoricalTemperatureChartProps {
  data: HistoricalChartData[];
  type: ChartType;
  title: string;
  subtitle?: string;
  yearRange: { start: number; end: number };
  className?: string;
}

// 统一的颜色和样式配置
const CHART_COLORS = {
  avgTemp: '#10b981',      // 绿色 - 平均温度
  maxTemp: '#f59e0b',      // 橙色 - 平均最高温
  minTemp: '#3b82f6',      // 蓝色 - 平均最低温
  recordHigh: '#ef4444',   // 红色 - 记录最高温
  recordLow: '#1e40af'     // 深蓝色 - 记录最低温
};

const CHART_STYLES = {
  grid: {
    strokeDasharray: "3 3",
    stroke: "#e5e7eb"
  },
  axis: {
    stroke: "#6b7280",
    fontSize: 12
  },
  tooltip: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
};

const LINE_CONFIGS = {
  avgTemp: {
    strokeWidth: 3,
    dot: { fill: CHART_COLORS.avgTemp, strokeWidth: 2, r: 5 }
  },
  maxTemp: {
    strokeWidth: 2,
    strokeDasharray: "5 5",
    dot: { fill: CHART_COLORS.maxTemp, strokeWidth: 2, r: 3 }
  },
  minTemp: {
    strokeWidth: 2,
    strokeDasharray: "5 5",
    dot: { fill: CHART_COLORS.minTemp, strokeWidth: 2, r: 3 }
  },
  recordHigh: {
    strokeWidth: 1,
    strokeDasharray: "2 2",
    dot: { fill: CHART_COLORS.recordHigh, strokeWidth: 1, r: 2 }
  },
  recordLow: {
    strokeWidth: 1,
    strokeDasharray: "2 2",
    dot: { fill: CHART_COLORS.recordLow, strokeWidth: 1, r: 2 }
  }
};

const HistoricalTemperatureChart: React.FC<HistoricalTemperatureChartProps> = ({
  data,
  type,
  title,
  subtitle,
  yearRange,
  className = ''
}) => {
  // 根据图表类型生成标签 - 按显示顺序排列
  const getLabel = (dataKey: string): string => {
    const labelMap = {
      yearly: {
        recordHigh: '年最高温',      // 1. 最高温
        maxTemp: '年平均最高温',     // 2. 平均最高温
        avgTemp: '年平均温度',       // 3. 平均温度
        minTemp: '年平均最低温',     // 4. 平均最低温
        recordLow: '年最低温'        // 5. 最低温
      },
      quarterly: {
        recordHigh: '季度最高温',    // 1. 最高温
        maxTemp: '季度平均最高温',   // 2. 平均最高温
        avgTemp: '季度平均温度',     // 3. 平均温度
        minTemp: '季度平均最低温',   // 4. 平均最低温
        recordLow: '季度最低温'      // 5. 最低温
      },
      monthly: {
        recordHigh: '月最高温',      // 1. 最高温
        maxTemp: '月平均最高温',     // 2. 平均最高温
        avgTemp: '月平均温度',       // 3. 平均温度
        minTemp: '月平均最低温',     // 4. 平均最低温
        recordLow: '月最低温'        // 5. 最低温
      }
    };

    return labelMap[type][dataKey as keyof typeof labelMap[typeof type]] || dataKey;
  };

  // 定义显示顺序
  const DISPLAY_ORDER = ['recordHigh', 'maxTemp', 'avgTemp', 'minTemp', 'recordLow'];

  // 自定义Tooltip组件
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 按照指定顺序排序payload
      const sortedPayload = [...payload].sort((a, b) => {
        const aIndex = DISPLAY_ORDER.indexOf(a.dataKey);
        const bIndex = DISPLAY_ORDER.indexOf(b.dataKey);
        return aIndex - bIndex;
      });

      return (
        <div style={CHART_STYLES.tooltip} className="p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{`${label}年`}</p>
          <div className="space-y-1">
            {sortedPayload.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">
                  {getLabel(entry.dataKey)}: {entry.value}°C
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Legend formatter
  const legendFormatter = (value: string) => {
    return getLabel(value);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
      {/* 标题和描述 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title} ({yearRange.start}-{yearRange.end})
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {subtitle}
          </p>
        )}
      </div>

      {/* 图表 */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid {...CHART_STYLES.grid} />
            <XAxis
              dataKey="year"
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              {...CHART_STYLES.axis}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              {...CHART_STYLES.axis}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip
              content={<CustomTooltip />}
            />
            <Legend
              formatter={legendFormatter}
            />

            {/* 记录最高温线 - 最高温 */}
            <Line
              type="monotone"
              dataKey="recordHigh"
              stroke={CHART_COLORS.recordHigh}
              name="recordHigh"
              {...LINE_CONFIGS.recordHigh}
            />

            {/* 平均最高温线 */}
            <Line
              type="monotone"
              dataKey="maxTemp"
              stroke={CHART_COLORS.maxTemp}
              name="maxTemp"
              {...LINE_CONFIGS.maxTemp}
            />

            {/* 平均温度线 - 主要指标 */}
            <Line
              type="monotone"
              dataKey="avgTemp"
              stroke={CHART_COLORS.avgTemp}
              name="avgTemp"
              {...LINE_CONFIGS.avgTemp}
            />

            {/* 平均最低温线 */}
            <Line
              type="monotone"
              dataKey="minTemp"
              stroke={CHART_COLORS.minTemp}
              name="minTemp"
              {...LINE_CONFIGS.minTemp}
            />

            {/* 记录最低温线 - 最低温 */}
            <Line
              type="monotone"
              dataKey="recordLow"
              stroke={CHART_COLORS.recordLow}
              name="recordLow"
              {...LINE_CONFIGS.recordLow}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalTemperatureChart;