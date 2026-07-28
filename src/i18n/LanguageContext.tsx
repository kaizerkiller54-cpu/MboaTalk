import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { t as translate, Lang, TranslationKey } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('securconnect_lang') as Lang) || 'fr';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('securconnect_lang', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
