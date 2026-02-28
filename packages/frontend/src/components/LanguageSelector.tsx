'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'pt-BR', label: 'Portugues', flag: 'PT' },
  { code: 'es', label: 'Espanol', flag: 'ES' },
];

const LANG_STORAGE_KEY = 'clickwin_language';

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(LANG_STORAGE_KEY) ?? 'en';
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeLanguage = useCallback(async (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem(LANG_STORAGE_KEY, langCode);
    setIsOpen(false);

    // Attempt to use i18next if available
    try {
      const i18n = (await import('i18next')).default;
      if (i18n.isInitialized) {
        await i18n.changeLanguage(langCode);
      }
    } catch {
      // i18next not available, just persist the selection
    }

    // Set HTML lang attribute
    document.documentElement.lang = langCode;
  }, []);

  const selected = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
        aria-label="Select language"
      >
        <span className="text-xs font-bold text-[#E0E0FF]/60">
          {selected.flag}
        </span>
        <svg
          className={`w-3 h-3 text-[#E0E0FF]/40 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#1A1A2E] border border-white/10 shadow-xl overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChangeLanguage(lang.code)}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                lang.code === currentLang
                  ? 'bg-[#6C5CE7]/10 text-[#00D2FF]'
                  : 'text-[#E0E0FF]/70 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-bold w-6">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === currentLang && (
                <svg
                  className="w-3.5 h-3.5 ml-auto text-[#00D2FF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
