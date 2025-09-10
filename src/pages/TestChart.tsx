import React, { useState } from 'react';
import HistoricalWeatherChart from '../components/Charts/HistoricalWeatherChart';
import { format, subDays, addDays } from 'date-fns';

const TestChart: React.FC = () => {
  // 测试配置状态
  const [cityName, setCityName] = useState('北京');
  const [latitude, setLatitude] = useState(39.9042);
  const [longitude, setLongitude] = useState(116.4074);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [years, setYears] = useState(20);
  const [chartHeight, setChartHeight] = useState(400);
  const [showStats, setShowStats] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  // 预设的测试城市
  const testCities = [
    { name: '北京', lat: 39.9042, lon: 116.4074 },
    { name: '上海', lat: 31.2304, lon: 121.4737 },
    { name: '广州', lat: 23.1291, lon: 113.2644 },
    { name: '成都', lat: 30.5728, lon: 104.0668 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  ];

  // 处理城市选择
  const handleCitySelect = (city: typeof testCities[0]) => {
    setCityName(city.name);
    setLatitude(city.lat);
    setLongitude(city.lon);
  };

  // 处理数据加载完成
  const handleDataLoaded = (data: any[]) => {
    console.log('测试页面: 数据加载完成', { 
      cityName, 
      dataPoints: data.length, 
      firstPoint: data[0],
      lastPoint: data[data.length - 1]
    });
  };

  // 处理错误
  const handleError = (error: string) => {
    console.error('测试页面: 数据加载错误', { cityName, error });
  };

  // 计算日期模式
  const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const isSamePeriodMode = daysDiff <= 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          📊 HistoricalWeatherChart 组件测试页面
        </h1>
        <p className="text-secondary">
          测试历史天气图表组件的各种配置和功能
        </p>
      </div>

      {/* 配置面板 */}
      <div className="bg-primary border border-custom rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">🔧 测试配置</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 城市选择 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">测试城市</h3>
            <div className="grid grid-cols-2 gap-2">
              {testCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  className={`px-3 py-2 text-xs rounded-md transition-colors ${
                    cityName === city.name
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary border border-custom hover:bg-primary-50'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义坐标 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">自定义坐标</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="城市名称"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
              />
              <input
                type="number"
                placeholder="纬度"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                step="0.0001"
                className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
              />
              <input
                type="number"
                placeholder="经度"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                step="0.0001"
                className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
              />
            </div>
          </div>

          {/* 日期设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">日期设置</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-secondary mb-1">开始日期</label>
                <input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">结束日期</label>
                <input
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md"
                >
                  今天
                </button>
                <button
                  onClick={() => {
                    const yesterday = subDays(new Date(), 1);
                    setStartDate(yesterday);
                    setEndDate(yesterday);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded-md"
                >
                  昨天
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    setStartDate(subDays(today, 7));
                    setEndDate(today);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded-md"
                >
                  一周
                </button>
              </div>
            </div>
          </div>

          {/* 图表设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">图表设置</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-secondary mb-1">历史年数</label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value) || 20)}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">图表高度</label>
                <input
                  type="number"
                  value={chartHeight}
                  onChange={(e) => setChartHeight(parseInt(e.target.value) || 400)}
                  min="200"
                  max="800"
                  step="50"
                  className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1">图表类型</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'line' | 'area' | 'bar')}
                  className="w-full px-3 py-2 text-sm border border-custom rounded-md bg-primary"
                >
                  <option value="line">线图</option>
                  <option value="area">面积图</option>
                  <option value="bar">柱状图</option>
                </select>
              </div>
            </div>
          </div>

          {/* 显示选项 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">显示选项</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showStats}
                  onChange={(e) => setShowStats(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">显示统计卡片</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showInsights}
                  onChange={(e) => setShowInsights(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">显示历史洞察</span>
              </label>
            </div>
          </div>

          {/* 当前配置信息 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-secondary">当前配置</h3>
            <div className="text-xs space-y-1 text-secondary">
              <div>城市: {cityName}</div>
              <div>坐标: {latitude.toFixed(4)}, {longitude.toFixed(4)}</div>
              <div>日期: {format(startDate, 'MM-dd')} 到 {format(endDate, 'MM-dd')}</div>
              <div>模式: {isSamePeriodMode ? `同期对比 (${years}年)` : '日期范围'}</div>
              <div>图表: {chartHeight}px {chartType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 测试组件 */}
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-600 dark:text-yellow-400">⚡</span>
            <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              实时测试
            </span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            修改上面的配置会立即反映在下面的组件中。请查看浏览器控制台了解数据加载详情。
          </p>
        </div>

        <HistoricalWeatherChart
          cityName={cityName}
          latitude={latitude}
          longitude={longitude}
          startDate={startDate}
          endDate={endDate}
          years={years}
          showCurrentWeather={true}
          showStats={showStats}
          showInsights={showInsights}
          chartHeight={chartHeight}
          chartType={chartType}
          onDataLoaded={handleDataLoaded}
          onError={handleError}
        />
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
          📖 使用说明
        </h3>
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <p>• <strong>同期对比模式</strong>: 当开始日期=结束日期时，显示该日期过去N年的历史数据</p>
          <p>• <strong>日期范围模式</strong>: 当日期范围&gt;1天时，显示该时间段的连续数据</p>
          <p>• <strong>时区自动检测</strong>: 组件会根据坐标自动检测并使用当地时区</p>
          <p>• <strong>实时数据</strong>: 如果查询今天的数据，会自动获取当前实况天气</p>
          <p>• <strong>缓存机制</strong>: 历史数据会被缓存，当前天气数据每次都是最新的</p>
        </div>
      </div>
    </div>
  );
};

export default TestChart;