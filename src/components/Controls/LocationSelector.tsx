import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Location } from '../../types/weather';
import { useWeatherData } from '../../hooks/useWeatherData';
import { getCityLocalizedName } from '../../data/cityMappings';

interface LocationSelectorProps {
  currentLocation: Location;
  onLocationChange: (location: Location) => void;
  disabled?: boolean;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
  onLocationChange,
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { searchLocations } = useWeatherData({ useRealData: true });

  // 预设热门城市
  const popularCities: Location[] = [
    { id: 'shanghai', name: '上海', latitude: 31.2304, longitude: 121.4737, country: 'China', timezone: 'Asia/Shanghai' },
    { id: 'beijing', name: '北京', latitude: 39.9042, longitude: 116.4074, country: 'China', timezone: 'Asia/Shanghai' },
    { id: 'guangzhou', name: '广州', latitude: 23.1291, longitude: 113.2644, country: 'China', timezone: 'Asia/Shanghai' },
    { id: 'shenzhen', name: '深圳', latitude: 22.3193, longitude: 114.1694, country: 'China', timezone: 'Asia/Shanghai' },
    { id: 'hangzhou', name: '杭州', latitude: 30.2741, longitude: 120.1551, country: 'China', timezone: 'Asia/Shanghai' },
    { id: 'nanjing', name: '南京', latitude: 32.0603, longitude: 118.7969, country: 'China', timezone: 'Asia/Shanghai' },
  ];

  // 搜索防抖
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results.slice(0, 8)); // 限制结果数量
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchLocations]);

  // 点击外部关闭搜索
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: Location) => {
    onLocationChange(location);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
  };

  const displayResults = searchQuery.trim() ? searchResults : popularCities;

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <label className="block text-sm font-medium text-secondary mb-2">
        📍 选择查询地点
      </label>
      
      {/* 当前选中的地点 */}
      <div className="mb-2 p-3 bg-primary-100 dark:bg-primary-700 rounded-lg border border-custom">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🏙️</span>
          <div>
            <div className="font-semibold text-primary">{currentLocation.name}</div>
            <div className="text-xs text-secondary">
              {currentLocation.country} • {currentLocation.latitude.toFixed(2)}°, {currentLocation.longitude.toFixed(2)}°
            </div>
          </div>
        </div>
      </div>

      {/* 搜索输入框 */}
      <div className="relative">
        <input
          type="text"
          placeholder="搜索城市名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="w-full px-4 py-2 pl-10 border border-custom rounded-lg bg-primary text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {isSearching && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {isSearchOpen && displayResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-primary border border-custom rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="py-1">
            {!searchQuery.trim() && (
              <div className="px-3 py-2 text-xs text-secondary border-b border-custom">
                🔥 热门城市
              </div>
            )}
            {displayResults.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="w-full px-3 py-2 text-left hover:bg-secondary focus:bg-secondary focus:outline-none group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm">🏙️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-primary group-hover:text-primary-600">
                      {getCityLocalizedName(location, t)}
                    </div>
                    <div className="text-xs text-secondary truncate">
                      {location.country} {location.admin1 ? `• ${location.admin1}` : ''}
                    </div>
                  </div>
                  {location.id === currentLocation.id && (
                    <span className="text-primary-500 text-xs">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;