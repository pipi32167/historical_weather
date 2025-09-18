/**
 * 月平均温度控制面板组件
 * 提供月份选择、年份范围调整、显示模式切换等控制功能
 */

import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  const months = [
    { value: 1, name: t('time.january'), shortName: t('time.january') },
    { value: 2, name: t('time.february'), shortName: t('time.february') },
    { value: 3, name: t('time.march'), shortName: t('time.march') },
    { value: 4, name: t('time.april'), shortName: t('time.april') },
    { value: 5, name: t('time.may'), shortName: t('time.may') },
    { value: 6, name: t('time.june'), shortName: t('time.june') },
    { value: 7, name: t('time.july'), shortName: t('time.july') },
    { value: 8, name: t('time.august'), shortName: t('time.august') },
    { value: 9, name: t('time.september'), shortName: t('time.september') },
    { value: 10, name: t('time.october'), shortName: t('time.october') },
    { value: 11, name: t('time.november'), shortName: t('time.november') },
    { value: 12, name: t('time.december'), shortName: t('time.december') }
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
            📊 {t('time.displayMode')}
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
              {t('time.monthlyTrends')}
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
              {t('time.annualProfile')}
            </button>
          </div>
        </div>

        {/* 月份选择（仅在月度趋势模式下显示） */}
        {mode === 'monthly-trends' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">
              📅 {t('time.selectMonth')}
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
            🗓️ {t('time.yearRange')}
          </label>
          
          {/* 预设年份范围 */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handlePresetRange(10)}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
            >
              {t('time.recentYears', { years: 10 })}
            </button>
            <button
              onClick={() => handlePresetRange(20)}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded"
            >
              {t('time.recentYears', { years: 20 })}
            </button>
            <button
              onClick={() => handlePresetRange(30)}
              className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
            >
              {t('time.recentYears', { years: 30 })}
            </button>
          </div>

          {/* 自定义年份范围 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary mb-1">{t('time.startYear')}</label>
              <select
                value={startYear}
                onChange={(e) => onYearRangeChange(parseInt(e.target.value), endYear)}
                className="w-full px-2 py-1 text-sm border border-custom rounded bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - 1940 }, (_, i) => 1940 + i)
                  .reverse()
                  .map(year => (
                    <option key={year} value={year}>
                      {year}{t('time.year')}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">{t('time.endYear')}</label>
              <select
                value={endYear}
                onChange={(e) => onYearRangeChange(startYear, parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-custom rounded bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - startYear }, (_, i) => startYear + i)
                  .reverse()
                  .map(year => (
                    <option key={year} value={year}>
                      {year}{t('time.year')}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-secondary">
            {t('time.dataRange')}: {t('time.dataRangeValue', { count: endYear - startYear + 1, start: startYear, end: endYear })}
          </div>
        </div>

        {/* 说明信息 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">{t('time.usageTips')}</div>
              <ul className="space-y-1">
                <li>• <strong>{t('time.monthlyTrends')}</strong>: {t('time.monthlyTrendsDesc')}</li>
                <li>• <strong>{t('time.annualProfile')}</strong>: {t('time.annualProfileDesc')}</li>
                <li>• {t('time.dataSourceDesc')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTemperatureControls;