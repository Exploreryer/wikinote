import { useState, useEffect, useCallback } from "react";
import { LANGUAGES } from "../languages";
import type { Language } from "../types/ArticleProps";
import { StorageAdapter } from "../utils/environment";

export function useLocalization() {
  const getInitialLanguage = useCallback(async (): Promise<Language> => {
    const savedLanguageId = await StorageAdapter.get("lang");
    return (
      LANGUAGES.find((lang) => lang.id === savedLanguageId) || LANGUAGES[0]
    );
  }, []);

  const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]);

  // 初始化时从存储加载语言设置
  useEffect(() => {
    getInitialLanguage().then((lang) => {
      setCurrentLanguage(lang);
    });
  }, [getInitialLanguage]);

  useEffect(() => {
    StorageAdapter.set("lang", currentLanguage.id);
  }, [currentLanguage]);

  const setLanguage = (languageId: string) => {
    const newLanguage = LANGUAGES.find((lang) => lang.id === languageId);
    if (newLanguage) {
      setCurrentLanguage(newLanguage);
      window.location.reload(); // 使用原始的正确方式
    } else {
      console.warn(`Language not found: ${languageId}`);
    }
  };

  return {
    currentLanguage,
    setLanguage,
    availableLanguages: LANGUAGES,
  };
}
