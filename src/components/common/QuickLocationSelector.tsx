import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocationStore } from '../../store/locationStore';
import { MapPinIcon, StarIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Location } from '../../types/weather';

interface QuickLocationSelectorProps {
  compact?: boolean;
  showFavorites?: boolean;
  onLocationChange?: (location: Location) => void;
}

export const QuickLocationSelector: React.FC<QuickLocationSelectorProps> = ({
  compact = false,
  showFavorites = true,
  onLocationChange
}) => {
  const { t } = useTranslation();
  const {
    currentLocation,
    recentLocations,
    favoriteLocations,
    setCurrentLocation,
    addToFavorites,
    removeFromFavorites
  } = useLocationStore();

  const [activeTab, setActiveTab] = useState<'preset' | 'recent' | 'favorites'>('preset');

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

  const LocationGrid: React.FC<{ locations: Location[] }> = ({ locations }) => (
    <div className={`grid gap-2 ${
      compact 
        ? 'grid-cols-3 lg:grid-cols-6' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
    }`}>
      {locations.map(location => (
        <div key={location.id} className="relative group">
          <button
            onClick={() => handleLocationSelect(location)}
            className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
              currentLocation?.id === location.id
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-200 hover:bg-primary-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{location.name}</span>
              {showFavorites && (
                <button
                  onClick={(e) => handleToggleFavorite(location, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  {isFavorite(location) ? (
                    <HeartIconSolid className="h-3 w-3 text-red-500" />
                  ) : (
                    <HeartIcon className="h-3 w-3 text-gray-400" />
                  )}
                </button>
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
            <MapPinIcon className="h-4 w-4 text-gray-500" />
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
      {/* 当前位置显示 */}
      <div className="current-location mb-4">
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('location.currentSelection')}: {currentLocation?.name || t('location.notSelected')}
          </span>
          {currentLocation && (
            <span className="text-sm text-gray-500">
              ({currentLocation.latitude.toFixed(2)}, {currentLocation.longitude.toFixed(2)})
            </span>
          )}
        </div>
      </div>

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
                <StarIcon className="h-3 w-3" />
                <span>{t('location.favorites')} ({favoriteLocations.length})</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 位置网格 */}
      <div className="locations-content">
        {activeTab === 'preset' && <LocationGrid locations={presetLocations} />}
        {activeTab === 'recent' && recentLocations.length > 0 && (
          <LocationGrid locations={recentLocations} />
        )}
        {activeTab === 'favorites' && favoriteLocations.length > 0 && (
          <LocationGrid locations={favoriteLocations} />
        )}
        
        {activeTab === 'recent' && recentLocations.length <= 1 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MapPinIcon className="h-8 w-8 mx-auto mb-2" />
            <p>{t('location.noRecentLocations')}</p>
          </div>
        )}
        
        {activeTab === 'favorites' && favoriteLocations.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <HeartIcon className="h-8 w-8 mx-auto mb-2" />
            <p>{t('location.noFavoriteLocations')}</p>
            <p className="text-sm mt-1">{t('location.favoriteInstruction')}</p>
          </div>
        )}
      </div>
    </div>
  );
};