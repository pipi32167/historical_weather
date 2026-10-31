import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'zh': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  },
  'en': {
    translation: enUS
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en-US', // Default language when detection fails
    // Remove lng to let LanguageDetector work properly
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    
    // Define supported languages
    supportedLngs: ['zh-CN', 'zh', 'en-US', 'en'],
    // Don't load missing translations as en-US for zh variants
    load: 'languageOnly',
    // Fallback to en-US for any unsupported language
    cleanCode: true,
    // Only load specified languages
    nonExplicitSupportedLngs: true
  });

/**
 * 同步 <html lang>：index.html 写死了 lang="en"，切换语言后不会变化，
 * 会让屏幕阅读器、浏览器翻译、搜索引擎一直按英文处理中文页面。
 */
const syncHtmlLang = (language?: string) => {
  if (typeof document === 'undefined') return;
  const current = language || i18n.language || 'zh-CN';
  document.documentElement.lang = current.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
};

i18n.on('languageChanged', syncHtmlLang);

if (i18n.isInitialized) {
  syncHtmlLang();
} else {
  i18n.on('initialized', () => syncHtmlLang());
}

export default i18n;