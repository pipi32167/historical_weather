import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  disabled = false,
  className = ''
}) => {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      const newDate = new Date(dateString);
      // 确保不选择未来日期
      const today = new Date();
      if (newDate <= today) {
        onDateChange(newDate);
      }
    }
  };

  // 获取今天的日期字符串（用于设置max属性）
  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-secondary mb-2">
        📅 选择查询日期
      </label>
      <div className="relative">
        <input
          type="date"
          value={selectedDateString}
          max={today}
          onChange={handleDateChange}
          onClick={(e) => {
            // 兼容iOS Safari点击无反应的问题
            (e.target as HTMLInputElement).showPicker();
          }}
          disabled={disabled}
          readOnly={false}
          className="w-full px-4 py-2 border border-custom rounded-lg bg-primary text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="mt-1 text-xs text-secondary">
        当前选择: {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })}
      </div>
    </div>
  );
};

export default DatePicker;