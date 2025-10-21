import { Location } from '../types/weather';

// 城市名称到位置信息的映射
export const cityMappings: Record<string, Location> = {
  // 中国主要城市 (Names will be localized via getCityLocalizedName)
  'shanghai': {
    id: 'shanghai',
    name: 'Shanghai',
    latitude: 31.2304,
    longitude: 121.4737,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'beijing': {
    id: 'beijing',
    name: 'Beijing',
    latitude: 39.9042,
    longitude: 116.4074,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'guangzhou': {
    id: 'guangzhou',
    name: 'Guangzhou',
    latitude: 23.1291,
    longitude: 113.2644,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'shenzhen': {
    id: 'shenzhen',
    name: 'Shenzhen',
    latitude: 22.5431,
    longitude: 114.0579,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'hangzhou': {
    id: 'hangzhou',
    name: 'Hangzhou',
    latitude: 30.2741,
    longitude: 120.1551,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'nanjing': {
    id: 'nanjing',
    name: 'Nanjing',
    latitude: 32.0603,
    longitude: 118.7969,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'chengdu': {
    id: 'chengdu',
    name: 'Chengdu',
    latitude: 30.5728,
    longitude: 104.0668,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'wuhan': {
    id: 'wuhan',
    name: 'Wuhan',
    latitude: 30.5928,
    longitude: 114.3055,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'xian': {
    id: 'xian',
    name: "Xi'an",
    latitude: 34.3416,
    longitude: 108.9398,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'tianjin': {
    id: 'tianjin',
    name: 'Tianjin',
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
    name: 'Hong Kong',
    latitude: 22.3193,
    longitude: 114.1694,
    country: 'Hong Kong',
    timezone: 'Asia/Hong_Kong'
  },

  // 更多中国城市 (Names will be localized via getCityLocalizedName)
  'qingdao': {
    id: 'qingdao',
    name: 'Qingdao',
    latitude: 36.0671,
    longitude: 120.3826,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'dalian': {
    id: 'dalian',
    name: 'Dalian',
    latitude: 38.9140,
    longitude: 121.6147,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'xiamen': {
    id: 'xiamen',
    name: 'Xiamen',
    latitude: 24.4798,
    longitude: 118.0894,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'kunming': {
    id: 'kunming',
    name: 'Kunming',
    latitude: 25.0389,
    longitude: 102.7183,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'urumqi': {
    id: 'urumqi',
    name: 'Urumqi',
    latitude: 43.8256,
    longitude: 87.6168,
    country: 'China',
    timezone: 'Asia/Urumqi'
  },
  'lhasa': {
    id: 'lhasa',
    name: 'Lhasa',
    latitude: 29.6500,
    longitude: 91.1000,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'haikou': {
    id: 'haikou',
    name: 'Haikou',
    latitude: 20.0458,
    longitude: 110.3417,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  'sanya': {
    id: 'sanya',
    name: 'Sanya',
    latitude: 18.2533,
    longitude: 109.5146,
    country: 'China',
    timezone: 'Asia/Shanghai'
  },
  
  // 更多亚洲城市
  'seoul': {
    id: 'seoul',
    name: 'Seoul',
    latitude: 37.5665,
    longitude: 126.9780,
    country: 'South Korea',
    timezone: 'Asia/Seoul'
  },
  'mumbai': {
    id: 'mumbai',
    name: 'Mumbai',
    latitude: 19.0760,
    longitude: 72.8777,
    country: 'India',
    timezone: 'Asia/Kolkata'
  },
  'delhi': {
    id: 'delhi',
    name: 'Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    country: 'India',
    timezone: 'Asia/Kolkata'
  },
  'bangkok': {
    id: 'bangkok',
    name: 'Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
    country: 'Thailand',
    timezone: 'Asia/Bangkok'
  },
  'jakarta': {
    id: 'jakarta',
    name: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    country: 'Indonesia',
    timezone: 'Asia/Jakarta'
  },
  'manila': {
    id: 'manila',
    name: 'Manila',
    latitude: 14.5995,
    longitude: 120.9842,
    country: 'Philippines',
    timezone: 'Asia/Manila'
  },
  'kualalumpur': {
    id: 'kualalumpur',
    name: 'Kuala Lumpur',
    latitude: 3.1390,
    longitude: 101.6869,
    country: 'Malaysia',
    timezone: 'Asia/Kuala_Lumpur'
  },
  'dubai': {
    id: 'dubai',
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    country: 'UAE',
    timezone: 'Asia/Dubai'
  },
  'istanbul': {
    id: 'istanbul',
    name: 'Istanbul',
    latitude: 41.0082,
    longitude: 28.9784,
    country: 'Turkey',
    timezone: 'Europe/Istanbul'
  },
  
  // 更多欧洲城市
  'berlin': {
    id: 'berlin',
    name: 'Berlin',
    latitude: 52.5200,
    longitude: 13.4050,
    country: 'Germany',
    timezone: 'Europe/Berlin'
  },
  'rome': {
    id: 'rome',
    name: 'Rome',
    latitude: 41.9028,
    longitude: 12.4964,
    country: 'Italy',
    timezone: 'Europe/Rome'
  },
  'madrid': {
    id: 'madrid',
    name: 'Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
    country: 'Spain',
    timezone: 'Europe/Madrid'
  },
  'amsterdam': {
    id: 'amsterdam',
    name: 'Amsterdam',
    latitude: 52.3676,
    longitude: 4.9041,
    country: 'Netherlands',
    timezone: 'Europe/Amsterdam'
  },
  'vienna': {
    id: 'vienna',
    name: 'Vienna',
    latitude: 48.2082,
    longitude: 16.3738,
    country: 'Austria',
    timezone: 'Europe/Vienna'
  },
  'zurich': {
    id: 'zurich',
    name: 'Zurich',
    latitude: 47.3769,
    longitude: 8.5417,
    country: 'Switzerland',
    timezone: 'Europe/Zurich'
  },
  'stockholm': {
    id: 'stockholm',
    name: 'Stockholm',
    latitude: 59.3293,
    longitude: 18.0686,
    country: 'Sweden',
    timezone: 'Europe/Stockholm'
  },
  'oslo': {
    id: 'oslo',
    name: 'Oslo',
    latitude: 59.9139,
    longitude: 10.7522,
    country: 'Norway',
    timezone: 'Europe/Oslo'
  },
  'copenhagen': {
    id: 'copenhagen',
    name: 'Copenhagen',
    latitude: 55.6761,
    longitude: 12.5683,
    country: 'Denmark',
    timezone: 'Europe/Copenhagen'
  },
  'helsinki': {
    id: 'helsinki',
    name: 'Helsinki',
    latitude: 60.1699,
    longitude: 24.9384,
    country: 'Finland',
    timezone: 'Europe/Helsinki'
  },
  'moscow': {
    id: 'moscow',
    name: 'Moscow',
    latitude: 55.7558,
    longitude: 37.6173,
    country: 'Russia',
    timezone: 'Europe/Moscow'
  },
  'prague': {
    id: 'prague',
    name: 'Prague',
    latitude: 50.0755,
    longitude: 14.4378,
    country: 'Czech Republic',
    timezone: 'Europe/Prague'
  },
  'budapest': {
    id: 'budapest',
    name: 'Budapest',
    latitude: 47.4979,
    longitude: 19.0402,
    country: 'Hungary',
    timezone: 'Europe/Budapest'
  },
  'warsaw': {
    id: 'warsaw',
    name: 'Warsaw',
    latitude: 52.2297,
    longitude: 21.0122,
    country: 'Poland',
    timezone: 'Europe/Warsaw'
  },
  
  // 更多美洲城市
  'losangeles': {
    id: 'losangeles',
    name: 'Los Angeles',
    latitude: 34.0522,
    longitude: -118.2437,
    country: 'United States',
    timezone: 'America/Los_Angeles'
  },
  'chicago': {
    id: 'chicago',
    name: 'Chicago',
    latitude: 41.8781,
    longitude: -87.6298,
    country: 'United States',
    timezone: 'America/Chicago'
  },
  'miami': {
    id: 'miami',
    name: 'Miami',
    latitude: 25.7617,
    longitude: -80.1918,
    country: 'United States',
    timezone: 'America/New_York'
  },
  'sanfrancisco': {
    id: 'sanfrancisco',
    name: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    country: 'United States',
    timezone: 'America/Los_Angeles'
  },
  'seattle': {
    id: 'seattle',
    name: 'Seattle',
    latitude: 47.6062,
    longitude: -122.3321,
    country: 'United States',
    timezone: 'America/Los_Angeles'
  },
  'boston': {
    id: 'boston',
    name: 'Boston',
    latitude: 42.3601,
    longitude: -71.0589,
    country: 'United States',
    timezone: 'America/New_York'
  },
  'toronto': {
    id: 'toronto',
    name: 'Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    country: 'Canada',
    timezone: 'America/Toronto'
  },
  'vancouver': {
    id: 'vancouver',
    name: 'Vancouver',
    latitude: 49.2827,
    longitude: -123.1207,
    country: 'Canada',
    timezone: 'America/Vancouver'
  },
  'montreal': {
    id: 'montreal',
    name: 'Montreal',
    latitude: 45.5017,
    longitude: -73.5673,
    country: 'Canada',
    timezone: 'America/Montreal'
  },
  'mexicocity': {
    id: 'mexicocity',
    name: 'Mexico City',
    latitude: 19.4326,
    longitude: -99.1332,
    country: 'Mexico',
    timezone: 'America/Mexico_City'
  },
  'buenosaires': {
    id: 'buenosaires',
    name: 'Buenos Aires',
    latitude: -34.6118,
    longitude: -58.3960,
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  'saopaulo': {
    id: 'saopaulo',
    name: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    country: 'Brazil',
    timezone: 'America/Sao_Paulo'
  },
  'riodejaneiro': {
    id: 'riodejaneiro',
    name: 'Rio de Janeiro',
    latitude: -22.9068,
    longitude: -43.1729,
    country: 'Brazil',
    timezone: 'America/Sao_Paulo'
  },
  'lima': {
    id: 'lima',
    name: 'Lima',
    latitude: -12.0464,
    longitude: -77.0428,
    country: 'Peru',
    timezone: 'America/Lima'
  },
  'bogota': {
    id: 'bogota',
    name: 'Bogotá',
    latitude: 4.7110,
    longitude: -74.0721,
    country: 'Colombia',
    timezone: 'America/Bogota'
  },
  'caracas': {
    id: 'caracas',
    name: 'Caracas',
    latitude: 10.4806,
    longitude: -66.9036,
    country: 'Venezuela',
    timezone: 'America/Caracas'
  },
  'santiago': {
    id: 'santiago',
    name: 'Santiago',
    latitude: -33.4489,
    longitude: -70.6693,
    country: 'Chile',
    timezone: 'America/Santiago'
  },
  
  // 非洲城市
  'cairo': {
    id: 'cairo',
    name: 'Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    country: 'Egypt',
    timezone: 'Africa/Cairo'
  },
  'lagos': {
    id: 'lagos',
    name: 'Lagos',
    latitude: 6.5244,
    longitude: 3.3792,
    country: 'Nigeria',
    timezone: 'Africa/Lagos'
  },
  'capetown': {
    id: 'capetown',
    name: 'Cape Town',
    latitude: -33.9249,
    longitude: 18.4241,
    country: 'South Africa',
    timezone: 'Africa/Johannesburg'
  },
  'johannesburg': {
    id: 'johannesburg',
    name: 'Johannesburg',
    latitude: -26.2041,
    longitude: 28.0473,
    country: 'South Africa',
    timezone: 'Africa/Johannesburg'
  },
  'nairobi': {
    id: 'nairobi',
    name: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    country: 'Kenya',
    timezone: 'Africa/Nairobi'
  },
  'casablanca': {
    id: 'casablanca',
    name: 'Casablanca',
    latitude: 33.5731,
    longitude: -7.5898,
    country: 'Morocco',
    timezone: 'Africa/Casablanca'
  },
  
  // 大洋洲更多城市
  'melbourne': {
    id: 'melbourne',
    name: 'Melbourne',
    latitude: -37.8136,
    longitude: 144.9631,
    country: 'Australia',
    timezone: 'Australia/Melbourne'
  },
  'brisbane': {
    id: 'brisbane',
    name: 'Brisbane',
    latitude: -27.4698,
    longitude: 153.0251,
    country: 'Australia',
    timezone: 'Australia/Brisbane'
  },
  'perth': {
    id: 'perth',
    name: 'Perth',
    latitude: -31.9505,
    longitude: 115.8605,
    country: 'Australia',
    timezone: 'Australia/Perth'
  },
  'auckland': {
    id: 'auckland',
    name: 'Auckland',
    latitude: -36.8485,
    longitude: 174.7633,
    country: 'New Zealand',
    timezone: 'Pacific/Auckland'
  },
  'wellington': {
    id: 'wellington',
    name: 'Wellington',
    latitude: -41.2865,
    longitude: 174.7762,
    country: 'New Zealand',
    timezone: 'Pacific/Auckland'
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

// 首页显示的精选城市列表（限制数量，保持首页简洁）
const FEATURED_CITY_IDS = [
  // 中国主要城市
  'shanghai', 'beijing', 'guangzhou', 'shenzhen', 'hangzhou', 'chengdu',
  // 国际知名城市
  'newyork', 'london', 'tokyo', 'paris', 'sydney', 'singapore'
];

// 获取首页显示的精选城市列表
export const getFeaturedCities = (): Location[] => {
  return FEATURED_CITY_IDS.map(id => cityMappings[id]).filter(Boolean);
};

// 按地区分组的城市列表
export const getCitiesByRegion = () => {
  const regions = {
    asia: [] as Location[],
    europe: [] as Location[],
    americas: [] as Location[],
    africa: [] as Location[],
    oceania: [] as Location[]
  };

  Object.values(cityMappings).forEach(city => {
    if (['China', 'Japan', 'South Korea', 'India', 'Thailand', 'Indonesia', 'Philippines', 'Malaysia', 'UAE', 'Singapore', 'Hong Kong'].includes(city.country)) {
      regions.asia.push(city);
    } else if (['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Austria', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Russia', 'Czech Republic', 'Hungary', 'Poland', 'Turkey'].includes(city.country)) {
      regions.europe.push(city);
    } else if (['United States', 'Canada', 'Mexico', 'Argentina', 'Brazil', 'Peru', 'Colombia', 'Venezuela', 'Chile'].includes(city.country)) {
      regions.americas.push(city);
    } else if (['Egypt', 'Nigeria', 'South Africa', 'Kenya', 'Morocco'].includes(city.country)) {
      regions.africa.push(city);
    } else if (['Australia', 'New Zealand'].includes(city.country)) {
      regions.oceania.push(city);
    }
  });

  return regions;
};

// 获取城市的本地化名称
export const getCityLocalizedName = (city: Location, t: (key: string) => string): string => {
  // 尝试获取翻译后的城市名称，如果没有翻译则返回原名称
  const translationKey = `cities.${city.id}`;
  const translatedName = t(translationKey);
  
  // 如果翻译键不存在，t函数会返回原键名，此时返回原名称
  return translatedName === translationKey ? city.name : translatedName;
};