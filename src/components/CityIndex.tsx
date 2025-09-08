import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportedCities } from '../data/cityMappings';
import { Location } from '../types/weather';

const CityIndex: React.FC = () => {
  const navigate = useNavigate();
  const supportedCities = getSupportedCities();

  // 按国家分组城市
  const citiesByCountry = supportedCities.reduce((acc, city) => {
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
          只需在网址后添加城市名称即可查看对应数据。
        </p>
      </div>

      {/* URL Format Example */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-custom rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary mb-3">
            🔗 URL访问格式
          </h3>
          <div className="font-mono text-lg bg-primary border border-custom rounded-lg px-4 py-3 inline-block">
            https://[base_url]/<span className="text-blue-600 font-bold">[city]</span>
          </div>
          <p className="text-sm text-secondary mt-3">
            例如：<code className="bg-secondary px-2 py-1 rounded">/shanghai</code>、
            <code className="bg-secondary px-2 py-1 rounded mx-1">/beijing</code>、
            <code className="bg-secondary px-2 py-1 rounded">/newyork</code>
          </p>
        </div>
      </div>

      {/* Supported Cities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary text-center">
          🏙️ 支持的城市
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
            <div className="text-3xl mb-2">🎨</div>
            <h4 className="font-semibold text-primary mb-1">多种图表</h4>
            <p className="text-xs text-secondary">折线图、面积图、柱状图</p>
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