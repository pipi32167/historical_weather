import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapPageTitle } from '../hooks/usePageTitle';
import { useStructuredData } from './StructuredData';
import LocationConfirmDialog from './MapLocationConfirmDialog';
import WeatherDataDisplay from './WeatherDataDisplay';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface SelectedLocation {
  lat: number;
  lng: number;
  locationName: string;
}

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tempClickLocation, setTempClickLocation] = useState<LatLng | null>(null);
  const [showWeatherData, setShowWeatherData] = useState(false);
  
  // Set page title
  useMapPageTitle();

  // Add structured data
  useStructuredData({
    type: 'WebPage',
    title: t('navigation.map', { defaultValue: '地图' }),
    description: t('navigation.mapDescription', { defaultValue: '互动地图天气查询' }),
    url: 'https://historicaltemperature.org/map',
    keywords: ['interactive map', 'weather map', 'location selection', 'historical weather'],
    dateModified: new Date().toISOString()
  });

  // Handle map click
  const handleMapClick = useCallback(async (latlng: LatLng) => {
    setTempClickLocation(latlng);
    setShowConfirmDialog(true);
  }, []);

  // Handle location confirmation
  const handleLocationConfirm = useCallback((locationName: string) => {
    if (tempClickLocation) {
      setSelectedLocation({
        lat: tempClickLocation.lat,
        lng: tempClickLocation.lng,
        locationName
      });
      setShowConfirmDialog(false);
      setTempClickLocation(null);
      setShowWeatherData(true);
    }
  }, [tempClickLocation]);

  // Handle dialog cancel
  const handleDialogCancel = useCallback(() => {
    setShowConfirmDialog(false);
    setTempClickLocation(null);
  }, []);

  // Default map center (Shanghai)
  const defaultCenter: [number, number] = [31.2304, 121.4737];

  return (
    <div className="flex flex-col h-screen">
      {/* Map Container - Takes up half screen */}
      <div className="h-1/2 w-full">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Weather Data Display - Takes up remaining half screen */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        {showWeatherData && selectedLocation ? (
          <WeatherDataDisplay
            latitude={selectedLocation.lat}
            longitude={selectedLocation.lng}
            locationName={selectedLocation.locationName}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('map.selectLocationTitle', { defaultValue: '在地图上选择一个位置' })}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {t('map.selectLocationDescription', { defaultValue: '点击地图上的任意位置来查看该地点的历史天气数据' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Location Confirmation Dialog */}
      {showConfirmDialog && tempClickLocation && (
        <LocationConfirmDialog
          latitude={tempClickLocation.lat}
          longitude={tempClickLocation.lng}
          onConfirm={handleLocationConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </div>
  );
};

export default MapPage;