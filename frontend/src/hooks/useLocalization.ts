import { useState, useEffect, useCallback } from "react";
import { LANGUAGES } from "../languages";
import type { Language } from "../types/ArticleProps";

export function useLocalization() {
  const getInitialLanguage = useCallback((): Language => {
    const savedLanguageId = localStorage.getItem("lang");
    return (
      LANGUAGES.find((lang) => lang.id === savedLanguageId) || LANGUAGES[0]
    );
  }, []);

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getInitialLanguage);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    localStorage.setItem("lang", currentLanguage.id);
  }, [currentLanguage]);

  const setLanguage = useCallback((languageId: string) => {
    const newLanguage = LANGUAGES.find((lang) => lang.id === languageId);
    if (newLanguage && newLanguage.id !== currentLanguage.id) {
      setIsChanging(true);
      setCurrentLanguage(newLanguage);
      
      // 优雅的语言切换，不使用 reload
      setTimeout(() => {
        setIsChanging(false);
        // 可以在这里触发重新获取文章或其他必要的更新
        window.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { newLanguage } 
        }));
      }, 300);
    } else if (!newLanguage) {
      console.warn(`Language not found: ${languageId}`);
    }
  }, [currentLanguage.id]);

  return {
    currentLanguage,
    setLanguage,
    isChanging,
    availableLanguages: LANGUAGES,
  };
}
