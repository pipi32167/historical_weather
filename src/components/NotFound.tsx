import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  MapPinIcon, 
  ChartBarSquareIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 设置页面标题
  React.useEffect(() => {
    document.title = '页面未找到 (404) - 历史气温数据分析平台';
  }, []);

  // 热门城市建议
  const popularCities = [
    { name: '北京', path: '/beijing' },
    { name: '上海', path: '/shanghai' },
    { name: '广州', path: '/guangzhou' },
    { name: '深圳', path: '/shenzhen' },
    { name: '杭州', path: '/hangzhou' },
    { name: '成都', path: '/chengdu' }
  ];

  // 推荐功能
  const recommendedFeatures = [
    {
      title: '历史气温对比',
      description: '查看同一日期不同年份的气温变化',
      path: '/historical/daily',
      icon: ChartBarSquareIcon
    },
    {
      title: '月度趋势分析',
      description: '分析月度气温变化趋势和统计数据',
      path: '/historical/monthly',
      icon: ChartBarSquareIcon
    },
    {
      title: '关于我们',
      description: '了解平台功能和技术架构',
      path: '/about',
      icon: MagnifyingGlassIcon
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
        <h2 className="text-2xl font-semibold text-primary mb-4">页面未找到</h2>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
          抱歉，您访问的页面不存在。可能是URL输入错误，或者页面已被移动。
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            当前路径: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{location.pathname}</code>
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
            <HomeIcon className="h-5 w-5" />
            <span>返回首页</span>
          </button>
        </div>
      </div>

      {/* 热门城市推荐 */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-primary mb-6 text-center">
          <MapPinIcon className="h-6 w-6 inline-block mr-2" />
          热门城市气温查询
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
              <div className="text-xs text-secondary mt-1">查看历史气温</div>
            </button>
          ))}
        </div>
      </div>

      {/* 推荐功能 */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold text-primary mb-6 text-center">
          推荐功能
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
        <h3 className="text-lg font-semibold text-primary mb-4">关于历史气温数据分析平台</h3>
        <div className="text-secondary text-sm space-y-2">
          <p>
            <strong>历史气温数据分析平台</strong>是专业的气象数据查询和分析工具，
            为全球用户提供1940年至今的详细历史气温记录。
          </p>
          <p>
            平台支持<strong>全球城市气温查询</strong>、<strong>历史同期对比分析</strong>、
            <strong>气温趋势可视化</strong>等功能，数据来源于权威的Open-Meteo气象API。
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
              历史气温数据
            </span>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs">
              气温趋势分析
            </span>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs">
              全球城市查询
            </span>
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded text-xs">
              专业数据可视化
            </span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-8 text-center text-sm text-secondary">
        <p>如果您认为这是一个错误，请联系我们 <a href="mailto:contact@historical-temperature.com" className="text-primary-600 hover:underline">contact@historical-temperature.com</a></p>
      </div>
    </div>
  );
};

export default NotFound;