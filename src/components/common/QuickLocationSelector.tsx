import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationStore } from '../../store/locationStore';
import { getCityLocalizedName } from '../../data/cityMappings';
import { MapPin, Star, Heart, ChevronDown, ChevronUp, Search, X, Loader2 } from 'lucide-react';
import { Location } from '../../types/weather';
import { geocodingService } from '../../services/geocodingService';
import { useDebounce } from '../../hooks/useDebounce';

interface QuickLocationSelectorProps {
  compact?: boolean;
  showFavorites?: boolean;
  onLocationChange?: (location: Location) => void;
  defaultCollapsed?: boolean;
}

export const QuickLocationSelector: React.FC<QuickLocationSelectorProps> = ({
  compact = false,
  showFavorites = true,
  onLocationChange,
  defaultCollapsed = false
}) => {
  const { t, i18n } = useTranslation();
  const {
    currentLocation,
    recentLocations,
    favoriteLocations,
    setCurrentLocation,
    addToFavorites,
    removeFromFavorites
  } = useLocationStore();

  const [activeTab, setActiveTab] = useState<'preset' | 'recent' | 'favorites' | 'search'>('preset');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const presetLocations: Location[] = [
    { id: 'beijing', name: t('cities.beijing'), latitude: 39.9042, longitude: 116.4074, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'shanghai', name: t('cities.shanghai'), latitude: 31.2304, longitude: 121.4737, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'guangzhou', name: t('cities.guangzhou'), latitude: 23.1291, longitude: 113.2644, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'shenzhen', name: t('cities.shenzhen'), latitude: 22.5431, longitude: 114.0579, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'chengdu', name: t('cities.chengdu'), latitude: 30.5728, longitude: 104.0668, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'hangzhou', name: t('cities.hangzhou'), latitude: 30.2741, longitude: 120.1551, country: t('countries.china'), timezone: 'Asia/Shanghai' },
    { id: 'tokyo', name: t('cities.tokyo'), latitude: 35.6762, longitude: 139.6503, country: t('countries.japan'), timezone: 'Asia/Tokyo' },
    { id: 'newyork', name: t('cities.newyork'), latitude: 40.7128, longitude: -74.0060, country: t('countries.usa'), timezone: 'America/New_York' },
    { id: 'london', name: t('cities.london'), latitude: 51.5074, longitude: -0.1278, country: t('countries.uk'), timezone: 'Europe/London' },
    { id: 'paris', name: t('cities.paris'), latitude: 48.8566, longitude: 2.3522, country: t('countries.france'), timezone: 'Europe/Paris' },
    { id: 'sydney', name: t('cities.sydney'), latitude: -33.8688, longitude: 151.2093, country: t('countries.australia'), timezone: 'Australia/Sydney' },
    { id: 'singapore', name: t('cities.singapore'), latitude: 1.3521, longitude: 103.8198, country: t('countries.singapore'), timezone: 'Asia/Singapore' },
  ];

  const handleLocationSelect = (location: Location) => {
    setCurrentLocation(location);
    onLocationChange?.(location);
  };

  const handleToggleFavorite = (location: Location, event: React.MouseEvent) => {
    event.stopPropagation();
    const isFavorite = favoriteLocations.some(l => l.id === location.id);
    if (isFavorite) {
      removeFromFavorites(location.id);
    } else {
      addToFavorites(location);
    }
  };

  const isFavorite = (location: Location) => {
    return favoriteLocations.some(l => l.id === location.id);
  };

  // 搜索城市
  const searchCities = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await geocodingService.searchCities(query, i18n.language);
      setSearchResults(results);
      setSelectedIndex(-1); // 重置选择索引
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : t('location.searchError'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [t, i18n.language]);

  // 处理搜索输入
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (!value.trim()) {
      setSearchResults([]);
      setSearchError(null);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleLocationSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setSearchQuery('');
        setSearchResults([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // 切换到搜索tab时聚焦输入框
  const handleSearchTabClick = () => {
    setActiveTab('search');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // 监听防抖查询，执行搜索
  useEffect(() => {
    if (activeTab === 'search' && debouncedSearchQuery) {
      searchCities(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, activeTab, searchCities]);

  const LocationGrid: React.FC<{ locations: Location[]; isSearchMode?: boolean }> = ({ locations, isSearchMode = false }) => (
    <div className={`grid gap-2 ${
      compact 
        ? 'grid-cols-3 lg:grid-cols-6' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
    }`}>
      {locations.map((location, index) => (
        <div key={location.id} className="relative group">
          <button
            onClick={() => handleLocationSelect(location)}
            className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
              currentLocation?.id === location.id
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400'
                : isSearchMode && selectedIndex === index
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-200 hover:bg-primary-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{location.displayName || getCityLocalizedName(location, t)}</span>
              {showFavorites && (
                <div
                  onClick={(e) => handleToggleFavorite(location, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={isFavorite(location) ? t('location.removeFromFavorites') : t('location.addToFavorites')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Create a mock mouse event for keyboard interactions
                      const mockEvent = {
                        preventDefault: () => {},
                        stopPropagation: () => e.stopPropagation()
                      } as React.MouseEvent;
                      handleToggleFavorite(location, mockEvent);
                    }
                  }}
                >
                  {isFavorite(location) ? (
                    <Heart className="h-3 w-3 text-red-500 fill-current" />
                  ) : (
                    <Heart className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {location.country}
            </p>
          </button>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="quick-location-selector compact">
        <div className="current-location mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {currentLocation?.name || t('location.notSelected')}
            </span>
          </div>
        </div>
        <LocationGrid locations={presetLocations.slice(0, 6)} />
      </div>
    );
  }

  return (
    <div className="quick-location-selector">
      {/* 当前位置显示和折叠按钮 */}
      <div className="current-location mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {t('location.currentSelection')}: {currentLocation?.name || t('location.notSelected')}
            </span>
            {currentLocation && (
              <span className="text-sm text-gray-500">
                ({currentLocation.latitude.toFixed(2)}, {currentLocation.longitude.toFixed(2)})
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
          >
            <span>{isCollapsed ? t('location.expand') : t('location.collapse')}</span>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 标签切换和位置网格 - 可折叠 */}
      <div className={`location-selector-content overflow-hidden transition-all duration-300 ${
        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
      }`}>
        {/* 标签切换 */}
        <div className="tabs mb-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preset'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('location.popularCities')}
          </button>
          <button
            onClick={handleSearchTabClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-1">
              <Search className="h-3 w-3" />
              <span>{t('location.search')}</span>
            </div>
          </button>
          {recentLocations.length > 1 && (
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('location.recent')} ({recentLocations.length})
            </button>
          )}
          {showFavorites && favoriteLocations.length > 0 && (
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{t('location.favorites')} ({favoriteLocations.length})</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 搜索输入框 */}
      {activeTab === 'search' && (
        <div className="search-input mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('location.searchPlaceholder')}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 位置网格 */}
      <div className="locations-content">
        {activeTab === 'preset' && <LocationGrid locations={presetLocations} />}
        {activeTab === 'recent' && recentLocations.length > 0 && (
          <LocationGrid locations={recentLocations} />
        )}
        {activeTab === 'favorites' && favoriteLocations.length > 0 && (
          <LocationGrid locations={favoriteLocations} />
        )}
        {activeTab === 'search' && (
          <>
            {searchError && (
              <div className="text-center text-red-500 dark:text-red-400 py-4">
                <p>{searchError}</p>
              </div>
            )}
            {!searchError && searchResults.length > 0 && (
              <LocationGrid locations={searchResults} isSearchMode={true} />
            )}
            {!searchError && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>{t('location.noResults')}</p>
              </div>
            )}
            {!searchQuery && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>{t('location.searchCity')}</p>
                <p className="text-sm mt-1">{t('location.searchPlaceholder')}</p>
              </div>
            )}
            {isSearching && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>{t('location.searching')}</p>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'recent' && recentLocations.length <= 1 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>{t('location.noRecentLocations')}</p>
          </div>
        )}
        
        {activeTab === 'favorites' && favoriteLocations.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Heart className="h-8 w-8 mx-auto mb-2" />
            <p>{t('location.noFavoriteLocations')}</p>
            <p className="text-sm mt-1">{t('location.favoriteInstruction')}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};