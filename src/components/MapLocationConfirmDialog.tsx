import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X, Check, Loader } from 'lucide-react';
import { osmGeocodingService } from '../services/osmGeocodingService';

interface LocationConfirmDialogProps {
  latitude: number;
  longitude: number;
  onConfirm: (locationName: string) => void;
  onCancel: () => void;
}

const LocationConfirmDialog: React.FC<LocationConfirmDialogProps> = ({
  latitude,
  longitude,
  onConfirm,
  onCancel
}) => {
  const { t, i18n } = useTranslation();
  const [locationName, setLocationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch location name using reverse geocoding
  useEffect(() => {
    const fetchLocationName = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get current language for proper localization
        const currentLanguage = i18n.language || 'zh-CN';
        const languageParam = osmGeocodingService.getLanguageParam(currentLanguage);
        
        const locationName = await osmGeocodingService.reverseGeocode(latitude, longitude, {
          language: languageParam,
          zoom: 10
        });
        
        if (locationName) {
          setLocationName(locationName);
        } else {
          setLocationName(`${t('map.unknownLocation', { defaultValue: '未知位置' })}`);
        }
      } catch (err) {
        console.error('Error fetching location name:', err);
        setError(t('map.locationError', { defaultValue: '获取位置信息失败' }));
        setLocationName(`${t('map.unknownLocation', { defaultValue: '未知位置' })}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationName();
  }, [latitude, longitude, t, i18n.language]);

  const handleConfirm = () => {
    onConfirm(locationName);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('map.confirmLocation', { defaultValue: '确认位置' })}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('map.locationName', { defaultValue: '位置名称' })}:
            </label>
            {isLoading ? (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('map.loadingLocation', { defaultValue: '正在获取位置信息...' })}
                </span>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                <span className="text-sm text-gray-900 dark:text-white">
                  {locationName}
                </span>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('map.coordinates', { defaultValue: '坐标' })}:
            </label>
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border">
              <span className="text-sm text-gray-900 dark:text-white font-mono">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('map.confirmDescription', { 
              defaultValue: '确认使用此位置查看历史天气数据？' 
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('common.cancel', { defaultValue: '取消' })}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>
              {isLoading 
                ? t('common.loading', { defaultValue: '加载中...' })
                : t('common.confirm', { defaultValue: '确认' })
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationConfirmDialog;