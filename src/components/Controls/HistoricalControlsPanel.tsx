import React, { useState } from 'react';
import DatePicker from './DatePicker';
import LocationSelector from './LocationSelector';
import HistoricalRangeSelector from './HistoricalRangeSelector';
import { Location } from '../../types/weather';

interface HistoricalControlsPanelProps {
  selectedDate: Date;
  selectedLocation: Location;
  selectedRange: number;
  onDateChange: (date: Date) => void;
  onLocationChange: (location: Location) => void;
  onRangeChange: (years: number) => void;
  isLoading?: boolean;
  className?: string;
}

const HistoricalControlsPanel: React.FC<HistoricalControlsPanelProps> = ({
  selectedDate,
  selectedLocation,
  selectedRange,
  onDateChange,
  onLocationChange,
  onRangeChange,
  isLoading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-primary border border-custom rounded-lg shadow-sm ${className}`}>
      {/* 控制面板头部 */}
      <div className="p-4 border-b border-custom">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">历史同期数据控制面板</h3>
              <p className="text-sm text-secondary">自定义查询条件，探索历史气温数据</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary hover:bg-secondary rounded-md transition-colors"
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 快速信息显示（折叠状态） */}
      {!isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">📅</span>
              <span className="text-secondary">日期:</span>
              <span className="font-medium text-primary">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">📍</span>
              <span className="text-secondary">地点:</span>
              <span className="font-medium text-primary">{selectedLocation.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-500">📊</span>
              <span className="text-secondary">范围:</span>
              <span className="font-medium text-primary">{selectedRange}年</span>
            </div>
          </div>
        </div>
      )}

      {/* 详细控制面板（展开状态） */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 日期选择 */}
            <div className="space-y-1">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={onDateChange}
                disabled={isLoading}
              />
            </div>

            {/* 地点选择 */}
            <div className="space-y-1">
              <LocationSelector
                currentLocation={selectedLocation}
                onLocationChange={onLocationChange}
                disabled={isLoading}
              />
            </div>

            {/* 范围选择 */}
            <div className="space-y-1">
              <HistoricalRangeSelector
                selectedRange={selectedRange}
                onRangeChange={onRangeChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="flex items-center justify-between pt-4 border-t border-custom">
            <div className="flex items-center space-x-2 text-sm text-secondary">
              {isLoading && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span>正在加载数据...</span>
                </>
              )}
              {!isLoading && (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>数据已加载</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                收起面板
              </button>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">💡 使用提示</p>
                <ul className="space-y-1 text-xs">
                  <li>• 选择任意历史日期，查看该日期在不同年份的天气对比</li>
                  <li>• 搜索全球城市，对比不同地区的气候特征</li>
                  <li>• 调整年份范围，观察长期气候趋势变化</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalControlsPanel;