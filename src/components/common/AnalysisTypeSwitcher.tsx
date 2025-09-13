import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  ChartBarSquareIcon, 
  PresentationChartLineIcon 
} from '@heroicons/react/24/outline';

interface AnalysisTypeSwitcherProps {
  compact?: boolean;
  className?: string;
}

interface AnalysisType {
  id: string;
  name: string;
  shortName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

export const AnalysisTypeSwitcher: React.FC<AnalysisTypeSwitcherProps> = ({ 
  compact = false, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const analysisTypes: AnalysisType[] = [
    {
      id: 'daily',
      name: '本日历史同期',
      shortName: '日',
      path: '/historical/daily',
      icon: CalendarDaysIcon,
      description: '查看指定日期在历史年份中的天气表现',
      color: 'blue'
    },
    {
      id: 'monthly',
      name: '本月历史同期',
      shortName: '月',
      path: '/historical/monthly',
      icon: ClockIcon,
      description: '分析指定月份在多年中的温度变化趋势',
      color: 'green'
    },
    {
      id: 'quarterly',
      name: '本季度历史同期',
      shortName: '季',
      path: '/historical/quarterly',
      icon: ChartBarSquareIcon,
      description: '了解季节性气候特征和长期变化规律',
      color: 'orange'
    },
    {
      id: 'yearly',
      name: '本年度历史同期',
      shortName: '年',
      path: '/historical/yearly',
      icon: PresentationChartLineIcon,
      description: '分析多年的年度温度变化趋势',
      color: 'purple'
    }
  ];

  const handleSwitchAnalysis = (type: AnalysisType) => {
    navigate(type.path);
  };

  const getCurrentAnalysisType = () => {
    return analysisTypes.find(type => location.pathname === type.path);
  };

  const currentType = getCurrentAnalysisType();

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700'
        : 'text-blue-600 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:bg-blue-900/10 dark:border-blue-800',
      green: isActive
        ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
        : 'text-green-600 hover:bg-green-50 border-green-200 dark:text-green-400 dark:hover:bg-green-900/10 dark:border-green-800',
      orange: isActive
        ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
        : 'text-orange-600 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:bg-orange-900/10 dark:border-orange-800',
      purple: isActive
        ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700'
        : 'text-purple-600 hover:bg-purple-50 border-purple-200 dark:text-purple-400 dark:hover:bg-purple-900/10 dark:border-purple-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (compact) {
    return (
      <div className={`analysis-type-switcher-compact ${className}`}>
        <div className="flex items-center space-x-1">
          {analysisTypes.map((type) => {
            const isActive = location.pathname === type.path;
            const IconComponent = type.icon;
            
            return (
              <button
                key={type.id}
                onClick={() => handleSwitchAnalysis(type)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${getColorClasses(type.color, isActive)}`}
                title={type.description}
              >
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`analysis-type-switcher ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            分析类型
          </h3>
          {currentType && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              当前: {currentType.name}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {analysisTypes.map((type) => {
            const isActive = location.pathname === type.path;
            const IconComponent = type.icon;
            
            return (
              <button
                key={type.id}
                onClick={() => handleSwitchAnalysis(type)}
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 text-left ${getColorClasses(type.color, isActive)}`}
                title={type.description}
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {type.shortName}
                  </div>
                  <div className="text-xs opacity-75 truncate">
                    {type.name.replace('本', '').replace('历史同期', '')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {currentType && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentType.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};