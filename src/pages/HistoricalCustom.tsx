import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { openMeteoService } from '../services/openMeteoWeather';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { QuickLocationSelector } from '../components/common/QuickLocationSelector';
import { AnalysisTypeSwitcher } from '../components/common/AnalysisTypeSwitcher';
import { useLocationStore } from '../store/locationStore';
import { useHistoricalPageTitle } from '../hooks/usePageTitle';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CustomDateData {
  date: string;
  formattedDate: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitation?: number;
}

const HistoricalCustom: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<CustomDateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState<string>('');
  const { currentLocation } = useLocationStore();
  
  // 设置页面标题
  useHistoricalPageTitle('custom', currentLocation?.name);

  const parseDateInput = (input: string): string[] => {
    return input
      .split(',')
      .map(date => date.trim())
      .filter(date => {
        // 验证YYYY-MM-DD格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        // 验证日期有效性
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime()) && date === parsedDate.toISOString().split('T')[0];
      });
  };

  const loadCustomDateData = async () => {
    if (!currentLocation || !dateInput.trim()) return;

    const validDates = parseDateInput(dateInput);
    if (validDates.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📊 获取自定义日期数据:', { dates: validDates, location: currentLocation });

      const results: CustomDateData[] = [];

      for (const dateStr of validDates) {
        try {
          const date = new Date(dateStr);
          const response = await openMeteoService.getHistoricalWeather(
            currentLocation.latitude,
            currentLocation.longitude,
            dateStr,
            dateStr,
            'auto'
          );

          if (response && response.daily && response.daily.time.length > 0) {
            const dayData = {
              date: dateStr,
              formattedDate: format(date, 'yyyy年MM月dd日', { locale: zhCN }),
              maxTemp: Math.round(response.daily.temperature_2m_max[0] * 10) / 10,
              minTemp: Math.round(response.daily.temperature_2m_min[0] * 10) / 10,
              avgTemp: Math.round(((response.daily.temperature_2m_max[0] + response.daily.temperature_2m_min[0]) / 2) * 10) / 10,
              precipitation: response.daily.precipitation_sum ? Math.round(response.daily.precipitation_sum[0] * 10) / 10 : 0
            };
            results.push(dayData);
          }
        } catch (dateError) {
          console.warn('处理日期错误:', dateStr, dateError);
        }
      }

      // 按日期排序
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setData(results);

    } catch (error) {
      console.error('获取自定义日期数据失败:', error);
      setError(error instanceof Error ? error.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomDateData();
  }, [dateInput, currentLocation]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDateInput(event.target.value);
  };

  const getValidDates = () => {
    return parseDateInput(dateInput);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  // 计算统计信息
  const statistics = data.length > 0 ? {
    maxTemp: Math.max(...data.map(d => d.maxTemp)),
    minTemp: Math.min(...data.map(d => d.minTemp)),
    avgMaxTemp: Math.round((data.reduce((sum, d) => sum + d.maxTemp, 0) / data.length) * 10) / 10,
    avgMinTemp: Math.round((data.reduce((sum, d) => sum + d.minTemp, 0) / data.length) * 10) / 10,
    totalPrecipitation: Math.round((data.reduce((sum, d) => sum + (d.precipitation || 0), 0)) * 10) / 10
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary-600" />
          {t('navigation.historical.custom')}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          {t('analysis.customDateDescription')}
        </p>
      </div>

      {/* 控制面板 */}
      <div className="mb-8 space-y-6">
        {/* 位置选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            {t('location.selectLocation')}
          </h2>
          <QuickLocationSelector />
          {currentLocation && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {t('location.currentLocation')}: {currentLocation.name}
            </p>
          )}
        </div>

        {/* 日期输入 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            {t('time.customDateList')}
          </h2>
          
          <div className="space-y-3">
            <textarea
              value={dateInput}
              onChange={handleInputChange}
              placeholder="2024-01-01, 2024-02-14, 2024-12-25"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('time.dateInputFormat')}: YYYY-MM-DD, YYYY-MM-DD, ...
            </p>
          </div>

          {/* 日期预览 */}
          {dateInput.trim() && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('time.validDates')} ({getValidDates().length}):
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getValidDates().map((date, index) => (
                  <span key={index} className="inline-block mr-3 mb-1">
                    {formatDate(date)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 分析类型切换 */}
        <AnalysisTypeSwitcher />
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-8">
          <ErrorMessage message={error} onRetry={loadCustomDateData} />
        </div>
      )}

      {/* 数据展示 */}
      {!loading && !error && data.length > 0 && (
        <>
          {/* 统计概览 */}
          {statistics && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('analysis.statisticsSummary')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.maxTemp')}</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.maxTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.minTemp')}</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.minTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.avgMaxTemp')}</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.avgMaxTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analysis.avgMinTemp')}</p>
                  <p className="text-2xl font-bold text-cyan-600">{statistics.avgMinTemp}°C</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('weather.totalPrecipitation')}</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.totalPrecipitation}mm</p>
                </div>
              </div>
            </div>
          )}

          {/* 温度趋势图表 */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('analysis.temperatureTrend')}
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: t('weather.temperature'), angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `${t('time.date')}: ${value}`}
                    formatter={(value: number, name: string) => [
                      `${value}°C`,
                      name === 'maxTemp' ? t('weather.maxTemp') :
                      name === 'minTemp' ? t('weather.minTemp') : t('weather.avgTemp')
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'maxTemp' ? t('weather.maxTemp') :
                      value === 'minTemp' ? t('weather.minTemp') : t('weather.avgTemp')
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxTemp" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minTemp" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgTemp" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('analysis.detailedData')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {t('time.date')}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-red-600">
                      {t('weather.maxTemp')}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-600">
                      {t('weather.minTemp')}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-green-600">
                      {t('weather.avgTemp')}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-cyan-600">
                      {t('weather.precipitation')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {item.formattedDate}
                      </td>
                      <td className="py-3 px-4 text-center text-red-600 font-medium">
                        {item.maxTemp}°C
                      </td>
                      <td className="py-3 px-4 text-center text-blue-600 font-medium">
                        {item.minTemp}°C
                      </td>
                      <td className="py-3 px-4 text-center text-green-600 font-medium">
                        {item.avgTemp}°C
                      </td>
                      <td className="py-3 px-4 text-center text-cyan-600 font-medium">
                        {item.precipitation || 0}mm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 无数据提示 */}
      {!loading && !error && data.length === 0 && dateInput.trim() && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            {t('common.noData')}
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            {t('analysis.noDataForSelectedDates')}
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalCustom;