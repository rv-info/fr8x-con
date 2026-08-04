"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { setPreferenceCookie, getPreferenceCookie } from "@/lib/security/cookies";
import { setDocument, getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { firebaseAuth } from "@/lib/firebase/config";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  continent: string;
}

export const DEFAULT_LANGUAGE: LanguageOption = {
  code: "en", name: "English", nativeName: "English", flag: "🇺🇸", continent: "Global",
};

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Global / Default
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", continent: "Global" },

  // Asia
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", continent: "Asia" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文(简体)", flag: "🇨🇳", continent: "Asia" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "中文(繁體)", flag: "🇹🇼", continent: "Asia" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", continent: "Asia" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", continent: "Asia" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", continent: "Asia" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", continent: "Asia" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", continent: "Asia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", continent: "Asia" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", continent: "Asia" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", continent: "Asia" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", continent: "Asia" },

  // Middle East & Africa
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇦🇪", continent: "Middle East" },
  { code: "fa", name: "Persian (Farsi)", nativeName: "فارسی", flag: "🇮🇷", continent: "Middle East" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", continent: "Middle East" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", continent: "Middle East" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", continent: "Africa" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹", continent: "Africa" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", flag: "🇳🇬", continent: "Africa" },

  // Europe
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", continent: "Europe" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", continent: "Europe" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", continent: "Europe" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", continent: "Europe" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", continent: "Europe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", continent: "Europe" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", continent: "Europe" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", continent: "Europe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", continent: "Europe" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴", continent: "Europe" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", continent: "Europe" },

  // Americas
  { code: "es-419", name: "Spanish (Latin America)", nativeName: "Español (Latinoamérica)", flag: "🌎", continent: "Americas" },
];

// Auto-detect best language from browser/device locale
function detectBestLanguage(): LanguageOption {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const navLangs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en"];

  for (const navLang of navLangs) {
    const lower = navLang.toLowerCase();
    // Exact match first
    const exact = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === lower);
    if (exact) return exact;
    const prefix = SUPPORTED_LANGUAGES.find((l) => lower.startsWith(l.code.toLowerCase().split("-")[0] || ""));
    if (prefix) return prefix;
  }
  return DEFAULT_LANGUAGE;
}

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

        // 3. Fallback to localStorage
        const savedLangCode = localStorage.getItem("fr8x_user_lang");
        if (savedLangCode) {
          const found = SUPPORTED_LANGUAGES.find((l) => l.code === savedLangCode);
          if (found) {
            setCurrentLanguage(found);
            return;
          }
        }

        // 4. Auto-detect from device/browser locale (English dominant unless absent)
        const detected = detectBestLanguage();
        setCurrentLanguage(detected);
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

// Group languages by continent for display
const CONTINENT_ORDER = ["Global", "Europe", "Asia", "Middle East", "Africa", "Americas"];
function groupedLanguages() {
  const groups: Record<string, LanguageOption[]> = {};
  for (const lang of SUPPORTED_LANGUAGES) {
    const cont = lang.continent || "Global";
    if (!groups[cont]) groups[cont] = [];
    (groups[cont] as LanguageOption[]).push(lang);
  }
  return CONTINENT_ORDER.filter((c) => groups[c] && groups[c]!.length > 0).map((c) => ({ continent: c, langs: groups[c] as LanguageOption[] }));
}

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? SUPPORTED_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--fr8x-mist)] transition-colors border border-transparent hover:border-slate-200"
        title="Select Language / Translation"
        aria-label="Language Selector"
      >
        <Globe className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
        <span className="text-[13px]">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
          {currentLanguage.code.split("-")[0]}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
          <div className="absolute right-0 mt-1.5 z-50 w-64 rounded-xl bg-white border border-border shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
                Translation / Language
              </p>
              <input
                type="text"
                placeholder="Search language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--fr8x-periwinkle)]"
                autoFocus
              />
            </div>

            {/* Language List */}
            <div className="max-h-72 overflow-y-auto">
              {filtered ? (
                filtered.length === 0 ? (
                  <p className="px-3 py-4 text-[12px] text-slate-400 text-center">No languages found</p>
                ) : (
                  <div className="py-1">
                    {filtered.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang); setIsOpen(false); setSearch(""); }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-[var(--fr8x-mist)] transition-colors ${
                          currentLanguage.code === lang.code
                            ? "font-bold text-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)]"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="flex-1 text-left">{lang.name}</span>
                        <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                groupedLanguages().map(({ continent, langs }) => (
                  <div key={continent}>
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      {continent}
                    </div>
                    {langs.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang); setIsOpen(false); setSearch(""); }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-[var(--fr8x-mist)] transition-colors ${
                          currentLanguage.code === lang.code
                            ? "font-bold text-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)]"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="flex-1 text-left">{lang.name}</span>
                        <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}



