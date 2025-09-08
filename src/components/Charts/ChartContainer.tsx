import React, { useState } from 'react';
import {
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onFullscreen?: () => void;
  onDownload?: () => void;
  onSettings?: () => void;
  chartType?: 'line' | 'area' | 'bar' | 'heatmap';
  onChartTypeChange?: (type: 'line' | 'area' | 'bar' | 'heatmap') => void;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  isLoading = false,
  error = null,
  className,
  onFullscreen,
  onDownload,
  onSettings,
  chartType = 'line',
  onChartTypeChange,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onFullscreen?.();
  };

  const chartTypes = [
    { type: 'line' as const, icon: PresentationChartLineIcon, label: '折线图' },
    { type: 'area' as const, icon: ChartBarIcon, label: '面积图' },
    { type: 'bar' as const, icon: ChartBarIcon, label: '柱状图' },
    { type: 'heatmap' as const, icon: ChartBarIcon, label: '热力图' },
  ];

  return (
    <div className={clsx(
      'bg-primary border border-custom rounded-lg overflow-hidden',
      'shadow-sm hover:shadow-md transition-shadow duration-200',
      isFullscreen && 'fixed inset-4 z-50',
      className
    )}>
      {/* Chart Header/Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-custom bg-secondary">
        {/* Left section - Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-primary truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-secondary mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Chart type selector */}
          {onChartTypeChange && (
            <div className="flex items-center bg-primary border border-custom rounded-lg p-1">
              {chartTypes.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => onChartTypeChange(type)}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors duration-200',
                    chartType === type
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400'
                      : 'text-secondary hover:bg-secondary hover:text-primary'
                  )}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {onSettings && (
              <button
                onClick={onSettings}
                className="p-2 rounded-lg text-secondary hover:bg-tertiary hover:text-primary transition-colors duration-200"
                title="图表设置"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </button>
            )}

            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 rounded-lg text-secondary hover:bg-tertiary hover:text-primary transition-colors duration-200"
                title="下载数据"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg text-secondary hover:bg-tertiary hover:text-primary transition-colors duration-200"
              title={isFullscreen ? '退出全屏' : '全屏显示'}
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="relative flex-1">
        {error ? (
          // Error state
          <div className="flex items-center justify-center h-64 text-red-600">
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-lg font-medium">数据加载失败</p>
              <p className="text-sm text-secondary mt-1">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          // Loading state with skeleton
          <div className="p-4">
            <LoadingSkeleton />
          </div>
        ) : (
          // Chart content
          <div className="p-4 h-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    {/* Chart title skeleton */}
    <div className="h-4 bg-secondary rounded w-1/3"></div>
    
    {/* Chart area skeleton */}
    <div className="h-64 bg-secondary rounded relative">
      {/* Simulate chart lines */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary-100 to-transparent rounded"></div>
    </div>
    
    {/* Legend skeleton */}
    <div className="flex space-x-4">
      <div className="h-3 bg-secondary rounded w-16"></div>
      <div className="h-3 bg-secondary rounded w-16"></div>
      <div className="h-3 bg-secondary rounded w-16"></div>
    </div>
  </div>
);

export default ChartContainer;