import { WeatherDataPoint, Location } from '../types/weather';
import { format, getMonth, setYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 生成过去20年同期日期的历史数据
export const generateSameDateHistoricalData = (
  location: Location,
  targetDate: Date = new Date(),
  years: number = 20
): WeatherDataPoint[] => {
  const data: WeatherDataPoint[] = [];
  const currentYear = targetDate.getFullYear();
  const targetMonth = getMonth(targetDate);

  // 基于城市的气候特征
  const getLocationClimate = (location: Location) => {
    switch (location.id) {
      case 'shanghai':
        return {
          baseTemp: 16, // 上海年平均气温
          tempVariance: 18, // 季节温差
          humidity: 75, // 平均湿度
          humidityVariance: 15,
          pressure: 1016,
          pressureVariance: 25,
          windSpeed: 12,
          windVariance: 6,
          precipitationBase: 120 // 年平均降水
        };
      case 'beijing':
        return {
          baseTemp: 12,
          tempVariance: 20,
          humidity: 65,
          humidityVariance: 20,
          pressure: 1013,
          pressureVariance: 30,
          windSpeed: 10,
          windVariance: 8,
          precipitationBase: 70
        };
      default:
        return {
          baseTemp: 15,
          tempVariance: 15,
          humidity: 70,
          humidityVariance: 18,
          pressure: 1015,
          pressureVariance: 28,
          windSpeed: 11,
          windVariance: 7,
          precipitationBase: 100
        };
    }
  };

  const climate = getLocationClimate(location);

  // 为过去20年的同期日期生成数据
  for (let yearOffset = 0; yearOffset < years; yearOffset++) {
    const historicalYear = currentYear - yearOffset;
    const historicalDate = setYear(targetDate, historicalYear);

    // 计算季节因子（基于月份）
    const seasonalFactor = Math.sin((targetMonth / 12) * 2 * Math.PI - Math.PI/2);
    
    // 计算该日期在年中的位置（用于未来扩展）
    // const dayOfYear = getDayOfYear(historicalDate);
    
    // 温度计算
    const seasonalTemp = climate.baseTemp + seasonalFactor * climate.tempVariance;
    
    // 年际变化 - 模拟气候变化和自然波动
    const yearlyTrend = yearOffset * 0.05; // 过去越久越冷，模拟全球变暖
    const yearlyVariation = (Math.sin(yearOffset * 0.3) * 2) + (Math.random() - 0.5) * 4; // 年际自然波动
    
    // 日变化
    const dailyVariation = (Math.random() - 0.5) * 6;
    
    const baseTemperature = seasonalTemp - yearlyTrend + yearlyVariation + dailyVariation;
    
    // 温度范围
    const tempVariation = 3 + Math.random() * 4;
    const temperatureMax = baseTemperature + tempVariation;
    const temperatureMin = baseTemperature - tempVariation * 0.7;
    
    // 湿度计算（夏季高，冬季低）
    const seasonalHumidity = climate.humidity + seasonalFactor * 15;
    const humidity = Math.max(30, Math.min(95, 
      seasonalHumidity + (Math.random() - 0.5) * climate.humidityVariance
    ));
    
    // 气压计算（冬季高，夏季低）
    const seasonalPressure = climate.pressure - seasonalFactor * 8;
    const pressure = seasonalPressure + (Math.random() - 0.5) * climate.pressureVariance;
    
    // 风速计算
    const windSpeed = Math.max(0, climate.windSpeed + (Math.random() - 0.5) * climate.windVariance);
    const windDirection = Math.random() * 360;
    
    // 降水计算（考虑季节性）
    const monthlyPrecipitation = getMonthlyPrecipitation(targetMonth, climate.precipitationBase);
    const precipitation = Math.max(0, monthlyPrecipitation * (0.5 + Math.random()) * (humidity / 100));
    
    // 天气状况
    const weatherCondition = getWeatherCondition(baseTemperature, humidity, precipitation);

    data.push({
      timestamp: historicalDate.toISOString(),
      date: format(historicalDate, 'yyyy-MM-dd'),
      temperature: Math.round(baseTemperature * 10) / 10,
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
  }

  // 按年份排序（最新的在前面）
  return data.sort((a, b) => new Date(b.date).getFullYear() - new Date(a.date).getFullYear());
};

// 获取一年中的第几天
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// 获取月份降水系数（针对上海）
const getMonthlyPrecipitation = (month: number, annualBase: number): number => {
  // 上海降水分布：夏季多雨，冬季少雨
  const monthlyFactors = [
    0.6, 0.7, 1.0, 1.2, 1.1, 1.8, // 1-6月
    1.4, 1.6, 1.0, 0.8, 0.7, 0.5  // 7-12月
  ];
  
  return (annualBase / 12) * (monthlyFactors[month] || 1.0);
};

// 根据温度、湿度、降水判断天气状况
const getWeatherCondition = (temperature: number, humidity: number, precipitation: number): string => {
  if (precipitation > 20) return '大雨';
  if (precipitation > 10) return '中雨';
  if (precipitation > 2) return '小雨';
  if (humidity > 85) return '阴天';
  if (humidity > 70) return '多云';
  if (temperature > 30) return '晴热';
  if (temperature < 5) return '寒冷';
  return '晴朗';
};

// 计算历史数据统计信息
export const calculateHistoricalStats = (data: WeatherDataPoint[]) => {
  if (data.length === 0) return null;

  const temperatures = data.map(d => d.temperature);
  const humidities = data.map(d => d.humidity);
  const precipitations = data.map(d => d.precipitation);
  
  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);
  
  const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
  const totalPrecipitation = precipitations.reduce((a, b) => a + b, 0);
  
  // 找出最热和最冷的年份
  const hottestYear = data.find(d => d.temperature === maxTemp);
  const coldestYear = data.find(d => d.temperature === minTemp);
  
  // 计算温度趋势（简单线性回归）
  const years = data.map(d => new Date(d.date).getFullYear());
  const tempTrend = calculateTemperatureTrend(years, temperatures);
  
  return {
    avgTemperature: Math.round(avgTemp * 10) / 10,
    maxTemperature: Math.round(maxTemp * 10) / 10,
    minTemperature: Math.round(minTemp * 10) / 10,
    temperatureRange: Math.round((maxTemp - minTemp) * 10) / 10,
    avgHumidity: Math.round(avgHumidity),
    totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
    hottestYear: hottestYear?.date.split('-')[0],
    coldestYear: coldestYear?.date.split('-')[0],
    temperatureTrend: Math.round(tempTrend * 1000) / 1000, // 每年变化度数
    dataPoints: data.length
  };
};

// 计算温度趋势（简单线性回归）
const calculateTemperatureTrend = (years: number[], temperatures: number[]): number => {
  const n = years.length;
  if (n < 2) return 0;
  
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = temperatures.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((sum, year, i) => sum + year * temperatures[i], 0);
  const sumXX = years.reduce((sum, year) => sum + year * year, 0);
  
  // 斜率 = (n*ΣXY - ΣX*ΣY) / (n*ΣXX - (ΣX)²)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  return slope || 0;
};

// 生成历史数据洞察
export const generateHistoricalInsights = (
  data: WeatherDataPoint[], 
  stats: ReturnType<typeof calculateHistoricalStats>,
  currentDate: Date
): string[] => {
  if (!stats || data.length === 0) return [];
  
  const insights: string[] = [];
  const todayStr = format(currentDate, 'MM月dd日', { locale: zhCN });
  
  // 温度相关洞察
  if (stats.temperatureTrend > 0.1) {
    insights.push(`📈 过去${data.length}年来，${todayStr}的温度呈上升趋势，平均每年上升${Math.abs(stats.temperatureTrend).toFixed(2)}°C`);
  } else if (stats.temperatureTrend < -0.1) {
    insights.push(`📉 过去${data.length}年来，${todayStr}的温度呈下降趋势，平均每年下降${Math.abs(stats.temperatureTrend).toFixed(2)}°C`);
  } else {
    insights.push(`📊 过去${data.length}年来，${todayStr}的温度相对稳定，波动较小`);
  }
  
  // 极值洞察
  if (stats.hottestYear && stats.coldestYear) {
    insights.push(`🔥 历史上这一天最热是${stats.hottestYear}年(${stats.maxTemperature}°C)，最冷是${stats.coldestYear}年(${stats.minTemperature}°C)`);
  }
  
  // 温差洞察
  if (stats.temperatureRange > 15) {
    insights.push(`🌡️ 历史温差达到${stats.temperatureRange}°C，说明这个日期的气候变化较大`);
  } else {
    insights.push(`🌡️ 历史温差为${stats.temperatureRange}°C，这个日期的气候相对稳定`);
  }
  
  // 湿度洞察
  if (stats.avgHumidity > 80) {
    insights.push(`💧 平均湿度${stats.avgHumidity}%，这个时期通常比较潮湿`);
  } else if (stats.avgHumidity < 50) {
    insights.push(`☀️ 平均湿度${stats.avgHumidity}%，这个时期通常比较干燥`);
  }
  
  return insights;
};