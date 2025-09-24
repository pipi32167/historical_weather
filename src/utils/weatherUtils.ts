/**
 * 天气状况工具函数
 * 将Open-Meteo天气代码映射到翻译键
 */

export const getWeatherConditionKey = (weatherCode: number): string => {
  // 支持的天气代码映射到翻译键
  const supportedCodes = [
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57,
    61, 63, 65, 66, 67, 71, 73, 75, 77,
    80, 81, 82, 85, 86, 95, 96, 99
  ];

  if (supportedCodes.includes(weatherCode)) {
    return `weather.conditions.${weatherCode}`;
  }
  
  return 'weather.conditions.unknown';
};

export const getWeatherConditionKeyForCode = (code: number): string => {
  return getWeatherConditionKey(code);
};