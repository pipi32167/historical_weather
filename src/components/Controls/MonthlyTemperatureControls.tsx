/**
 * 月平均温度控制面板组件
 * 提供月份选择、年份范围调整、显示模式切换等控制功能
 */

import React from 'react';
import clsx from 'clsx';

interface MonthlyTemperatureControlsProps {
  mode: 'monthly-trends' | 'annual-profile';
  selectedMonth: number;
  startYear: number;
  endYear: number;
  onModeChange: (mode: 'monthly-trends' | 'annual-profile') => void;
  onMonthChange: (month: number) => void;
  onYearRangeChange: (startYear: number, endYear: number) => void;
  className?: string;
}

const MonthlyTemperatureControls: React.FC<MonthlyTemperatureControlsProps> = ({
  mode,
  selectedMonth,
  startYear,
  endYear,
  onModeChange,
  onMonthChange,
  onYearRangeChange,
  className = ''
}) => {
  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, name: '1月', shortName: '1月' },
    { value: 2, name: '2月', shortName: '2月' },
    { value: 3, name: '3月', shortName: '3月' },
    { value: 4, name: '4月', shortName: '4月' },
    { value: 5, name: '5月', shortName: '5月' },
    { value: 6, name: '6月', shortName: '6月' },
    { value: 7, name: '7月', shortName: '7月' },
    { value: 8, name: '8月', shortName: '8月' },
    { value: 9, name: '9月', shortName: '9月' },
    { value: 10, name: '10月', shortName: '10月' },
    { value: 11, name: '11月', shortName: '11月' },
    { value: 12, name: '12月', shortName: '12月' }
  ];

  const handlePresetRange = (years: number) => {
    const newEndYear = currentYear - 1;
    const newStartYear = newEndYear - years + 1;
    onYearRangeChange(newStartYear, newEndYear);
  };

  return (
    <div className={`bg-primary border border-custom rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* 显示模式切换 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">
            📊 显示模式
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => onModeChange('monthly-trends')}
              className={clsx(
                'px-3 py-2 text-sm rounded-md transition-colors',
                mode === 'monthly-trends'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary border border-custom text-secondary hover:bg-tertiary'
              )}
            >
              月度趋势
            </button>
            <button
              onClick={() => onModeChange('annual-profile')}
              className={clsx(
                'px-3 py-2 text-sm rounded-md transition-colors',
                mode === 'annual-profile'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary border border-custom text-secondary hover:bg-tertiary'
              )}
            >
              年度概况
            </button>
          </div>
        </div>

        {/* 月份选择（仅在月度趋势模式下显示） */}
        {mode === 'monthly-trends' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">
              📅 选择月份
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {months.map((month) => (
                <button
                  key={month.value}
                  onClick={() => onMonthChange(month.value)}
                  className={clsx(
                    'px-2 py-1 text-xs rounded transition-colors',
                    selectedMonth === month.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary border border-custom text-secondary hover:bg-tertiary'
                  )}
                >
                  {month.shortName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 年份范围选择 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">
            🗓️ 年份范围
          </label>
          
          {/* 预设年份范围 */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handlePresetRange(10)}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
            >
              最近10年
            </button>
            <button
              onClick={() => handlePresetRange(20)}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded"
            >
              最近20年
            </button>
            <button
              onClick={() => handlePresetRange(30)}
              className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
            >
              最近30年
            </button>
          </div>

          {/* 自定义年份范围 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary mb-1">开始年份</label>
              <select
                value={startYear}
                onChange={(e) => onYearRangeChange(parseInt(e.target.value), endYear)}
                className="w-full px-2 py-1 text-sm border border-custom rounded bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - 1940 }, (_, i) => 1940 + i)
                  .reverse()
                  .map(year => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">结束年份</label>
              <select
                value={endYear}
                onChange={(e) => onYearRangeChange(startYear, parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-custom rounded bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - startYear }, (_, i) => startYear + i)
                  .reverse()
                  .map(year => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-secondary">
            数据范围: {endYear - startYear + 1}年 ({startYear}-{endYear})
          </div>
        </div>

        {/* 说明信息 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">使用提示</div>
              <ul className="space-y-1">
                <li>• <strong>月度趋势</strong>: 显示指定月份多年的温度变化趋势</li>
                <li>• <strong>年度概况</strong>: 显示全年12个月的平均温度分布</li>
                <li>• 数据基于Open-Meteo历史气温API，覆盖1940年至今</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTemperatureControls;