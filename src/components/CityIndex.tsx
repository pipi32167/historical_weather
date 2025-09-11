import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedCities, getDefaultCity } from '../data/cityMappings';
import { Location } from '../types/weather';
import CitySearchBox from './CitySearchBox';
import UserLocationWeather from './UserLocationWeather';
import MonthlyTemperatureAnalysis from './MonthlyTemperatureAnalysis';

const CityIndex: React.FC = () => {
  const navigate = useNavigate();
  const featuredCities = getFeaturedCities();

  // 按国家分组城市
  const citiesByCountry = featuredCities.reduce((acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  }, {} as Record<string, Location[]>);

  const handleCityClick = (city: Location) => {
    navigate(`/${city.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-4xl font-bold text-primary mb-4">
          历史天气数据分析平台
        </h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
          通过URL访问不同城市的历史同期天气数据，支持多种图表展示和数据分析功能。
          支持搜索全球任意城市或使用预设城市列表。
        </p>
      </div>

      {/* 用户位置天气数据 */}
      <UserLocationWeather className="max-w-4xl mx-auto" />

      {/* 城市搜索框 */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-custom rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 text-center">
            🔍 搜索任意城市
          </h3>
          <CitySearchBox 
            placeholder="输入城市名称（如：北京、New York、London）..."
            className="mb-3"
          />
          <p className="text-xs text-secondary text-center">
            💡 支持中文和英文搜索，数据来源：Open-Meteo 免费API（80年历史数据）
          </p>
        </div>
      </div>

      {/* URL Format Example */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary mb-3">
            🔗 URL访问格式
          </h3>
          <div className="space-y-2">
            <div className="font-mono text-sm bg-primary border border-custom rounded-lg px-3 py-2 inline-block">
              预设城市：https://[base_url]/<span className="text-blue-600 font-bold">[city]</span>
            </div>
            <div className="font-mono text-sm bg-primary border border-custom rounded-lg px-3 py-2 inline-block">
              任意城市：https://[base_url]/location/<span className="text-green-600 font-bold">[lat,lon]</span>?name=<span className="text-purple-600 font-bold">[name]</span>
            </div>
          </div>
          <p className="text-sm text-secondary mt-3">
            预设城市示例：<code className="bg-secondary px-2 py-1 rounded">/shanghai</code>、
            <code className="bg-secondary px-2 py-1 rounded mx-1">/beijing</code><br/>
            搜索功能支持全球任意城市，无需手动输入坐标
          </p>
        </div>
      </div>

      {/* Supported Cities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary text-center">
          🏙️ 精选城市
        </h2>
        
        {Object.entries(citiesByCountry).map(([country, cities]) => (
          <div key={country} className="bg-primary border border-custom rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <span className="text-2xl mr-2">
                {country === 'China' ? '🇨🇳' : 
                 country === 'United States' ? '🇺🇸' :
                 country === 'United Kingdom' ? '🇬🇧' :
                 country === 'Japan' ? '🇯🇵' :
                 country === 'France' ? '🇫🇷' :
                 country === 'Australia' ? '🇦🇺' :
                 country === 'Singapore' ? '🇸🇬' :
                 country === 'Hong Kong' ? '🇭🇰' : '🌍'}
              </span>
              {country}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCityClick(city)}
                  className="group p-4 bg-secondary border border-custom rounded-lg hover:bg-tertiary hover:border-primary-500 transition-all duration-200 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-primary group-hover:text-primary-600">
                      {city.name}
                    </h4>
                    <div className="text-xs bg-primary-500 text-white px-2 py-1 rounded">
                      /{city.id}
                    </div>
                  </div>
                  
                  <div className="text-xs text-secondary space-y-1">
                    <div>📍 {city.latitude.toFixed(2)}°N, {Math.abs(city.longitude).toFixed(2)}°{city.longitude >= 0 ? 'E' : 'W'}</div>
                    <div>🕐 {city.timezone}</div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-custom text-xs text-secondary">
                    点击查看历史天气数据
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 月度温度分析示例 */}
      <MonthlyTemperatureAnalysis 
        location={getDefaultCity()}
        defaultMode="annual-profile"
        defaultStartYear={new Date().getFullYear() - 10}
        defaultEndYear={new Date().getFullYear() - 1}
      />

      {/* Features */}
      <div className="bg-primary border border-custom rounded-lg p-6">
        <h3 className="text-xl font-semibold text-primary mb-4 text-center">
          ✨ 平台特性
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-primary mb-1">历史数据分析</h4>
            <p className="text-xs text-secondary">过去20年同期温度变化趋势</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🌡️</div>
            <h4 className="font-semibold text-primary mb-1">温度范围展示</h4>
            <p className="text-xs text-secondary">最高/最低温度可视化</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-semibold text-primary mb-1">月度分析</h4>
            <p className="text-xs text-secondary">月平均温度趋势和年度概况</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📱</div>
            <h4 className="font-semibold text-primary mb-1">响应式设计</h4>
            <p className="text-xs text-secondary">支持桌面和移动设备</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔗</div>
            <h4 className="font-semibold text-primary mb-1">URL直达</h4>
            <p className="text-xs text-secondary">通过城市名直接访问</p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🌐</div>
            <h4 className="font-semibold text-primary mb-1">真实数据</h4>
            <p className="text-xs text-secondary">Open-Meteo API 提供</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-secondary">
        <p>
          💡 提示：点击任意城市卡片或在浏览器地址栏输入 <code>/城市名</code> 即可访问对应城市的历史天气数据
        </p>
      </div>
    </div>
  );
};

export default CityIndex;