/**
 * 月平均温度历史数据图表组件
 * 展示指定位置的月度温度统计和趋势分析
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { monthlyTemperatureService, MonthlyTemperatureStats, MonthlyTemperatureTrends } from '../../services/monthlyTemperatureService';
import { Location } from '../../types/weather';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { format } from 'date-fns';

interface MonthlyTemperatureChartProps {
  location: Location;
  mode?: 'monthly-trends' | 'annual-profile';
  selectedMonth?: number; // 1-12, 仅在monthly-trends模式下使用
  startYear?: number;
  endYear?: number;
  className?: string;
}

const MonthlyTemperatureChart: React.FC<MonthlyTemperatureChartProps> = ({
  location,
  mode = 'monthly-trends',
  selectedMonth = new Date().getMonth() + 1,
  startYear = new Date().getFullYear() - 20,
  endYear = new Date().getFullYear() - 1,
  className = ''
}) => {
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTemperatureTrends | null>(null);
  const [annualProfile, setAnnualProfile] = useState<MonthlyTemperatureStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载月度趋势数据
  const loadMonthlyTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('加载月度趋势数据:', {
        location: location.name,
        month: selectedMonth,
        startYear,
        endYear
      });

      const trends = await monthlyTemperatureService.getMonthlyTemperatureTrends(
        location.latitude,
        location.longitude,
        selectedMonth,
        startYear,
        endYear,
        location.name,
        location.timezone
      );

      setMonthlyTrends(trends);
    } catch (err) {
      console.error('加载月度趋势数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载年度温度概况数据
  const loadAnnualProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('加载年度温度概况数据:', {
        location: location.name,
        startYear,
        endYear
      });

      const profile = await monthlyTemperatureService.getAnnualTemperatureProfile(
        location.latitude,
        location.longitude,
        startYear,
        endYear,
        location.name,
        location.timezone
      );

      setAnnualProfile(profile);
    } catch (err) {
      console.error('加载年度温度概况数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 数据加载效果
  useEffect(() => {
    if (mode === 'monthly-trends') {
      loadMonthlyTrends();
    } else {
      loadAnnualProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, mode, selectedMonth, startYear, endYear]);

  // 月度趋势图表数据
  const trendsChartData = useMemo(() => {
    if (!monthlyTrends) return [];

    return monthlyTrends.years.map(data => ({
      year: data.year,
      avgTemp: data.avgTemp,
      maxTemp: data.avgMaxTemp,
      minTemp: data.avgMinTemp,
      recordHigh: data.recordHigh,
      recordLow: data.recordLow
    }));
  }, [monthlyTrends]);

  // 年度概况图表数据
  const profileChartData = useMemo(() => {
    return annualProfile.map(data => ({
      month: data.monthName,
      monthNum: data.month,
      avgTemp: data.avgTemp,
      maxTemp: data.avgMaxTemp,
      minTemp: data.avgMinTemp,
      recordHigh: data.recordHigh,
      recordLow: data.recordLow
    }));
  }, [annualProfile]);

  // 趋势描述
  const getTrendDescription = (trends: MonthlyTemperatureTrends) => {
    const { trend, trendValue } = trends;
    let description = '';
    let colorClass = '';

    if (trend === 'warming') {
      description = `升温趋势 +${Math.abs(trendValue).toFixed(3)}°C/年`;
      colorClass = 'text-red-600';
    } else if (trend === 'cooling') {
      description = `降温趋势 ${trendValue.toFixed(3)}°C/年`;
      colorClass = 'text-blue-600';
    } else {
      description = '温度稳定';
      colorClass = 'text-green-600';
    }

    return { description, colorClass };
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (mode === 'monthly-trends') {
        return (
          <div className="bg-primary border border-custom rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-primary mb-2">{label}年</p>
            <div className="space-y-1 text-xs">
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
                平均温度: {data.avgTemp}°C
              </p>
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                平均最高: {data.maxTemp}°C
              </p>
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-cyan-500 rounded mr-2"></span>
                平均最低: {data.minTemp}°C
              </p>
              <div className="border-t border-custom pt-1 mt-2">
                <p className="text-secondary">记录最高: {data.recordHigh}°C</p>
                <p className="text-secondary">记录最低: {data.recordLow}°C</p>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-primary border border-custom rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-primary mb-2">{data.month}</p>
            <div className="space-y-1 text-xs">
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
                平均温度: {data.avgTemp}°C
              </p>
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                平均最高: {data.maxTemp}°C
              </p>
              <p className="text-secondary">
                <span className="inline-block w-3 h-3 bg-cyan-500 rounded mr-2"></span>
                平均最低: {data.minTemp}°C
              </p>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
          <span className="ml-3 text-secondary">加载月度温度数据...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-6 ${className}`}>
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            if (mode === 'monthly-trends') {
              loadMonthlyTrends();
            } else {
              loadAnnualProfile();
            }
          }} 
        />
      </div>
    );
  }

  if (mode === 'monthly-trends' && !monthlyTrends) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-6 ${className}`}>
        <div className="text-center text-secondary">
          <p>暂无{selectedMonth}月份的温度趋势数据</p>
        </div>
      </div>
    );
  }

  if (mode === 'annual-profile' && annualProfile.length === 0) {
    return (
      <div className={`bg-primary border border-custom rounded-lg p-6 ${className}`}>
        <div className="text-center text-secondary">
          <p>暂无年度温度概况数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-primary border border-custom rounded-lg p-6 ${className}`}>
      {/* 标题和统计信息 */}
      <div className="mb-6">
        {mode === 'monthly-trends' && monthlyTrends ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">
                📊 {location.name} {monthlyTrends.monthName}份温度趋势
              </h3>
              <div className="text-xs text-secondary">
                {startYear}-{endYear}年 ({monthlyTrends.years.length}年数据)
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary border border-custom rounded-lg p-3">
                <div className="text-xs text-secondary mb-1">平均温度</div>
                <div className="text-lg font-bold text-primary">{monthlyTrends.averageTemp}°C</div>
              </div>
              <div className="bg-secondary border border-custom rounded-lg p-3">
                <div className="text-xs text-secondary mb-1">温度趋势</div>
                <div className={`text-lg font-bold ${getTrendDescription(monthlyTrends).colorClass}`}>
                  {getTrendDescription(monthlyTrends).description}
                </div>
              </div>
              <div className="bg-secondary border border-custom rounded-lg p-3">
                <div className="text-xs text-secondary mb-1">数据完整性</div>
                <div className="text-lg font-bold text-primary">
                  {((monthlyTrends.years.length / (endYear - startYear + 1)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">
                🌡️ {location.name} 年度温度概况
              </h3>
              <div className="text-xs text-secondary">
                基于{startYear}-{endYear}年数据
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图表 */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'monthly-trends' ? (
            <LineChart data={trendsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="year" 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}°C`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgTemp" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="平均温度"
              />
              <Line 
                type="monotone" 
                dataKey="maxTemp" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="平均最高温"
              />
              <Line 
                type="monotone" 
                dataKey="minTemp" 
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                name="平均最低温"
              />
            </LineChart>
          ) : (
            <BarChart data={profileChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}°C`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="avgTemp" 
                fill="#3b82f6"
                name="平均温度"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="maxTemp" 
                fill="#ef4444"
                name="平均最高温"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="minTemp" 
                fill="#06b6d4"
                name="平均最低温"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 数据说明 */}
      <div className="text-xs text-secondary border-t border-custom pt-3">
        <div className="flex items-center justify-between">
          <div>
            💡 数据来源：Open-Meteo历史天气API，基于再分析数据集
          </div>
          {mode === 'monthly-trends' && monthlyTrends && (
            <div>
              最近更新: {format(new Date(), 'yyyy-MM-dd HH:mm')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyTemperatureChart;