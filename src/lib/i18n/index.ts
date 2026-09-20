import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

import es from '../../public/locales/es/common.json'
import en from '../../public/locales/en/common.json'
import zh from '../../public/locales/zh/common.json'
import ar from '../../public/locales/ar/common.json'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      zh: { translation: zh },
      ar: { translation: ar },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'zh', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
