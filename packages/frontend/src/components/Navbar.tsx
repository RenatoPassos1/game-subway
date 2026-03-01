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
  { href: '/whitepaper', labelKey: 'nav.whitepaper' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for visual effects
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-primary/20 shadow-glow-primary'
          : 'border-white/10'
      }`}
      style={{
        background: scrolled
          ? 'rgba(15, 15, 35, 0.92)'
          : 'rgba(15, 15, 35, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Scanline overlay - visible on scroll */}
      {scrolled && <div className="scanline-overlay rounded-none" />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/favicon.svg"
              alt="Click Win"
              className="w-8 h-8 icon-pulse"
            />
            <span className="text-xl font-bold font-heading gradient-text transition-opacity duration-300 group-hover:opacity-80">
              Click
            </span>
            <span className="text-xl font-bold font-heading text-white transition-colors duration-300 group-hover:text-primary">
              Win
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-mono tracking-wide transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10 border border-primary/20'
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

            {/* Mobile Hamburger - tech-badge styled */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden tech-badge !px-2 !py-1.5 cursor-pointer transition-all hover:border-primary/50"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-white/10 relative" style={{ background: 'rgba(15, 15, 35, 0.95)' }}>
          <div className="scanline-overlay rounded-none" />
          <div className="relative z-10 px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium font-mono tracking-wide transition-all ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10 border border-primary/20'
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
