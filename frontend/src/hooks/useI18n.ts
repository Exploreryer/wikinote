import { useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';

type TranslationKey = string;
type Translations = typeof enTranslations;

const translations: Record<string, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

export function useI18n() {
  const [currentLocale, setCurrentLocale] = useState<string>(() => {
    const saved = localStorage.getItem('locale');
    if (saved && translations[saved]) {
      return saved;
    }
    // 检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('locale', currentLocale);
  }, [currentLocale]);

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations[currentLocale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // 降级到英文
    value = translations.en;
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const setLocale = (locale: string) => {
    if (translations[locale]) {
      setCurrentLocale(locale);
    }
  };

  return {
    t,
    currentLocale,
    setLocale,
    availableLocales: Object.keys(translations),
  };
}