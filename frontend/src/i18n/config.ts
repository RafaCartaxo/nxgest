import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import ptBR from "./locales/pt-BR.json"
import en from "./locales/en.json"
import es from "./locales/es.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

// `<html lang>` dinâmico (PLAN-062) — acessibilidade/SEO acompanha o idioma.
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng
})

export default i18n
