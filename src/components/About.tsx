import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAboutPageTitle } from '../hooks/usePageTitle';
import { useStructuredData } from './StructuredData';
import { 
  Github,
  Mail,
  Coffee,
  Heart,
  Code,
  Globe,
  Lightbulb
} from 'lucide-react';

const About: React.FC = () => {
  const { t } = useTranslation();
  
  // 设置页面标题
  useAboutPageTitle();

  // 添加结构化数据
  useStructuredData({
    type: 'WebPage',
    title: t('about.developer.name'),
    description: t('about.developer.bio'),
    url: 'https://historicalweather.org/about',
    keywords: ['historical weather', 'weather data', 'climate analysis', 'developer', 'about'],
    dateModified: new Date().toISOString()
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* 个人介绍 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {t('about.developer.initial')}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('about.developer.name')}
            </h1>
            <p className="text-lg text-blue-600 dark:text-blue-400 mb-4">
              {t('about.developer.title')}
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('about.developer.bio')}
            </p>
          </div>
        </div>
      </div>

      {/* 项目介绍 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-4xl">🌡️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('about.project.title')}
          </h2>
        </div>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>{t('about.project.description1')}</p>
          <p>{t('about.project.description2')}</p>
          <p>{t('about.project.description3')}</p>
        </div>
      </div>

      {/* 为什么创建这个项目 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('about.motivation.title')}
          </h2>
        </div>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>{t('about.motivation.description1')}</p>
          <p>{t('about.motivation.description2')}</p>
        </div>
      </div>

      {/* 技术栈和特色 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Code className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('about.tech.title')}
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            {(t('about.tech.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('about.features.title')}
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            {(t('about.features.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 数据来源 */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('about.dataSource.title')}
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('about.dataSource.description')}
        </p>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong>{t('about.dataSource.coverage')}</strong>
          </div>
          <div>
            <strong>{t('about.dataSource.accuracy')}</strong>
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {t('about.contact.title')}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          {t('about.contact.description')}
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href={`mailto:${t('about.contact.email')}`}
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('about.contact.emailLabel')}</span>
          </a>

          <a
            href={t('about.contact.githubUrl')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Github className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">GitHub</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('about.contact.githubLabel')}</span>
          </a>

          <div className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Coffee className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{t('about.contact.coffee')}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{t('about.contact.coffeeDesc')}</span>
          </div>
        </div>
      </div>

      {/* 感谢 */}
      <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('about.thanks.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('about.thanks.description')}
        </p>
        <div className="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Open-Meteo</span>
          <span>•</span>
          <span>OpenStreetMap</span>
          <span>•</span>
          <span>React</span>
          <span>•</span>
          <span>{t('about.thanks.community')}</span>
        </div>
      </div>
    </div>
  );
};

export default About;