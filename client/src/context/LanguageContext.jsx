import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, translations, getTranslation } from '../data/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('crop2go_lang') || 'en';
  });

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('crop2go_lang', langCode);
  };

  const t = (key, fallback = '') => {
    return getTranslation(currentLang, key, fallback);
  };

  useEffect(() => {
    document.documentElement.lang = currentLang;
    if (['ur', 'ks', 'sd'].includes(currentLang)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLang]);

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
