import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WeatherDataPoint, Location } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { weatherAggregateService } from '../services/weatherAggregateService';
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
  
  // 使用 ref 来避免组件重新创建对象导致的无限循环
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000;
  const minFetchInterval = 1000; // 最小请求间隔，防止过于频繁的请求

  // Shanghai location fallback - 使用 useMemo 避免每次渲染都创建新对象
  const defaultLocation = useMemo<Location>(() => ({
    id: 'shanghai',
    name: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    country: 'China',
    timezone: 'Asia/Shanghai'
  }), []);

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

  const fetchData = useCallback(async (isRetry = false) => {
    // 防止过于频繁的请求
    const now = Date.now();
    if (now - lastFetchTimeRef.current < minFetchInterval) {
      console.log('Request throttled - too frequent');
      return;
    }
    lastFetchTimeRef.current = now;
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    
    // 如果不是重试，重置重试计数
    if (!isRetry) {
      retryCountRef.current = 0;
    }
    
    setLoading(true);
    setError(null);

    try {
      let weatherData: WeatherDataPoint[] = [];

      if (selectedLocations.length === 0) {
        // No locations selected - show historical same-date data for Shanghai
        if (useRealData) {
          console.log('useWeatherData: 使用聚合API获取默认位置数据', {
            location: defaultLocation.name,
            targetDate: targetDate.toISOString().split('T')[0],
            years
          });
          const response = await weatherAggregateService.getHistoricalSamePeriodData(defaultLocation, targetDate, years);
          weatherData = response.data;
        } else {
          weatherData = generateSameDateHistoricalData(defaultLocation, targetDate, years);
        }
      } else if (selectedLocations.length === 1) {
        // Single location - show historical data for that location
        const location = selectedLocations[0];
        if (useRealData) {
          console.log('useWeatherData: 使用聚合API获取单个位置数据', {
            location: location.name,
            targetDate: targetDate.toISOString().split('T')[0],
            years
          });
          const response = await weatherAggregateService.getHistoricalSamePeriodData(location, targetDate, years);
          weatherData = response.data;
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
      // 检查是否是由于 AbortController 取消的请求
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      console.error('Error fetching weather data:', err);
      
      // 实现重试逻辑，但有最大重试次数限制
      if (useRealData && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.warn(`Retrying request (${retryCountRef.current}/${maxRetries})...`);
        
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            fetchData(true); // 标记为重试
          }
        }, retryDelay * retryCountRef.current); // 指数退避
        
        return;
      }
      
      // 达到最大重试次数或其他情况，设置错误状态
      setError(errorMessage);
      
      // Fallback to mock data on final error
      if (useRealData) {
        console.warn('Falling back to mock data after retries failed');
        const fallbackLocation = selectedLocations.length > 0 ? selectedLocations[0] : defaultLocation;
        const fallbackData = generateSameDateHistoricalData(fallbackLocation, targetDate, years);
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [useRealData, selectedLocations, targetDate, years, defaultLocation]);
  
  // 清理函数，组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 使用稳定的依赖数组避免无限循环
  const stableDeps = useMemo(() => ({
    useRealData,
    selectedLocations: JSON.stringify(selectedLocations.map(loc => ({ id: loc.id, name: loc.name }))),
    targetDate: targetDate.toISOString().split('T')[0], // 只取日期部分
    years
  }), [useRealData, selectedLocations, targetDate, years]);
  
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableDeps.useRealData, stableDeps.selectedLocations, stableDeps.targetDate, stableDeps.years]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0; // 重置重试计数
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