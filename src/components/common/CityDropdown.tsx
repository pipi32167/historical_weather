import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, MapPin, ChevronDown } from 'lucide-react';
import { getCitiesByRegion, getCityLocalizedName } from '../../data/cityMappings';
import { openMeteoService, OpenMeteoLocation } from '../../services/openMeteoWeather';
import { useLocationStore } from '../../store/locationStore';
import { Location } from '../../types/weather';

interface CityDropdownProps {
  className?: string;
}

const CityDropdown: React.FC<CityDropdownProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const { setCurrentLocation } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenMeteoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'continents' | 'search'>('continents');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 按大洲分类的城市数据
  const citiesByRegion = getCitiesByRegion();

  // 大洲配置
  const continents = [
    {
      key: 'china',
      nameKey: 'location.continents.china',
      icon: '🇨🇳',
      cities: citiesByRegion.china
    },
    {
      key: 'asia',
      nameKey: 'location.continents.asia',
      icon: '🌏',
      cities: citiesByRegion.asia
    },
    {
      key: 'europe',
      nameKey: 'location.continents.europe',
      icon: '🇪🇺',
      cities: citiesByRegion.europe
    },
    {
      key: 'americas',
      nameKey: 'location.continents.americas',
      icon: '🌎',
      cities: citiesByRegion.americas
    },
    {
      key: 'africa',
      nameKey: 'location.continents.africa',
      icon: '🌍',
      cities: citiesByRegion.africa
    },
    {
      key: 'oceania',
      nameKey: 'location.continents.oceania',
      icon: '🇦🇺',
      cities: citiesByRegion.oceania
    }
  ].filter(continent => continent.cities.length > 0);

  // 防抖搜索
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (activeTab === 'search' && searchQuery.trim().length >= 2) {
      debounceTimeoutRef.current = setTimeout(() => {
        searchCities(searchQuery.trim());
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, activeTab]);

  // 搜索城市
  const searchCities = async (query: string) => {
    setIsSearching(true);
    try {
      // 根据当前语言设置搜索语言参数
      const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
      const results = await openMeteoService.geocodeCity(query, language, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Search cities failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理城市选择
  const handleCitySelect = (city: Location | OpenMeteoLocation) => {
    let location: Location;
    
    if ('timezone' in city) {
      // cityMappings中的Location (有timezone字段)
      location = city as Location;
    } else {
      // 搜索结果中的OpenMeteoLocation
      const openMeteoCity = city as OpenMeteoLocation;
      location = {
        id: `search-${openMeteoCity.latitude}-${openMeteoCity.longitude}`,
        name: openMeteoCity.name,
        latitude: openMeteoCity.latitude,
        longitude: openMeteoCity.longitude,
        country: openMeteoCity.country || 'Unknown',
        timezone: 'auto'
      };
    }
    
    setCurrentLocation(location);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 点击外部关闭和键盘处理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-secondary hover:bg-secondary hover:text-primary transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden lg:inline">{t('navigation.cities')}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-primary border border-custom rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* 标签页头部 */}
          <div className="border-b border-custom">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('continents');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'continents'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-secondary hover:text-primary hover:bg-secondary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{t('location.continents.title')}</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('search');
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'search'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-secondary hover:text-primary hover:bg-secondary'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>{t('location.search')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'continents' && (
              <div className="p-2">
                {continents.map((continent) => (
                  <div key={continent.key} className="mb-4 last:mb-0">
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-primary bg-secondary rounded-lg mb-2">
                      <span className="text-lg">{continent.icon}</span>
                      <span>{t(continent.nameKey)}</span>
                      <span className="text-xs text-secondary ml-auto">
                        ({continent.cities.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {continent.cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-primary hover:bg-secondary rounded-lg transition-colors duration-150 text-left"
                        >
                          <MapPin className="h-3 w-3 text-secondary flex-shrink-0" />
                          <span className="truncate">{getCityLocalizedName(city, t)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="p-4">
                {/* 搜索输入框 */}
                <div className="relative mb-4">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('location.searchPlaceholder')}
                    className="w-full px-4 py-2 pl-10 border border-custom rounded-lg bg-primary text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* 搜索结果 */}
                {searchQuery.length >= 2 && (
                  <div>
                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((city, index) => (
                          <button
                            key={`${city.latitude}-${city.longitude}-${index}`}
                            onClick={() => handleCitySelect(city)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors duration-150"
                          >
                            <div className="font-medium text-primary text-sm">
                              {city.name}
                            </div>
                            <div className="text-xs text-secondary">
                              {[city.admin1, city.country].filter(Boolean).join(', ')}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : !isSearching ? (
                      <div className="text-center py-4 text-sm text-secondary">
                        {t('location.noResults')}
                      </div>
                    ) : null}
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-4 text-sm text-secondary">
                    {t('location.searchHint')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityDropdown;