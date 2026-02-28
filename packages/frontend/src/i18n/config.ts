'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../../public/locales/en/translation.json';
import ptBRTranslation from '../../public/locales/pt-BR/translation.json';
import esTranslation from '../../public/locales/es/translation.json';

const resources = {
  en: { translation: enTranslation },
  'pt-BR': { translation: ptBRTranslation },
  es: { translation: esTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'navigator', 'htmlTag', 'path', 'subdomain'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
