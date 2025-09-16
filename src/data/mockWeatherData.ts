import { WeatherDataPoint, Location } from '../types/weather';
import { addDays, format, subYears } from 'date-fns';

// 模拟地点数据
export const mockLocations: Location[] = [
  {
    id: 'beijing',
    name: '北京',
    latitude: 39.9042,
    longitude: 116.4074,
    country: '中国',
    timezone: 'Asia/Shanghai'
  },
  {
    id: 'shanghai',
    name: '上海',
    latitude: 31.2304,
    longitude: 121.4737,
    country: '中国',
    timezone: 'Asia/Shanghai'
  },
  {
    id: 'shenzhen',
    name: '深圳',
    latitude: 22.3193,
    longitude: 114.1694,
    country: '中国',
    timezone: 'Asia/Shanghai'
  },
  {
    id: 'newyork',
    name: '纽约',
    latitude: 40.7128,
    longitude: -74.0060,
    country: '美国',
    timezone: 'America/New_York'
  },
  {
    id: 'london',
    name: '伦敦',
    latitude: 51.5074,
    longitude: -0.1278,
    country: '英国',
    timezone: 'Europe/London'
  }
];

// 生成模拟气温数据的函数
export const generateMockWeatherData = (
  location: Location,
  startDate: Date,
  endDate: Date,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
): WeatherDataPoint[] => {
  const data: WeatherDataPoint[] = [];
  
  // 基于地理位置的基础气候特征
  const getBaseClimate = (location: Location) => {
    const lat = location.latitude;
    
    // 根据纬度估算基础温度
    let baseTemp = 25 - Math.abs(lat) * 0.6;
    
    // 城市特殊调整
    switch (location.id) {
      case 'beijing':
        baseTemp = 12;
        break;
      case 'shanghai':
        baseTemp = 16;
        break;
      case 'shenzhen':
        baseTemp = 22;
        break;
      case 'newyork':
        baseTemp = 11;
        break;
      case 'london':
        baseTemp = 9;
        break;
    }
    
    return {
      baseTemp,
      tempVariance: 15,
      humidity: 65,
      humidityVariance: 20,
      pressure: 1013,
      pressureVariance: 30,
      windSpeed: 10,
      windVariance: 8
    };
  };

  const climate = getBaseClimate(location);
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfYear = getDayOfYear(currentDate);
    const seasonalFactor = Math.sin((dayOfYear / 365.25) * 2 * Math.PI - Math.PI/2);
    
    // 温度计算（考虑季节变化）
    const seasonalTemp = climate.baseTemp + seasonalFactor * climate.tempVariance;
    const dailyVariation = (Math.random() - 0.5) * 8; // 日间变化
    const yearlyTrend = (currentDate.getFullYear() - 2020) * 0.1; // 模拟气候变化趋势
    
    const temperature = seasonalTemp + dailyVariation + yearlyTrend;
    const temperatureMax = temperature + Math.random() * 5 + 2;
    const temperatureMin = temperature - Math.random() * 5 - 2;
    
    // 湿度计算
    const humidity = Math.max(20, Math.min(95, 
      climate.humidity + (Math.random() - 0.5) * climate.humidityVariance + seasonalFactor * 10
    ));
    
    // 气压计算
    const pressure = climate.pressure + (Math.random() - 0.5) * climate.pressureVariance;
    
    // 风速计算
    const windSpeed = Math.max(0, climate.windSpeed + (Math.random() - 0.5) * climate.windVariance);
    const windDirection = Math.random() * 360;
    
    // 降水计算
    const precipitation = humidity > 70 ? Math.random() * 20 : Math.random() * 2;
    
    // 天气状况
    const weatherConditions = ['晴朗', '多云', '阴天', '小雨', '雨', '雷雨'];
    let weatherCondition = weatherConditions[0];
    if (precipitation > 15) weatherCondition = weatherConditions[5];
    else if (precipitation > 10) weatherCondition = weatherConditions[4];
    else if (precipitation > 5) weatherCondition = weatherConditions[3];
    else if (humidity > 80) weatherCondition = weatherConditions[2];
    else if (humidity > 60) weatherCondition = weatherConditions[1];
    
    data.push({
      timestamp: currentDate.toISOString(),
      date: format(currentDate, 'yyyy-MM-dd'),
      temperature: Math.round(temperature * 10) / 10,
      temperatureMax: Math.round(temperatureMax * 10) / 10,
      temperatureMin: Math.round(temperatureMin * 10) / 10,
      humidity: Math.round(humidity),
      pressure: Math.round(pressure * 10) / 10,
      windSpeed: Math.round(windSpeed * 10) / 10,
      windDirection: Math.round(windDirection),
      precipitation: Math.round(precipitation * 10) / 10,
      weatherCondition,
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    
    // 根据间隔增加日期
    switch (interval) {
      case 'weekly':
        currentDate = addDays(currentDate, 7);
        break;
      case 'monthly':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        break;
      default: // daily
        currentDate = addDays(currentDate, 1);
        break;
    }
  }
  
  return data;
};

// 获取一年中的第几天
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// 预生成一些示例数据
export const getSampleData = (locationId: string = 'beijing'): WeatherDataPoint[] => {
  const location = mockLocations.find(loc => loc.id === locationId) || mockLocations[0];
  const endDate = new Date();
  const startDate = subYears(endDate, 2); // 过去两年的数据
  
  return generateMockWeatherData(location, startDate, endDate, 'weekly');
};

// 多地点对比数据
export const getComparisonData = (locationIds: string[]): Record<string, WeatherDataPoint[]> => {
  const result: Record<string, WeatherDataPoint[]> = {};
  const endDate = new Date();
  const startDate = subYears(endDate, 1); // 过去一年的数据
  
  locationIds.forEach(locationId => {
    const location = mockLocations.find(loc => loc.id === locationId);
    if (location) {
      result[locationId] = generateMockWeatherData(location, startDate, endDate, 'monthly');
    }
  });
  
  return result;
};

// 年度统计数据
export const getYearlyStats = (locationId: string, years: number = 5) => {
  const location = mockLocations.find(loc => loc.id === locationId) || mockLocations[0];
  const endDate = new Date();
  const startDate = subYears(endDate, years);
  
  const data = generateMockWeatherData(location, startDate, endDate, 'monthly');
  
  // 按年度聚合统计
  const yearlyStats = data.reduce((acc, point) => {
    const year = new Date(point.date).getFullYear();
    if (!acc[year]) {
      acc[year] = {
        year,
        temperatures: [],
        precipitations: [],
        humidities: []
      };
    }
    acc[year].temperatures.push(point.temperature);
    acc[year].precipitations.push(point.precipitation);
    acc[year].humidities.push(point.humidity);
    return acc;
  }, {} as any);
  
  // 计算平均值
  return Object.values(yearlyStats).map((yearData: any) => ({
    year: yearData.year,
    avgTemperature: yearData.temperatures.reduce((a: number, b: number) => a + b, 0) / yearData.temperatures.length,
    totalPrecipitation: yearData.precipitations.reduce((a: number, b: number) => a + b, 0),
    avgHumidity: yearData.humidities.reduce((a: number, b: number) => a + b, 0) / yearData.humidities.length,
  }));
};