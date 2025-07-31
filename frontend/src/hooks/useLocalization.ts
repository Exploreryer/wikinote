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

  useEffect(() => {
    localStorage.setItem("lang", currentLanguage.id);
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
