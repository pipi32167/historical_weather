import { useState, useEffect, useCallback, useMemo } from 'react';
import { WeatherDataPoint, Location } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { generateSameDateHistoricalData } from '../utils/historicalDataGenerator';

interface UseWeatherDataOptions {
  useRealData?: boolean;
  selectedLocations?: Location[];
  targetDate?: Date;
  years?: number;
}

interface UseWeatherDataResult {
  data: WeatherDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  searchLocations: (query: string) => Promise<Location[]>;
}

export const useWeatherData = ({
  useRealData = true,
  selectedLocations = [],
  targetDate = new Date(),
  years = 20
}: UseWeatherDataOptions): UseWeatherDataResult => {
  const [data, setData] = useState<WeatherDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shanghai location fallback
  const defaultLocation: Location = {
    id: 'shanghai',
    name: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    country: 'China',
    timezone: 'Asia/Shanghai'
  };

  const searchLocations = useCallback(async (query: string): Promise<Location[]> => {
    if (!useRealData) {
      // Return mock search results when not using real data
      const mockLocations: Location[] = [
        { id: '1', name: '北京', latitude: 39.9042, longitude: 116.4074, country: 'China', timezone: 'Asia/Shanghai' },
        { id: '2', name: '上海', latitude: 31.2304, longitude: 121.4737, country: 'China', timezone: 'Asia/Shanghai' },
        { id: '3', name: '深圳', latitude: 22.3193, longitude: 114.1694, country: 'China', timezone: 'Asia/Shanghai' },
      ];
      
      return mockLocations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      return await weatherService.searchLocations(query);
    } catch (error) {
      console.error('Failed to search locations:', error);
      return [];
    }
  }, [useRealData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let weatherData: WeatherDataPoint[] = [];

      if (selectedLocations.length === 0) {
        // No locations selected - show historical same-date data for Shanghai
        if (useRealData) {
          weatherData = await weatherService.getSameDateHistoricalData(defaultLocation, targetDate, years);
        } else {
          weatherData = generateSameDateHistoricalData(defaultLocation, targetDate, years);
        }
      } else if (selectedLocations.length === 1) {
        // Single location - show historical data for that location
        const location = selectedLocations[0];
        if (useRealData) {
          weatherData = await weatherService.getSameDateHistoricalData(location, targetDate, years);
        } else {
          weatherData = generateSameDateHistoricalData(location, targetDate, years);
        }
      } else {
        // Multiple locations - show current/recent data for comparison
        if (useRealData) {
          const promises = selectedLocations.map(async (location) => {
            try {
              // For multi-location comparison, get recent data (last 30 days)
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);
              
              const historicalData = await weatherService.getHistoricalWeather(location, startDate, endDate);
              return historicalData.map(d => ({
                ...d,
                location: `${location.name}_${d.location}`, // Prefix with location for comparison
              }));
            } catch (error) {
              console.warn(`Failed to get data for ${location.name}:`, error);
              return [];
            }
          });

          const results = await Promise.all(promises);
          
          // Merge data by date for comparison
          const mergedData: Record<string, any> = {};
          results.forEach((locationData, locationIndex) => {
            const location = selectedLocations[locationIndex];
            locationData.forEach(point => {
              const dateKey = point.date;
              if (!mergedData[dateKey]) {
                mergedData[dateKey] = { 
                  date: dateKey,
                  timestamp: point.timestamp,
                  location: 'Comparison',
                  latitude: 0,
                  longitude: 0,
                  weatherCondition: '',
                  precipitation: 0
                };
              }
              mergedData[dateKey][`${location.name}_temperature`] = point.temperature;
              mergedData[dateKey][`${location.name}_humidity`] = point.humidity;
              mergedData[dateKey][`${location.name}_pressure`] = point.pressure;
              mergedData[dateKey][`${location.name}_windSpeed`] = point.windSpeed;
            });
          });

          weatherData = Object.values(mergedData) as WeatherDataPoint[];
        } else {
          // Use mock data for multi-location comparison
          weatherData = generateSameDateHistoricalData(selectedLocations[0], targetDate, 30);
        }
      }

      setData(weatherData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Error fetching weather data:', err);
      
      // Fallback to mock data on error
      if (useRealData) {
        console.warn('Falling back to mock data due to API error');
        const fallbackLocation = selectedLocations.length > 0 ? selectedLocations[0] : defaultLocation;
        const fallbackData = generateSameDateHistoricalData(fallbackLocation, targetDate, years);
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [useRealData, selectedLocations, targetDate, years, defaultLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    searchLocations,
  };
};