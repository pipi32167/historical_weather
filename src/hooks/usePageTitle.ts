import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UsePageTitleOptions {
  /** 页面标题key */
  titleKey: string;
  /** 用于插值的变量，比如location */
  variables?: Record<string, string>;
  /** 是否添加后缀 */
  includeSuffix?: boolean;
}

/**
 * 动态设置页面标题的Hook
 * 支持多语言和变量插值
 */
export const usePageTitle = ({ 
  titleKey, 
  variables = {}, 
  includeSuffix = true 
}: UsePageTitleOptions) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // 获取翻译后的标题
    let title = t(`page.title.${titleKey}`, variables);
    
    // 如果需要添加后缀
    if (includeSuffix) {
      const suffix = t('page.title.suffix');
      title += suffix;
    }

    // 设置页面标题
    document.title = title;

    // 同时更新HTML元数据
    const metaTitle = document.querySelector('meta[name="title"]');
    if (metaTitle) {
      metaTitle.setAttribute('content', title);
    }

    // 更新Open Graph标题
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    // 更新Twitter标题
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
  }, [t, i18n.language, titleKey, variables, includeSuffix]);
};

/**
 * 快捷方法：设置首页标题
 */
export const useHomePageTitle = () => {
  usePageTitle({ titleKey: 'home' });
};

/**
 * 快捷方法：设置历史数据页面标题
 */
export const useHistoricalPageTitle = (
  type: 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
  location?: string
) => {
  usePageTitle({ 
    titleKey: type, 
    variables: { location: location || '全球' }
  });
};

/**
 * 快捷方法：设置地图页面标题
 */
export const useMapPageTitle = () => {
  usePageTitle({ titleKey: 'map' });
};

/**
 * 快捷方法：设置关于页面标题
 */
export const useAboutPageTitle = () => {
  usePageTitle({ titleKey: 'about' });
};

/**
 * 快捷方法：设置404页面标题
 */
export const useNotFoundPageTitle = () => {
  usePageTitle({ titleKey: 'notFound' });
};