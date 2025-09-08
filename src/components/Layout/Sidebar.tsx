import React, { useState } from 'react';
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { useAppStore } from '../../store/appStore';
import { Location } from '../../types/weather';
import clsx from 'clsx';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    selectedLocations, 
    addLocation, 
    removeLocation,
    clearLocations,
    queryHistory 
  } = useAppStore();

  const [newLocationName, setNewLocationName] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  // Sample locations for demo
  const sampleLocations: Location[] = [
    { id: '1', name: '北京', latitude: 39.9042, longitude: 116.4074, country: 'China', timezone: 'Asia/Shanghai' },
    { id: '2', name: '上海', latitude: 31.2304, longitude: 121.4737, country: 'China', timezone: 'Asia/Shanghai' },
    { id: '3', name: '深圳', latitude: 22.3193, longitude: 114.1694, country: 'China', timezone: 'Asia/Shanghai' },
    { id: '4', name: '纽约', latitude: 40.7128, longitude: -74.0060, country: 'USA', timezone: 'America/New_York' },
    { id: '5', name: '伦敦', latitude: 51.5074, longitude: -0.1278, country: 'UK', timezone: 'Europe/London' },
  ];

  const handleAddLocation = (location: Location) => {
    addLocation(location);
    setNewLocationName('');
    setIsAddingLocation(false);
  };

  const handleQuickAddLocation = (locationName: string) => {
    const sampleLocation = sampleLocations.find(loc => 
      loc.name.toLowerCase().includes(locationName.toLowerCase())
    );
    
    if (sampleLocation) {
      handleAddLocation(sampleLocation);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-secondary border-r border-custom">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-custom">
        <h2 className="text-lg font-semibold text-primary">控制面板</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded-md text-secondary hover:bg-tertiary lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Query Section */}
        <div className="p-4 border-b border-custom">
          <h3 className="text-sm font-medium text-primary mb-3">快速查询</h3>
          <div className="space-y-2">
            {[
              '北京过去一年的气温趋势',
              '比较上海和深圳的降雨量',
              '全球气温变化趋势分析'
            ].map((query, index) => (
              <button
                key={index}
                className={clsx(
                  'w-full text-left p-2 text-xs rounded-md',
                  'bg-tertiary hover:bg-primary-50 text-secondary hover:text-primary-600',
                  'transition-colors duration-200'
                )}
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Location Manager */}
        <div className="p-4 border-b border-custom">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-primary">地点管理</h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setIsAddingLocation(!isAddingLocation)}
                className="p-1 rounded text-secondary hover:bg-tertiary"
                title="添加地点"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              {selectedLocations.length > 0 && (
                <button
                  onClick={clearLocations}
                  className="p-1 rounded text-secondary hover:bg-tertiary hover:text-red-600"
                  title="清空所有地点"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Add location input */}
          {isAddingLocation && (
            <div className="mb-3 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="搜索全球城市名称..."
                  className={clsx(
                    'w-full pl-8 pr-3 py-2 text-sm rounded-md',
                    'bg-primary border border-custom',
                    'text-primary placeholder-text-secondary',
                    'focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                  )}
                />
                <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary" />
              </div>
              
              {/* Quick suggestions */}
              <div className="grid grid-cols-2 gap-1">
                {sampleLocations
                  .filter(loc => 
                    newLocationName === '' || 
                    loc.name.toLowerCase().includes(newLocationName.toLowerCase())
                  )
                  .slice(0, 4)
                  .map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleAddLocation(location)}
                      className={clsx(
                        'p-1 text-xs rounded text-left',
                        'bg-tertiary hover:bg-primary-50 text-secondary hover:text-primary-600',
                        'transition-colors duration-200'
                      )}
                    >
                      {location.name}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Selected locations */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedLocations.length === 0 ? (
              <p className="text-xs text-secondary text-center py-4">
                还未添加任何地点
              </p>
            ) : (
              selectedLocations.map((location) => (
                <div
                  key={location.id}
                  className={clsx(
                    'flex items-center justify-between p-2 rounded-md',
                    'bg-tertiary hover:bg-primary-50',
                    'transition-colors duration-200'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-primary">{location.name}</p>
                      <p className="text-xs text-secondary">{location.country}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLocation(location.id)}
                    className="p-1 rounded text-secondary hover:text-red-600 hover:bg-red-50"
                    title="移除地点"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Query History */}
        <div className="p-4 border-b border-custom">
          <div className="flex items-center space-x-2 mb-3">
            <ClockIcon className="h-4 w-4 text-secondary" />
            <h3 className="text-sm font-medium text-primary">查询历史</h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {queryHistory.length === 0 ? (
              <p className="text-xs text-secondary text-center py-4">
                暂无查询历史
              </p>
            ) : (
              queryHistory.slice(0, 10).map((query, index) => (
                <button
                  key={query.id || index}
                  className={clsx(
                    'w-full text-left p-2 text-xs rounded-md',
                    'bg-tertiary hover:bg-primary-50 text-secondary hover:text-primary-600',
                    'transition-colors duration-200'
                  )}
                >
                  <p className="truncate">{query.text}</p>
                  <p className="text-xs text-secondary mt-1">
                    {new Date(query.timestamp).toLocaleString('zh-CN')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ChartBarIcon className="h-4 w-4 text-secondary" />
            <h3 className="text-sm font-medium text-primary">高级选项</h3>
          </div>

          <div className="space-y-3">
            {/* Time Range */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                时间范围
              </label>
              <select className={clsx(
                'w-full px-2 py-1 text-sm rounded border border-custom',
                'bg-primary text-primary',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}>
                <option value="1year">过去一年</option>
                <option value="5years">过去五年</option>
                <option value="10years">过去十年</option>
                <option value="20years">过去二十年</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            {/* Data Granularity */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                数据粒度
              </label>
              <select className={clsx(
                'w-full px-2 py-1 text-sm rounded border border-custom',
                'bg-primary text-primary',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}>
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                图表类型
              </label>
              <select className={clsx(
                'w-full px-2 py-1 text-sm rounded border border-custom',
                'bg-primary text-primary',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}>
                <option value="line">折线图</option>
                <option value="area">面积图</option>
                <option value="bar">柱状图</option>
                <option value="heatmap">热力图</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex lg:flex-shrink-0',
        className
      )}>
        <div className="w-80">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Dialog
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
        
        <div className="fixed inset-0 flex">
          <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
            <SidebarContent />
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default Sidebar;