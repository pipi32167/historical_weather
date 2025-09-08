import React from 'react';

interface HistoricalRangeSelectorProps {
  selectedRange: number;
  onRangeChange: (years: number) => void;
  disabled?: boolean;
  className?: string;
}

const HistoricalRangeSelector: React.FC<HistoricalRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  disabled = false,
  className = ''
}) => {
  const rangeOptions = [
    { value: 5, label: '5年', description: '最近5年同期数据' },
    { value: 10, label: '10年', description: '最近10年同期数据' },
    { value: 15, label: '15年', description: '最近15年同期数据' },
    { value: 20, label: '20年', description: '最近20年同期数据（推荐）' },
    { value: 30, label: '30年', description: '最近30年同期数据' },
  ];

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const years = parseInt(event.target.value, 10);
    onRangeChange(years);
  };

  const selectedOption = rangeOptions.find(option => option.value === selectedRange) || rangeOptions[3];

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-secondary mb-2">
        📊 历史数据范围
      </label>
      
      {/* 当前选择显示 */}
      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-custom">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📈</span>
          <div>
            <div className="font-semibold text-primary">{selectedOption.label}</div>
            <div className="text-xs text-secondary">{selectedOption.description}</div>
          </div>
        </div>
      </div>

      {/* 范围选择按钮 */}
      <div className="grid grid-cols-1 gap-2">
        {rangeOptions.map((option) => (
          <label
            key={option.value}
            className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedRange === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-custom bg-primary hover:bg-secondary'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              value={option.value}
              checked={selectedRange === option.value}
              onChange={handleRangeChange}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex items-center space-x-3 w-full">
              <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                selectedRange === option.value
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedRange === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  selectedRange === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-primary'
                }`}>
                  {option.label}
                </div>
                <div className="text-xs text-secondary">
                  {option.description}
                </div>
              </div>
              {selectedRange === option.value && (
                <div className="text-primary-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* 范围说明 */}
      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          💡 <strong>建议:</strong> 20年数据范围可以较好地反映气候趋势，避免短期波动影响。更长的时间范围可能包含较老的气象站数据，准确性会有所影响。
        </div>
      </div>
    </div>
  );
};

export default HistoricalRangeSelector;