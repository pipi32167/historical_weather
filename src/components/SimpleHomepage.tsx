import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, ChartBarIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { QuickLocationSelector } from './common/QuickLocationSelector';
import { useLocationStore } from '../store/locationStore';

const SimpleHomepage: React.FC = () => {
  const navigate = useNavigate();
  const { currentLocation } = useLocationStore();

  const handleStartAnalysis = () => {
    if (currentLocation) {
      navigate('/historical/daily');
    }
  };

  const analysisTypes = [
    {
      id: 'daily',
      title: '本日历史同期',
      description: '查看指定日期在历史年份中的天气表现',
      icon: CalendarDaysIcon,
      path: '/historical/daily',
      color: 'bg-blue-500'
    },
    {
      id: 'monthly', 
      title: '本月历史同期',
      description: '分析指定月份在多年中的温度变化趋势',
      icon: ClockIcon,
      path: '/historical/monthly',
      color: 'bg-green-500'
    },
    {
      id: 'quarterly',
      title: '本季度历史同期', 
      description: '了解季节性气候特征和长期变化规律',
      icon: ChartBarIcon,
      path: '/historical/quarterly',
      color: 'bg-orange-500'
    },
    {
      id: 'yearly',
      title: '本年度历史同期',
      description: '分析多年的年度温度变化趋势',
      icon: ChartBarIcon,
      path: '/historical/yearly',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            历史天气数据分析平台
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            选择位置，即可获取丰富的历史同期天气数据分析
          </p>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">全球城市支持</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">支持全球任意城市的历史天气查询</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">多维度分析</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">日、月、季度、年度历史同期对比</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">丰富历史数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">基于 Open-Meteo 的80年历史数据</p>
          </div>
        </div>
      </div>

      {/* Location Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MapPinIcon className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            第一步：选择分析位置
          </h2>
        </div>
        <QuickLocationSelector compact={false} />
      </div>

      {/* Quick Start */}
      {currentLocation && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              第二步：开始分析 {currentLocation.name} 的历史天气数据
            </h2>
            <button
              onClick={handleStartAnalysis}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              立即开始分析
            </button>
          </div>
        </div>
      )}

      {/* Analysis Types */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
          分析类型
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => navigate(type.path)}
              disabled={!currentLocation}
              className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                currentLocation
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${type.color} bg-opacity-10`}>
                  <type.icon className={`h-6 w-6 text-current`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {!currentLocation && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            请先选择位置以启用分析功能
          </p>
        )}
      </div>

      {/* User Guide */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          使用指南
        </h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>从预设城市中选择，或切换到收藏、最近使用的位置</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>点击"立即开始分析"或选择具体的分析类型</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>在分析页面中调整日期/时间范围，查看历史同期数据对比</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHomepage;