/**
 * 月度温度分析综合组件
 * 集成控制面板和图表显示，提供完整的月度温度数据分析功能
 */

import React, { useState, useCallback } from 'react';
import MonthlyTemperatureChart from './Charts/MonthlyTemperatureChart';
import MonthlyTemperatureControls from './Controls/MonthlyTemperatureControls';
import { Location } from '../types/weather';

interface MonthlyTemperatureAnalysisProps {
  location: Location;
  className?: string;
  defaultMode?: 'monthly-trends' | 'annual-profile';
  defaultMonth?: number;
  defaultStartYear?: number;
  defaultEndYear?: number;
}

const MonthlyTemperatureAnalysis: React.FC<MonthlyTemperatureAnalysisProps> = ({
  location,
  className = '',
  defaultMode = 'monthly-trends',
  defaultMonth = new Date().getMonth() + 1,
  defaultStartYear = new Date().getFullYear() - 20,
  defaultEndYear = new Date().getFullYear() - 1
}) => {
  const [mode, setMode] = useState<'monthly-trends' | 'annual-profile'>(defaultMode);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [endYear, setEndYear] = useState(defaultEndYear);

  // 模式切换处理
  const handleModeChange = useCallback((newMode: 'monthly-trends' | 'annual-profile') => {
    setMode(newMode);
  }, []);

  // 月份切换处理
  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month);
  }, []);

  // 年份范围调整处理
  const handleYearRangeChange = useCallback((newStartYear: number, newEndYear: number) => {
    if (newStartYear <= newEndYear) {
      setStartYear(newStartYear);
      setEndYear(newEndYear);
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题区域 */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-custom rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">📈</div>
            <div>
              <h2 className="text-2xl font-bold text-primary">
                月度温度分析
              </h2>
              <p className="text-secondary mt-1">
                📍 {location.name} • 基于历史气候数据的月度温度统计和趋势分析
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-xs text-secondary">
            <div className="text-center">
              <div className="font-semibold text-primary">{location.latitude.toFixed(4)}°N</div>
              <div>纬度</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary">{Math.abs(location.longitude).toFixed(4)}°{location.longitude >= 0 ? 'E' : 'W'}</div>
              <div>经度</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary">{location.timezone}</div>
              <div>时区</div>
            </div>
          </div>
        </div>
      </div>

      {/* 控制面板 */}
      <MonthlyTemperatureControls
        mode={mode}
        selectedMonth={selectedMonth}
        startYear={startYear}
        endYear={endYear}
        onModeChange={handleModeChange}
        onMonthChange={handleMonthChange}
        onYearRangeChange={handleYearRangeChange}
      />

      {/* 图表展示 */}
      <MonthlyTemperatureChart
        location={location}
        mode={mode}
        selectedMonth={selectedMonth}
        startYear={startYear}
        endYear={endYear}
      />

      {/* 功能说明 */}
      <div className="bg-primary border border-custom rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          📖 功能说明
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-primary mb-2 flex items-center">
                <span className="text-blue-500 mr-2">📊</span>
                月度趋势分析
              </h4>
              <p className="text-sm text-secondary">
                选择特定月份，查看该月份在多个年份中的温度变化趋势，识别气候变化模式和异常年份。
              </p>
              <ul className="text-xs text-secondary mt-2 space-y-1">
                <li>• 显示平均温度、最高温和最低温的年际变化</li>
                <li>• 自动计算温度趋势（升温/降温/稳定）</li>
                <li>• 标识历史极值温度记录</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-primary mb-2 flex items-center">
                <span className="text-orange-500 mr-2">🌡️</span>
                年度温度概况
              </h4>
              <p className="text-sm text-secondary">
                展示全年12个月的平均温度分布，帮助了解该地区的季节性气候特征。
              </p>
              <ul className="text-xs text-secondary mt-2 space-y-1">
                <li>• 基于多年数据计算各月平均温度</li>
                <li>• 清晰展示季节性温度变化规律</li>
                <li>• 识别最热月和最冷月</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-custom">
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center space-x-4">
              <span>🌍 数据来源: Open-Meteo API</span>
              <span>📅 数据范围: 1940年至今</span>
              <span>📈 更新频率: 每日</span>
            </div>
            <div className="text-right">
              <div>基于专业气象再分析数据</div>
              <div>10公里空间分辨率</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTemperatureAnalysis;