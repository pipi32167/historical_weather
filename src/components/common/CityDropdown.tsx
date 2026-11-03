import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Search,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { getCitiesByRegion, getCityLocalizedName } from '../../data/cityMappings';
import { openMeteoService, OpenMeteoLocation } from '../../services/openMeteoWeather';
import { localizedPlaceName, localizedRegionLabel } from '../../utils/placeDisplay';
import { useLocationStore } from '../../store/locationStore';
import { Location } from '../../types/weather';

interface CityDropdownProps {
  className?: string;
}

const CityDropdown: React.FC<CityDropdownProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentLocation, setCurrentLocation } = useLocationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenMeteoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'continents' | 'search'>('continents');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cities by region
  const citiesByRegion = getCitiesByRegion();
  
  const continents = [
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

  // Search cities
  const searchCities = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
      const results = await openMeteoService.geocodeCity(query, language, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Search cities failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [i18n.language]);

  // Debounce search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (activeTab === 'search' && searchQuery.trim().length >= 2) {
      debounceTimeoutRef.current = setTimeout(() => {
        void searchCities(searchQuery.trim());
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
  }, [searchQuery, activeTab, searchCities]);

  // Handle city selection - directly navigate to city
  const handleCitySelect = (city: Location | OpenMeteoLocation) => {
    let finalLocation: Location;
    const openMeteoCity = city as OpenMeteoLocation;
    const isPredefinedCity =
      'id' in city &&
      typeof city.id === 'string' &&
      !city.id.startsWith('search-') &&
      city.id !== 'current-location';

    // Convert to Location if needed
    if (isPredefinedCity) {
      finalLocation = city as Location;
    } else {
      finalLocation = {
        id: `search-${openMeteoCity.latitude}-${openMeteoCity.longitude}`,
        name: openMeteoCity.name,
        latitude: openMeteoCity.latitude,
        longitude: openMeteoCity.longitude,
        country: openMeteoCity.country || 'Unknown',
        timezone: 'auto'
      };
    }

    // Update location store
    setCurrentLocation(finalLocation);

    // Navigate based on selected city
    if (isPredefinedCity) {
      // Using a predefined city ID (but not current-location)
      navigate(`/city/${finalLocation.id}`);
    } else if (openMeteoCity.source === 'china-districts') {
      // 离线行政区结果：跳到对应的 SEO 落地页（/city/kunshan），而不是回首页
      void import('../../utils/citySlug')
        .then(({ cityPathForAdcode }) => {
          const path = cityPathForAdcode(Number(openMeteoCity.id));
          navigate(path || '/');
        })
        .catch(() => navigate('/'));
    } else {
      // Using current location or a non-indexed search result - go to home page
      navigate('/');
    }

    // Reset state
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get city display name
  const getCityDisplayName = (city: Location | OpenMeteoLocation) =>
    localizedPlaceName(city as Location, t, i18n.language);

  // Click outside handler
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
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-secondary hover:text-primary transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden lg:inline">
          {currentLocation ? getCityDisplayName(currentLocation) : t('navigation.cities')}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-primary border border-custom rounded-lg shadow-lg z-50 max-h-[36rem] overflow-visible">
          {/* Current location indicator */}
          {currentLocation && (
            <div className="p-3 border-b border-custom bg-primary-50 dark:bg-primary-900/20">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary">
                  {getCityDisplayName(currentLocation)}
                </span>
              </div>
            </div>
          )}
              {/* Tabs header */}
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

              {/* Content area */}
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
                    {/* Search input */}
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

                    {/* Search results */}
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
                                  {getCityDisplayName(city)}
                                </div>
                                <div className="text-xs text-secondary">
                                  {localizedRegionLabel(city, t, i18n.language)}
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