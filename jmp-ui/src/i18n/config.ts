import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import ru from './ru.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'ru',
    supportedLngs: ['en', 'ru'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Russian is the default language; only an explicit user choice is cached.
      // The browser locale is intentionally not used as a source.
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

export default i18n;
