import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openMeteoService, OpenMeteoLocation } from '../services/openMeteoWeather';
import { localizedPlaceLabel } from '../utils/placeDisplay';
import { getCityLocalizedName } from '../data/cityMappings';
import { Location } from '../types/weather';

interface CitySearchBoxProps {
  placeholder?: string;
  className?: string;
}

const CitySearchBox: React.FC<CitySearchBoxProps> = ({
  placeholder,
  className = ""
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenMeteoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防抖搜索
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchCities(query.trim());
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  // 搜索城市
  const searchCities = async (searchQuery: string) => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await openMeteoService.geocodeCity(
        searchQuery,
        i18n.language.startsWith('zh') ? 'zh' : 'en', // 根据当前语言设置
        8 // 最多8个结果
      );

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      setSelectedIndex(-1);

      if (searchResults.length === 0) {
        setError(t('location.noResults'));
      }
    } catch (error) {
      console.error('搜索城市失败:', error);
      setError(t('location.searchError'));
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理城市选择
  const handleCitySelect = (location: OpenMeteoLocation) => {
    const locationParam = `${location.latitude},${location.longitude}`;
    const cityName = encodeURIComponent(location.name);
    
    // 清空搜索状态
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    
    // 导航到动态位置页面
    navigate(`/location/${encodeURIComponent(locationParam)}?name=${cityName}`);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleCitySelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 格式化城市显示名称
  const formatCityDisplay = (location: OpenMeteoLocation | Location) => {
    const parts = [];
    
    // 如果是Location类型（来自cityMappings），使用本地化名称
    if ('timezone' in location) {
      parts.push(getCityLocalizedName(location as Location, t));
    } else {
      // 如果是OpenMeteoLocation类型，使用原名称
      // 带上 admin2（地级市），否则「南京, 云南, 中国」无法区分同名地点
      const openMeteoLocation = location as OpenMeteoLocation;
      return localizedPlaceLabel(openMeteoLocation, t, i18n.language);
    }
    
    // 如果是Location类型，还需要添加country信息
    const locationWithCountry = location as Location;
    if (locationWithCountry.country) parts.push(locationWithCountry.country);
    return parts.join(', ');
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder || t('common.searchCity')}
          className="w-full px-4 py-3 pl-12 pr-16 border border-custom rounded-lg bg-primary text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          aria-label={t('location.searchCity')}
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-activedescendant={selectedIndex >= 0 ? `city-option-${selectedIndex}` : undefined}
        />
        
        {/* 搜索图标 */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* 清空按钮 */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              setError(null);
              searchInputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary p-1"
            aria-label={t('common.clearSearch')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索结果下拉列表 */}
      {showResults && (results.length > 0 || error) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-primary border border-custom rounded-lg shadow-lg z-50 max-h-96 overflow-auto"
          role="listbox"
          aria-label={t('common.searchResults')}
        >
          {error && (
            <div className="p-3 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 border-b border-custom">
              ⚠️ {error}
            </div>
          )}

          {results.map((location, index) => (
            <button
              key={`${location.id}-${location.latitude}-${location.longitude}`}
              id={`city-option-${index}`}
              onClick={() => handleCitySelect(location)}
              className={`w-full text-left p-3 hover:bg-secondary transition-colors border-b border-custom last:border-b-0 ${
                selectedIndex === index ? 'bg-secondary' : ''
              }`}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="font-medium text-primary">
                {formatCityDisplay(location)}
              </div>
              <div className="text-xs text-secondary mt-1 flex items-center space-x-4">
                <span>📍 {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</span>
                {location.population && (
                  <span>👥 {location.population.toLocaleString()}</span>
                )}
                <span>🌐 Open-Meteo</span>
              </div>
            </button>
          ))}

          {results.length > 0 && (
            <div className="p-2 text-xs text-secondary bg-secondary border-t border-custom">
              💡 {t('location.keyboardNavHint')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySearchBox;