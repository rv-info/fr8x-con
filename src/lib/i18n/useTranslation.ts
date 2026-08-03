// FR8X-CON Translation Hook — Device & Profile Persistent i18n
"use client";

import { useLanguage } from "@/components/ui/LanguageSelector";
import { TRANSLATIONS, SupportedLanguageCode, TranslationKeys } from "./translations";

export function useTranslation() {
  const { currentLanguage } = useLanguage();
  const langCode = (currentLanguage?.code || "en") as SupportedLanguageCode;

  const t = (key: keyof TranslationKeys): string => {
    const langDict = TRANSLATIONS[langCode] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  return { t, currentLanguageCode: langCode };
}
