import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  Search, 
  MapPin, 
  ChevronDown, 
  Calendar, 
  Clock, 
  BarChart3, 
  LineChart,
  Settings,
  CalendarDays,
  ArrowRight,
  Check
} from 'lucide-react';
import { getCitiesByRegion, getCityLocalizedName } from '../../data/cityMappings';
import { openMeteoService, OpenMeteoLocation } from '../../services/openMeteoWeather';
import { useLocationStore } from '../../store/locationStore';
import { useAnalysisStore, AnalysisType } from '../../store/analysisStore';
import { Location } from '../../types/weather';
import clsx from 'clsx';

interface CityDropdownWithAnalysisProps {
  className?: string;
}

interface AnalysisTypeConfig {
  id: AnalysisType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const CityDropdownWithAnalysis: React.FC<CityDropdownWithAnalysisProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const { currentAnalysisType, setAnalysisType } = useAnalysisStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenMeteoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'continents' | 'search'>('continents');
  const [selectedCity, setSelectedCity] = useState<Location | OpenMeteoLocation | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>(currentAnalysisType);
  const [showAnalysisSelection, setShowAnalysisSelection] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Analysis types configuration
  const analysisTypes: AnalysisTypeConfig[] = [
    {
      id: 'daily',
      name: t('navigation.daily'),
      icon: Calendar,
      description: t('analysisTypes.dailyDescription'),
      color: 'blue'
    },
    {
      id: 'weekly',
      name: t('navigation.historical.weekly'),
      icon: CalendarDays,
      description: t('analysisTypes.weeklyDescription'),
      color: 'teal'
    },
    {
      id: 'monthly',
      name: t('navigation.monthly'),
      icon: Clock,
      description: t('analysisTypes.monthlyDescription'),
      color: 'green'
    },
    {
      id: 'quarterly',
      name: t('navigation.quarterly'),
      icon: BarChart3,
      description: t('analysisTypes.quarterlyDescription'),
      color: 'orange'
    },
    {
      id: 'yearly',
      name: t('navigation.yearly'),
      icon: LineChart,
      description: t('analysisTypes.yearlyDescription'),
      color: 'purple'
    },
    {
      id: 'custom',
      name: t('navigation.historical.custom'),
      icon: Settings,
      description: t('analysisTypes.customDescription'),
      color: 'gray'
    }
  ];

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

  // Debounce search
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

  // Search cities
  const searchCities = async (query: string) => {
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
  };

  // Handle city selection - now shows analysis selection
  const handleCitySelect = (city: Location | OpenMeteoLocation) => {
    // If the same city is already selected and active, directly show analysis selection
    // Otherwise, set the new city and show analysis selection
    setSelectedCity(city);
    setShowAnalysisSelection(true);
    setSelectedAnalysis(currentAnalysisType); // Default to current analysis type
  };

  // Handle analysis type selection
  const handleAnalysisSelect = (analysisType: AnalysisType) => {
    setSelectedAnalysis(analysisType);
  };

  // Confirm selection and navigate
  const handleConfirmSelection = () => {
    if (!selectedCity) return;

    let finalLocation: Location;

    // Convert to Location if needed
    if ('id' in selectedCity && typeof selectedCity.id === 'string' && !selectedCity.id.startsWith('search-')) {
      finalLocation = selectedCity as Location;
    } else {
      const openMeteoCity = selectedCity as OpenMeteoLocation;
      finalLocation = {
        id: `search-${openMeteoCity.latitude}-${openMeteoCity.longitude}`,
        name: openMeteoCity.name,
        latitude: openMeteoCity.latitude,
        longitude: openMeteoCity.longitude,
        country: openMeteoCity.country || 'Unknown',
        timezone: 'auto'
      };
    }

    // Update stores
    setCurrentLocation(finalLocation);
    setAnalysisType(selectedAnalysis);

    // Navigate based on selected city
    // The analysis type is handled by the global store and components will render accordingly
    if ('id' in selectedCity && typeof selectedCity.id === 'string' && !selectedCity.id.startsWith('search-') && selectedCity.id !== 'current-location') {
      // Using a predefined city ID (but not current-location)
      navigate(`/city/${finalLocation.id}`);
    } else {
      // Using current location or search result - go to home page
      navigate('/');
    }

    // Reset state
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCity(null);
    setShowAnalysisSelection(false);
  };

  // Go back to city selection
  const handleBackToCities = () => {
    setShowAnalysisSelection(false);
    setSelectedCity(null);
    setSelectedAnalysis(currentAnalysisType);
  };

  // Get city display name
  const getCityDisplayName = (city: Location | OpenMeteoLocation) => {
    if ('id' in city && typeof city.id === 'string' && !city.id.startsWith('search-')) {
      return getCityLocalizedName(city as Location, t);
    } else {
      const openMeteoCity = city as OpenMeteoLocation;
      return openMeteoCity.name;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAnalysisSelection(false);
        setSelectedCity(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        if (showAnalysisSelection) {
          handleBackToCities();
        } else {
          setIsOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }
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
  }, [isOpen, showAnalysisSelection]);

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
          {/* Quick analysis type change for current location */}
          {currentLocation && !showAnalysisSelection && (
            <div className="p-3 border-b border-custom bg-primary-50 dark:bg-primary-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary">
                    {getCityDisplayName(currentLocation)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCity(currentLocation);
                    setShowAnalysisSelection(true);
                  }}
                  className="text-xs px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors duration-200"
                >
                  {t('analysisTypes.change', { defaultValue: '切换分析类型' })}
                </button>
              </div>
            </div>
          )}
          {!showAnalysisSelection ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col max-h-[35rem]">
              {/* Analysis type selection */}
              <div className="border-b border-custom bg-secondary flex-shrink-0">
                <div className="px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={handleBackToCities}
                    className="text-sm text-secondary hover:text-primary transition-colors duration-200"
                  >
                    ← {t('location.back', { defaultValue: '返回' })}
                  </button>
                  <h3 className="text-sm font-medium text-primary">
                    {t('analysisTypes.selectForCity', { 
                      defaultValue: '选择分析类型',
                      city: selectedCity ? getCityDisplayName(selectedCity) : ''
                    })}
                  </h3>
                  <div className="w-12"></div>
                </div>
              </div>

              {/* Selected city info */}
              <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-custom flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium text-primary">
                    {selectedCity && getCityDisplayName(selectedCity)}
                  </span>
                </div>
              </div>

              {/* Analysis types */}
              <div className="flex-1 overflow-y-auto py-2 min-h-0 max-h-[20rem]">
                {analysisTypes.map((analysisType) => {
                  const IconComponent = analysisType.icon;
                  const isSelected = selectedAnalysis === analysisType.id;
                  
                  return (
                    <button
                      key={analysisType.id}
                      onClick={() => handleAnalysisSelect(analysisType.id)}
                      className={clsx(
                        'w-full text-left px-4 py-3 hover:bg-secondary transition-colors duration-150',
                        isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={clsx(
                          'h-4 w-4 flex-shrink-0',
                          isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-secondary'
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className={clsx(
                            'text-sm font-medium',
                            isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-primary'
                          )}>
                            {analysisType.name}
                            {analysisType.id === 'daily' && (
                              <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded">
                                {t('analysisTypes.default', { defaultValue: '默认' })}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-secondary mt-0.5 break-words pr-2">
                            {analysisType.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Confirm button */}
              <div className="border-t border-custom p-3 bg-primary flex-shrink-0">
                <button
                  onClick={handleConfirmSelection}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>{t('analysisTypes.confirm', { defaultValue: '确认并查看' })}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CityDropdownWithAnalysis;