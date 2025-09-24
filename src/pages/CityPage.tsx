import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCityByName, getCityLocalizedName } from '../data/cityMappings';
import { Location } from '../types/weather';
import HomepageHistoricalDaily from '../components/HomepageHistoricalDaily';
import NotFound from '../components/NotFound';

const CityPage: React.FC = () => {
  const { city } = useParams<{ city: string }>();
  const { t, i18n } = useTranslation();
  const [currentCity, setCurrentCity] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) {
      setError('City parameter missing');
      setLoading(false);
      return;
    }

    // 尝试从cityMappings中获取城市信息
    const foundCity = getCityByName(city);
    
    if (foundCity) {
      setCurrentCity(foundCity);
      setError(null);
    } else {
      setError(`City "${city}" not found`);
    }
    
    setLoading(false);
  }, [city]);

  // 生成城市相关的SEO信息
  const getCitySEOData = (cityData: Location) => {
    const cityName = getCityLocalizedName(cityData, t);
    const currentLang = i18n.language;
    
    if (currentLang.startsWith('zh')) {
      return {
        title: `${cityName}历史气温数据查询 | 专业气象数据分析平台`,
        description: `查询${cityName}的历史气温数据，包括最高温、最低温、平均温度等详细气象信息。专业的历史天气数据分析，支持多年份对比，了解${cityName}的气候变化趋势。`,
        keywords: `${cityName}天气,${cityName}气温,历史天气,气象数据,温度变化,气候分析`
      };
    } else {
      return {
        title: `${cityName} Historical Temperature Data | Professional Weather Analysis Platform`,
        description: `Query historical temperature data for ${cityName}, including maximum, minimum, and average temperatures with detailed meteorological information. Professional historical weather data analysis with multi-year comparison to understand climate change trends in ${cityName}.`,
        keywords: `${cityName} weather,${cityName} temperature,historical weather,meteorological data,temperature change,climate analysis`
      };
    }
  };

  // 设置页面标题和SEO信息
  useEffect(() => {
    if (currentCity) {
      const seoData = getCitySEOData(currentCity);
      document.title = seoData.title;
      
      // 更新meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', seoData.description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', seoData.description);
        document.getElementsByTagName('head')[0].appendChild(metaDescription);
      }
      
      // 更新meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', seoData.keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', seoData.keywords);
        document.getElementsByTagName('head')[0].appendChild(metaKeywords);
      }
    }
  }, [currentCity, i18n.language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !currentCity) {
    return <NotFound />;
  }

  return (
    <>

      {/* 页面内容 */}
      <div className="space-y-6">
        {/* 城市信息头部 */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-custom">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-primary mb-2">
                📍 {getCityLocalizedName(currentCity, t)}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                <span>🌍 {currentCity.country}</span>
                <span>📍 {currentCity.latitude.toFixed(4)}°, {currentCity.longitude.toFixed(4)}°</span>
                <span>🕒 {currentCity.timezone}</span>
              </div>
            </div>
            <div className="text-4xl opacity-20">
              🏙️
            </div>
          </div>
          
          {/* 城市描述 */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-custom/50">
            <p className="text-secondary leading-relaxed">
              {i18n.language.startsWith('zh') ? (
                `探索${getCityLocalizedName(currentCity, t)}的历史气温数据，了解这座城市的气候特征和温度变化趋势。我们提供详细的历史同期数据对比，帮助您深入了解${getCityLocalizedName(currentCity, t)}的气象规律。`
              ) : (
                `Explore the historical temperature data of ${getCityLocalizedName(currentCity, t)} to understand the climate characteristics and temperature trends of this city. We provide detailed historical period data comparisons to help you gain deeper insights into the meteorological patterns of ${getCityLocalizedName(currentCity, t)}.`
              )}
            </p>
          </div>
        </div>

        {/* 历史数据组件 */}
        <HomepageHistoricalDaily overrideLocation={currentCity} />
      </div>
    </>
  );
};

export default CityPage;