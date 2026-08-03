"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { setPreferenceCookie, getPreferenceCookie } from "@/lib/security/cookies";
import { setDocument, getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { firebaseAuth } from "@/lib/firebase/config";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const DEFAULT_LANGUAGE: LanguageOption = { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" };

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  DEFAULT_LANGUAGE,
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇦🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(DEFAULT_LANGUAGE);

  useEffect(() => {
    async function loadLangPreference() {
      try {
        // 1. Check user Firestore profile if authenticated
        const currentUser = firebaseAuth.currentUser;
        if (currentUser?.uid) {
          const userDoc = await getDocument<{ preferredLanguage?: string }>(COLLECTIONS.USERS, currentUser.uid);
          if (userDoc?.preferredLanguage) {
            const found = SUPPORTED_LANGUAGES.find((l) => l.code === userDoc.preferredLanguage);
            if (found) {
              setCurrentLanguage(found);
              setPreferenceCookie("language", found.code);
              return;
            }
          }
        }

        // 2. Check preference cookie
        const cookieLangCode = getPreferenceCookie("language");
        if (cookieLangCode) {
          const found = SUPPORTED_LANGUAGES.find((l) => l.code === cookieLangCode);
          if (found) {
            setCurrentLanguage(found);
            return;
          }
        }

        // 3. Fallback to localStorage / browser language
        const savedLangCode = localStorage.getItem("fr8x_user_lang");
        if (savedLangCode) {
          const found = SUPPORTED_LANGUAGES.find((l) => l.code === savedLangCode);
          if (found) {
            setCurrentLanguage(found);
            return;
          }
        }

        // Auto-detect browser device language
        const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || "").toLowerCase();
        let autoSelectedCode = "en";
        if (navLang.startsWith("hi")) autoSelectedCode = "hi";
        else if (navLang.startsWith("es")) autoSelectedCode = "es";
        else if (navLang.startsWith("fr")) autoSelectedCode = "fr";
        else if (navLang.startsWith("de")) autoSelectedCode = "de";
        else if (navLang.startsWith("zh")) autoSelectedCode = "zh";
        else if (navLang.startsWith("ar")) autoSelectedCode = "ar";
        else if (navLang.startsWith("pt")) autoSelectedCode = "pt";
        else if (navLang.startsWith("ja")) autoSelectedCode = "ja";

        const match = SUPPORTED_LANGUAGES.find((l) => l.code === autoSelectedCode) || DEFAULT_LANGUAGE;
        setCurrentLanguage(match);
      } catch {
        /* ignore SSR / storage errors */
      }
    }

    loadLangPreference();
  }, []);

  const handleSetLanguage = async (lang: LanguageOption) => {
    setCurrentLanguage(lang);
    setPreferenceCookie("language", lang.code);
    try {
      localStorage.setItem("fr8x_user_lang", lang.code);
    } catch { /* ignore */ }

    // Save language selection to user profile in Firestore for cross-device persistence
    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser?.uid) {
        await setDocument(COLLECTIONS.USERS, currentUser.uid, { preferredLanguage: lang.code }, true);
      }
    } catch { /* ignore non-critical write error */ }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:bg-[var(--fr8x-mist)] rounded transition-colors"
        title="Select Language"
      >
        <Globe className="h-3 w-3 text-foreground-muted" />
        <span>{currentLanguage.flag}</span>
        <span className="hidden sm:inline uppercase text-[10px] tracking-wider">{currentLanguage.code}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 w-36 rounded-md bg-white border border-border shadow-lg py-1 text-[11px]">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-2.5 py-1 hover:bg-[var(--fr8x-mist)] transition-colors ${
                  currentLanguage.code === lang.code ? "font-bold text-[var(--fr8x-periwinkle)]" : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                <span className="text-[9px] text-foreground-muted">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
