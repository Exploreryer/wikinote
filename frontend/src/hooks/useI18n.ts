import { useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';

type TranslationKey = string;

export function useI18n() {
  const [currentLocale] = useState<string>(() => {
    const saved = localStorage.getItem('locale');
    // 只允许英文，其他语言都强制为英文
    if (saved && saved !== 'en') {
      localStorage.setItem('locale', 'en');
      return 'en';
    }
    return 'en'; // 默认始终为英文
  });

  useEffect(() => {
    // 确保始终保存为英文
    localStorage.setItem('locale', 'en');
  }, [currentLocale]);

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    // 始终使用英文翻译
    let value: any = enTranslations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const setLocale = (_locale: string) => {
    // 忽略任何语言切换请求，始终保持英文
    console.log('Interface language is locked to English');
  };

  return {
    t,
    currentLocale: 'en', // 始终返回英文
    setLocale,
    availableLocales: ['en'], // 只提供英文选项
  };
}