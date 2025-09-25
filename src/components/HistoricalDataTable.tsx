import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getWeatherConditionKey } from '../utils/weatherUtils';
import { useTemperatureDisplay } from '../hooks/useTemperatureDisplay';

interface HistoricalData {
  year: number;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
}

interface HistoricalDataTableProps {
  data: HistoricalData[];
}

const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const { formatTemp } = useTemperatureDisplay();

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600 dark:text-blue-400';
    if (temp < 15) return 'text-blue-400 dark:text-blue-300';
    if (temp < 25) return 'text-green-500 dark:text-green-400';
    if (temp < 35) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (i18n.language.startsWith('zh')) {
        return format(date, 'MM月dd日', { locale: zhCN });
      } else {
        return format(date, 'MMM dd');
      }
    } catch {
      return dateString;
    }
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {t('app.noData', { defaultValue: '暂无数据' })}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('time.year', { defaultValue: '年' })}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('time.date', { defaultValue: '日期' })}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.maxTemp', { defaultValue: '最高温' })} (°C)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.minTemp', { defaultValue: '最低温' })} (°C)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.avgTemp', { defaultValue: '平均温' })} (°C)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.precipitation', { defaultValue: '降水量' })} (mm)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.windSpeed', { defaultValue: '风速' })} (km/h)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('weather.condition', { defaultValue: '天气状况' })}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr key={`${item.year}-${item.date}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {item.year}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatDate(item.date)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.maxTemp)}`}>
                {formatTemp(item.maxTemp)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.minTemp)}`}>
                {formatTemp(item.minTemp)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTemperatureColor(item.avgTemp)}`}>
                {formatTemp(item.avgTemp)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {item.precipitation.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {item.windSpeed.toFixed(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {t(getWeatherConditionKey(item.weatherCode), { 
                  defaultValue: t('weather.conditions.unknown', { defaultValue: '未知' })
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricalDataTable;