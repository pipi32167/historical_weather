import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCityByName, getCityLocalizedName } from '../data/cityMappings';
import { Location } from '../types/weather';
import CityHistoricalDaily from '../components/CityHistoricalDaily';
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
        title: `${cityName}历史气温数据查询 | 过去天气温度趋势分析平台`,
        description: `查询${cityName}的历史气温数据，包括过去天气记录、历史温度变化、最高温、最低温、平均温度等详细气象信息。专业的${cityName}历史天气数据分析，支持多年份对比，了解${cityName}的过去温度和气候变化趋势。`,
        keywords: `${cityName}天气,${cityName}气温,${cityName}历史气温,${cityName}过去天气,${cityName}过去温度,历史天气,气象数据,温度变化,气候分析,${cityName}历史天气数据,${cityName}过去气温记录`
      };
    } else {
      return {
        title: `${cityName} Historical Temperature Data | Past Weather & Temperature Analysis Platform`,
        description: `Query historical temperature data for ${cityName}, including past weather records, historical temperature changes, maximum, minimum, and average temperatures with detailed meteorological information. Professional ${cityName} past weather data analysis with multi-year comparison to understand ${cityName} past temperature and climate change trends.`,
        keywords: `${cityName} weather,${cityName} temperature,${cityName} historical temperature,${cityName} past weather,${cityName} past temperature,past weather ${cityName},past temperature ${cityName},historical temperature ${cityName},historical weather,meteorological data,temperature change,climate analysis,${cityName} historical weather data,${cityName} past weather records`
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

      // 添加Open Graph和Twitter Card meta标签
      const ogTags: Array<{ property?: string; name?: string; content: string }> = [
        { property: 'og:title', content: seoData.title },
        { property: 'og:description', content: seoData.description },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: seoData.title },
        { name: 'twitter:description', content: seoData.description }
      ];

      ogTags.forEach(tag => {
        const property = tag.property || tag.name!;
        const attribute = tag.property ? 'property' : 'name';
        let existingTag = document.querySelector(`meta[${attribute}="${property}"]`);
        
        if (existingTag) {
          existingTag.setAttribute('content', tag.content);
        } else {
          existingTag = document.createElement('meta');
          existingTag.setAttribute(attribute, property);
          existingTag.setAttribute('content', tag.content);
          document.getElementsByTagName('head')[0].appendChild(existingTag);
        }
      });

      // 添加JSON-LD结构化数据
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": seoData.title,
        "description": seoData.description,
        "url": window.location.href,
        "about": {
          "@type": "Place",
          "name": getCityLocalizedName(currentCity, t),
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": currentCity.latitude,
            "longitude": currentCity.longitude
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": currentCity.country
          }
        },
        "mainEntity": {
          "@type": "Dataset",
          "name": i18n.language.startsWith('zh') 
            ? `${getCityLocalizedName(currentCity, t)}历史气温数据集`
            : `${getCityLocalizedName(currentCity, t)} Historical Temperature Dataset`,
          "description": seoData.description,
          "keywords": seoData.keywords.split(',').map(k => k.trim())
        }
      };

      // 移除现有的JSON-LD script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // 添加新的JSON-LD script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.getElementsByTagName('head')[0].appendChild(script);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
                `探索${getCityLocalizedName(currentCity, t)}的历史气温数据和过去天气记录，了解这座城市的气候特征和过去温度变化趋势。我们提供${getCityLocalizedName(currentCity, t)}的历史气温分析，包括过去天气对比和历史温度统计，帮助您深入了解${getCityLocalizedName(currentCity, t)}的过去气象规律和温度变化模式。`
              ) : (
                `Explore the historical temperature data and past weather records of ${getCityLocalizedName(currentCity, t)} to understand the climate characteristics and past temperature trends of this city. We provide ${getCityLocalizedName(currentCity, t)} historical temperature analysis, including past weather comparisons and historical temperature statistics to help you gain deeper insights into the past meteorological patterns and temperature changes of ${getCityLocalizedName(currentCity, t)}.`
              )}
            </p>
          </div>
        </div>

        {/* 历史数据组件 */}
        <CityHistoricalDaily location={currentCity} />

        {/* SEO内容区域 - 包含目标关键词 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-custom">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {i18n.language.startsWith('zh') ? (
              <>
                <h2 className="text-xl font-semibold text-primary mb-4">
                  {getCityLocalizedName(currentCity, t)}历史气温与过去天气数据分析
                </h2>
                <div className="space-y-4 text-secondary leading-relaxed">
                  <p>
                    <strong>{getCityLocalizedName(currentCity, t)}过去天气</strong>记录为我们提供了宝贵的气候信息。通过分析<strong>{getCityLocalizedName(currentCity, t)}历史气温</strong>数据，我们可以深入了解这座城市的气候模式和温度变化规律。
                  </p>
                  <p>
                    我们的平台专门收集和分析<strong>{getCityLocalizedName(currentCity, t)}过去温度</strong>记录，包括日最高温、日最低温和平均温度数据。这些<strong>{getCityLocalizedName(currentCity, t)}历史天气数据</strong>涵盖了多个年份，让您能够进行详细的气候趋势分析。
                  </p>
                  <p>
                    无论您是研究气候变化、规划旅行，还是进行学术研究，<strong>{getCityLocalizedName(currentCity, t)}过去气温记录</strong>都能为您提供准确可靠的参考信息。我们提供的历史温度数据可以帮助您了解{getCityLocalizedName(currentCity, t)}的季节性气候特征和长期温度变化趋势。
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-primary mb-4">
                  {getCityLocalizedName(currentCity, t)} Historical Temperature & Past Weather Data Analysis
                </h2>
                <div className="space-y-4 text-secondary leading-relaxed">
                  <p>
                    <strong>Past weather {getCityLocalizedName(currentCity, t)}</strong> records provide valuable climate information. By analyzing <strong>historical temperature {getCityLocalizedName(currentCity, t)}</strong> data, we can gain deep insights into this city's climate patterns and temperature change patterns.
                  </p>
                  <p>
                    Our platform specifically collects and analyzes <strong>past temperature {getCityLocalizedName(currentCity, t)}</strong> records, including daily maximum, minimum, and average temperature data. These <strong>{getCityLocalizedName(currentCity, t)} past weather</strong> records span multiple years, enabling you to conduct detailed climate trend analysis.
                  </p>
                  <p>
                    Whether you're studying climate change, planning travel, or conducting academic research, <strong>{getCityLocalizedName(currentCity, t)} past temperature</strong> records provide accurate and reliable reference information. Our historical temperature data helps you understand {getCityLocalizedName(currentCity, t)}'s seasonal climate characteristics and long-term temperature trends.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CityPage;