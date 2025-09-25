import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotFoundPageTitle } from '../hooks/usePageTitle';
import ContactModal from './ContactModal';
import { 
  Home, 
  MapPin, 
  BarChart3,
  Search
} from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // 设置页面标题
  useNotFoundPageTitle();

  // 热门城市建议
  const popularCities = [
    { name: t('notFound.beijingCity'), path: '/beijing' },
    { name: t('notFound.shanghaiCity'), path: '/shanghai' },
    { name: t('notFound.guangzhouCity'), path: '/guangzhou' },
    { name: t('notFound.shenzhenCity'), path: '/shenzhen' },
    { name: t('notFound.hangzhouCity'), path: '/hangzhou' },
    { name: t('notFound.chengduCity'), path: '/chengdu' }
  ];

  // 推荐功能
  const recommendedFeatures = [
    {
      title: t('notFound.historicalComparison'),
      description: t('notFound.historicalComparisonDesc'),
      path: '/historical/daily',
      icon: BarChart3
    },
    {
      title: t('notFound.monthlyTrendAnalysis'),
      description: t('notFound.monthlyTrendAnalysisDesc'),
      path: '/historical/monthly',
      icon: BarChart3
    },
    {
      title: t('navigation.about'),
      description: t('notFound.aboutUsDesc'),
      path: '/about',
      icon: Search
    }
  ];

  const handleCityClick = (cityPath: string) => {
    navigate(cityPath);
  };

  const handleFeatureClick = (featurePath: string) => {
    navigate(featurePath);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* 404错误信息 */}
      <div className="text-center mb-12">
        <div className="text-8xl mb-6">🌡️</div>
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-primary mb-4">{t('notFound.title')}</h2>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
          {t('notFound.description')}
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            {t('notFound.currentPath')} <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{location.pathname}</code>
          </span>
        </p>
      </div>

      {/* 快速导航 */}
      <div className="mb-12">
        <div className="flex justify-center mb-8">
          <button
            onClick={handleHomeClick}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            <Home className="h-5 w-5" />
            <span>{t('notFound.backToHome')}</span>
          </button>
        </div>
      </div>

      {/* 热门城市推荐 */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-primary mb-6 text-center">
          <MapPin className="h-6 w-6 inline-block mr-2" />
          {t('notFound.popularCities')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCities.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityClick(city.path)}
              className="bg-primary hover:bg-primary/80 border border-custom rounded-lg p-4 text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="text-2xl mb-2">🏙️</div>
              <div className="text-primary font-medium">{city.name}</div>
              <div className="text-xs text-secondary mt-1">{t('notFound.viewHistoricalTemp')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 推荐功能 */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-primary mb-6 text-center">
          {t('notFound.recommendedFeatures')}
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {recommendedFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                onClick={() => handleFeatureClick(feature.path)}
                className="bg-primary hover:bg-primary/80 border border-custom rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <IconComponent className="h-8 w-8 text-primary-600" />
                  <h4 className="text-lg font-semibold text-primary">{feature.title}</h4>
                </div>
                <p className="text-secondary text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEO友好的内容 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 border border-custom">
        <h3 className="text-lg font-semibold text-primary mb-4">{t('about.title')}</h3>
        <div className="text-secondary text-sm space-y-2">
          <p>
            {t('notFound.platformDescription')}
          </p>
          <p>
            {t('notFound.platformFeatures')}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
              {t('notFound.dataTagHistory')}
            </span>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs">
              {t('notFound.dataTagTrend')}
            </span>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs">
              {t('notFound.dataTagGlobal')}
            </span>
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded text-xs">
              {t('notFound.dataTagVisualization')}
            </span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-8 text-center text-sm text-secondary">
        <p>{t('notFound.contactError')} <button 
          onClick={() => setIsContactModalOpen(true)}
          className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >{t('about.contact.emailLabel')}</button></p>
      </div>

      {/* 联系表单模态框 */}
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
};

export default NotFound;