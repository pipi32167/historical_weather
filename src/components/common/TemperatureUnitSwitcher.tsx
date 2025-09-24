import React from 'react';
import { useTranslation } from 'react-i18next';
import { Thermometer } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const TemperatureUnitSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { temperatureUnit, setTemperatureUnit } = useAppStore();

  const units = [
    { code: 'celsius', name: 'units.celsius', display: '°C' },
    { code: 'fahrenheit', name: 'units.fahrenheit', display: '°F' }
  ] as const;

  const currentUnit = units.find(unit => unit.code === temperatureUnit) || units[0];

  const changeUnit = (unitCode: 'celsius' | 'fahrenheit') => {
    setTemperatureUnit(unitCode);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="group">
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                   shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 
                   bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label={t('units.temperatureUnit', { defaultValue: '温度单位' })}
        >
          <Thermometer className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">
            {currentUnit.display}
          </span>
          <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Dropdown menu */}
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 
                       opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
              {t('units.temperatureUnit', { defaultValue: '温度单位' })}
            </div>
            {units.map((unit) => (
              <button
                key={unit.code}
                onClick={() => changeUnit(unit.code)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
                  temperatureUnit === unit.code
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
                role="menuitem"
              >
                <div className="flex items-center justify-between">
                  <span>{unit.display}</span>
                  {temperatureUnit === unit.code && (
                    <svg className="h-4 w-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureUnitSwitcher;