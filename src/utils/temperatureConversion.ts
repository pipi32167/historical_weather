/**
 * Temperature conversion utilities
 */

export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return ((fahrenheit - 32) * 5) / 9;
};

export const convertTemperature = (
  temperature: number,
  fromUnit: 'celsius' | 'fahrenheit',
  toUnit: 'celsius' | 'fahrenheit'
): number => {
  if (fromUnit === toUnit) {
    return temperature;
  }

  if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
    return celsiusToFahrenheit(temperature);
  } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
    return fahrenheitToCelsius(temperature);
  }

  return temperature;
};

export const formatTemperature = (
  temperature: number,
  unit: 'celsius' | 'fahrenheit',
  precision: number = 1
): string => {
  const symbol = unit === 'celsius' ? '°C' : '°F';
  return `${temperature.toFixed(precision)}${symbol}`;
};

export const convertAndFormatTemperature = (
  temperature: number,
  currentUnit: 'celsius' | 'fahrenheit',
  targetUnit: 'celsius' | 'fahrenheit',
  precision: number = 1
): string => {
  const convertedTemp = convertTemperature(temperature, currentUnit, targetUnit);
  return formatTemperature(convertedTemp, targetUnit, precision);
};