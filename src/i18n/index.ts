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
    fallbackLng: 'zh-CN', // Default language
    lng: 'zh-CN', // Force initial language
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    
    // Define supported languages
    supportedLngs: ['zh-CN', 'zh', 'en-US', 'en'],
    // Don't load missing translations as en-US for zh variants
    load: 'languageOnly',
    // Fallback to zh-CN for any unsupported language
    cleanCode: true,
    // Only load specified languages
    nonExplicitSupportedLngs: true
  });

export default i18n;