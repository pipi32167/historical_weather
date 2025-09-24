import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { convertTemperature, formatTemperature } from '../utils/temperatureConversion';

/**
 * Hook for displaying temperatures with proper unit conversion and formatting
 */
export const useTemperatureDisplay = () => {
  const { temperatureUnit } = useAppStore();
  const { t } = useTranslation();

  // Format a single temperature value
  const formatTemp = useCallback((temperature: number, precision: number = 1): string => {
    // Convert from Celsius (API default) to user's preferred unit
    const convertedTemp = convertTemperature(temperature, 'celsius', temperatureUnit);
    return formatTemperature(convertedTemp, temperatureUnit, precision);
  }, [temperatureUnit]);

  // Get the unit symbol for display in charts/tables
  const getUnitSymbol = useCallback((): string => {
    return t(`units.${temperatureUnit}`);
  }, [temperatureUnit, t]);

  // Format temperature for chart tick labels
  const formatChartTick = useCallback((value: number): string => {
    const convertedTemp = convertTemperature(value, 'celsius', temperatureUnit);
    return `${convertedTemp.toFixed(1)}${getUnitSymbol()}`;
  }, [temperatureUnit, getUnitSymbol]);

  // Format temperature with unit for inline display
  const displayTemp = useCallback((temperature: number, precision: number = 1): string => {
    return formatTemp(temperature, precision);
  }, [formatTemp]);

  return {
    formatTemp,
    displayTemp,
    formatChartTick,
    getUnitSymbol,
    temperatureUnit,
  };
};