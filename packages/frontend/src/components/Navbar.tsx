'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import WalletButton from './WalletButton';
import LanguageSelector from './LanguageSelector';

const NAV_LINKS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/about', labelKey: 'nav.about' },
  { href: '/help', labelKey: 'nav.help' },
  { href: '/partner', labelKey: 'nav.partner' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ background: 'rgba(15, 15, 35, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #6C5CE7, #00D2FF)' }}>
              CW
            </div>
            <span className="text-lg font-bold text-text group-hover:text-primary transition-colors hidden sm:block">
              Click Win
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Wallet Button (desktop) */}
            <div className="hidden sm:block">
              <WalletButton />
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-all"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10" style={{ background: 'rgba(15, 15, 35, 0.95)' }}>
          <div className="px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Mobile Wallet */}
            <div className="pt-3 border-t border-white/10">
              <WalletButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
