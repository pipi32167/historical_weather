/**
 * Mock configuration for development and testing
 */

import { OpenMeteoHistoricalData } from '../services/openMeteoWeather';

export interface MockConfig {
  /** Enable mock mode for historical weather data */
  enableHistoricalWeatherMock: boolean;
  /** Mock data file path (relative to mock directory) */
}

/**
 * Mock configuration
 * Set enableHistoricalWeatherMock to true to use local mock data instead of API calls
 */
export const mockConfig: MockConfig = {
  enableHistoricalWeatherMock: process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true',
};

/**
 * Check if mock mode is enabled for historical weather
 */
export const isMockModeEnabled = (): boolean => {
  return mockConfig.enableHistoricalWeatherMock;
};


/**
 * 加载mock数据
 */
export async function loadMockData(): Promise<OpenMeteoHistoricalData> {
  const mockFilePath = './weather_cache_historical_big.json';
  try {
    // Import JSON file directly
    console.log('Loading mock data from:', mockFilePath);
    const mockDataModule = await import('./weather_cache_historical_big.json');
    return mockDataModule.default;
  } catch (error) {
    console.error('Failed to load mock data:', error);
    throw new Error(`无法加载mock数据文件: ${'./weather_cache_historical_big.json'}`);
  }
}