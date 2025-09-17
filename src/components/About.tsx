import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAboutPageTitle } from '../hooks/usePageTitle';
import { 
  BarChart3, 
  Globe, 
  Clock,
  GraduationCap,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';

const About: React.FC = () => {
  const { t } = useTranslation();
  
  // 设置页面标题
  useAboutPageTitle();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">{t('about.title')}</h1>
        <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
          {t('about.subtitle')}
        </p>
      </div>

      {/* 平台简介 */}
      <div className="bg-primary border border-custom rounded-lg p-8">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">🌡️</div>
          <div>
            <h2 className="text-2xl font-bold text-primary mb-4">{t('about.platformIntro.title')}</h2>
            <div className="text-secondary space-y-4">
              <p>
                {t('about.platformIntro.description1')}
              </p>
              <p>
                {t('about.platformIntro.description2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 核心功能 */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">{t('about.features.title')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.historicalComparison.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.historicalComparison.description')}
            </p>
          </div>

          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.globalCoverage.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.globalCoverage.description')}
            </p>
          </div>

          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.longTermData.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.longTermData.description')}
            </p>
          </div>

          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.professionalAnalysis.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.professionalAnalysis.description')}
            </p>
          </div>

          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.smartVisualization.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.smartVisualization.description')}
            </p>
          </div>

          <div className="bg-primary border border-custom rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary">{t('about.features.authoritativeData.title')}</h3>
            </div>
            <p className="text-secondary">
              {t('about.features.authoritativeData.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 技术架构 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 border border-custom">
        <h2 className="text-2xl font-bold text-primary mb-4">{t('about.techStack.title')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">{t('about.techStack.frontend.title')}</h3>
            <ul className="text-secondary space-y-2">
              {(t('about.techStack.frontend.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">{t('about.techStack.backend.title')}</h3>
            <ul className="text-secondary space-y-2">
              {(t('about.techStack.backend.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 适用场景 */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">{t('about.useCases.title')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">{t('about.useCases.academic.title')}</h3>
            <ul className="text-secondary space-y-2">
              {(t('about.useCases.academic.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">{t('about.useCases.business.title')}</h3>
            <ul className="text-secondary space-y-2">
              {(t('about.useCases.business.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
        <h2 className="text-xl font-bold text-primary mb-4">📋 {t('about.dataInfo.title')}</h2>
        <div className="text-secondary space-y-2">
          <p><strong>{t('about.dataInfo.source')}</strong></p>
          <p><strong>{t('about.dataInfo.range')}</strong></p>
          <p><strong>{t('about.dataInfo.frequency')}</strong></p>
          <p><strong>{t('about.dataInfo.precision')}</strong></p>
          <p><strong>{t('about.dataInfo.disclaimer')}</strong></p>
        </div>
      </div>

      {/* 联系信息 */}
      <div className="text-center bg-primary border border-custom rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">{t('about.contact.title')}</h2>
        <p className="text-secondary mb-4">
          {t('about.contact.description')}
        </p>
        <div className="space-y-2 text-secondary">
          <p>📧 {t('about.contact.email')}</p>
          <p>🌐 {t('about.contact.website')}</p>
          <p>📱 {t('about.contact.github')}</p>
        </div>
      </div>
    </div>
  );
};

export default About;