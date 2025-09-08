import { Location } from '../types/weather';

// 城市名称到位置信息的映射
export const cityMappings: Record<string, Location> = {
  // 中国主要城市
  'shanghai': {
    id: 'shanghai',
    name: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'beijing': {
    id: 'beijing',
    name: '北京',
    latitude: 39.9042,
    longitude: 116.4074,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'guangzhou': {
    id: 'guangzhou',
    name: '广州',
    latitude: 23.1291,
    longitude: 113.2644,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'shenzhen': {
    id: 'shenzhen',
    name: '深圳',
    latitude: 22.5431,
    longitude: 114.0579,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'hangzhou': {
    id: 'hangzhou',
    name: '杭州',
    latitude: 30.2741,
    longitude: 120.1551,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'nanjing': {
    id: 'nanjing',
    name: '南京',
    latitude: 32.0603,
    longitude: 118.7969,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'chengdu': {
    id: 'chengdu',
    name: '成都',
    latitude: 30.5728,
    longitude: 104.0668,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'wuhan': {
    id: 'wuhan',
    name: '武汉',
    latitude: 30.5928,
    longitude: 114.3055,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'xian': {
    id: 'xian',
    name: '西安',
    latitude: 34.3416,
    longitude: 108.9398,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'tianjin': {
    id: 'tianjin',
    name: '天津',
    latitude: 39.3434,
    longitude: 117.3616,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  // 国际城市
  'newyork': {
    id: 'newyork',
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
    country: 'United States',
    timezone: 'America/New_York'
  },
  'london': {
    id: 'london',
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    country: 'United Kingdom',
    timezone: 'Europe/London'
  },
  'tokyo': {
    id: 'tokyo',
    name: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    country: 'Japan',
    timezone: 'Asia/Tokyo'
  },
  'paris': {
    id: 'paris',
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    country: 'France',
    timezone: 'Europe/Paris'
  },
  'sydney': {
    id: 'sydney',
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    country: 'Australia',
    timezone: 'Australia/Sydney'
  },
  'singapore': {
    id: 'singapore',
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    country: 'Singapore',
    timezone: 'Asia/Singapore'
  },
  'hongkong': {
    id: 'hongkong',
    name: '香港',
    latitude: 22.3193,
    longitude: 114.1694,
    country: 'Hong Kong',
    timezone: 'Asia/Hong_Kong'
  }
};

// 获取城市信息的辅助函数
export const getCityByName = (cityName: string): Location | null => {
  const normalizedName = cityName.toLowerCase().trim();
  return cityMappings[normalizedName] || null;
};

// 获取所有支持的城市列表
export const getSupportedCities = (): Location[] => {
  return Object.values(cityMappings);
};

// 检查城市是否支持
export const isCitySupported = (cityName: string): boolean => {
  const normalizedName = cityName.toLowerCase().trim();
  return normalizedName in cityMappings;
};

// 获取默认城市（上海）
export const getDefaultCity = (): Location => {
  return cityMappings.shanghai;
};