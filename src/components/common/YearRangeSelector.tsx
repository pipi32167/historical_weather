/**
 * 年份范围选择器组件
 * 提供预设的年份范围选项（10/20/30/50年）
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useYearRangeStore } from '../../store/yearRangeStore';

interface YearRangeSelectorProps {
  className?: string;
}

export const YearRangeSelector: React.FC<YearRangeSelectorProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const { yearRange, setYearRange } = useYearRangeStore();

  // 计算当前日期相关值
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

  // 预设年份范围选项
  const yearRangeOptions = [
    { 
      label: t('time.yearRange10'), 
      value: '10',
      startYear: currentYear - 10,
      endYear: currentYear
    },
    { 
      label: t('time.yearRange20'), 
      value: '20',
      startYear: currentYear - 20,
      endYear: currentYear
    },
    { 
      label: t('time.yearRange30'), 
      value: '30',
      startYear: currentYear - 30,
      endYear: currentYear
    },
    { 
      label: t('time.yearRange50'), 
      value: '50',
      startYear: currentYear - 50,
      endYear: currentYear
    }
  ];

  // 判断当前选择是否匹配某个预设选项
  const getCurrentOption = () => {
    const option = yearRangeOptions.find(opt => 
      opt.startYear === yearRange.start && opt.endYear === yearRange.end
    );
    return option ? option.value : 'custom';
  };

  // 处理下拉选择变更
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      return; // 自定义选项保持当前值
    }

    const years = parseInt(value);
    const startYear = currentYear - years;
    setYearRange({ start: startYear, end: currentYear });
  };

  // 格式化日期范围描述
  const getDateRangeDescription = (startYear: number, endYear: number) => {
    const startDate = `${startYear}-01-01`;
    const endDate = yesterday.toISOString().split('T')[0]; // 昨天的日期
    return t('time.dateRangeDescription', { startDate, endDate });
  };

  const currentOption = getCurrentOption();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('time.yearRange')}
      </label>
      
      {/* 下拉选择框 */}
      <div className="mb-3">
        <select
          value={currentOption}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {yearRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="custom">{t('time.customRange')}</option>
        </select>
      </div>

      {/* 自定义输入框（当选择自定义时显示） */}
      {currentOption === 'custom' && (
        <div className="flex space-x-2 mb-3">
          <input
            type="number"
            value={yearRange.start}
            onChange={(e) => setYearRange({ start: parseInt(e.target.value), end: yearRange.end })}
            min="1980"
            max={currentYear}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('time.startYear')}
          />
          <span className="px-2 py-2 text-gray-500">{t('time.to')}</span>
          <input
            type="number"
            value={yearRange.end}
            onChange={(e) => setYearRange({ start: yearRange.start, end: parseInt(e.target.value) })}
            min="1980"
            max={currentYear}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('time.endYear')}
          />
        </div>
      )}

      {/* 当前选择的描述 */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          <strong>{t('time.selectedRange')}:</strong> {yearRange.start} - {yearRange.end} 
          ({yearRange.end - yearRange.start + 1} {t('time.years')})
        </p>
        <p className="text-xs">
          <strong>{t('time.dataRange')}:</strong> {getDateRangeDescription(yearRange.start, yearRange.end)}
        </p>
      </div>
    </div>
  );
};