'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import AuctionPanel from '../components/AuctionPanel';
import ClickButton from '../components/ClickButton';
import Timer from '../components/Timer';
import DepositPanel from '../components/DepositPanel';

const STATS = [
  { valueKey: 'home.stats.users', labelKey: 'home.stats.usersLabel', icon: '👥' },
  { valueKey: 'home.stats.auctions', labelKey: 'home.stats.auctionsLabel', icon: '🏆' },
  { valueKey: 'home.stats.settled', labelKey: 'home.stats.settledLabel', icon: '💰' },
  { valueKey: 'home.stats.chain', labelKey: 'home.stats.chainLabel', icon: '⛓️' },
];

const STEPS = [
  { number: '1', titleKey: 'home.steps.connect.title', descKey: 'home.steps.connect.desc', icon: '🔗' },
  { number: '2', titleKey: 'home.steps.deposit.title', descKey: 'home.steps.deposit.desc', icon: '💳' },
  { number: '3', titleKey: 'home.steps.click.title', descKey: 'home.steps.click.desc', icon: '🖱️' },
  { number: '4', titleKey: 'home.steps.win.title', descKey: 'home.steps.win.desc', icon: '🎉' },
];

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />

        <div className="relative z-10 section-container text-center">
          <div className="max-w-4xl mx-auto">
            <div className="tech-badge mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>{t('home.hero.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-heading">
              <span className="text-text">{t('home.hero.titleLine1')}</span>
              <br />
              <span className="gradient-text">{t('home.hero.titleLine2')}</span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-accent text-lg px-8 py-4 w-full sm:w-auto">
                {t('home.cta.start')}
              </button>
              <Link href="/about" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto text-center">
                {t('home.cta.learn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auction Area */}
      <section className="section-container">
        <div className="text-center mb-12">
          <h2 className="section-title">{t('home.auction.title')}</h2>
          <p className="section-subtitle mx-auto">{t('home.auction.subtitle')}</p>
        </div>

        <div className="glass-card p-8 md:p-12 relative">
          <div className="scanline-overlay" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Auction Info Panel */}
            <AuctionPanel />

            {/* Click Button + Timer Area */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <Timer />
              <ClickButton />
              <p className="text-text-muted text-sm text-center max-w-xs">
                {t('auction.clickInfo')}
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Panel */}
        <div className="mt-8">
          <DepositPanel />
        </div>
      </section>

      {/* How It Works */}
      <section className="section-container">
        <div className="text-center mb-12">
          <p className="mono-label mb-3">{t('home.howItWorks.subtitle')}</p>
          <h2 className="section-title">{t('home.howItWorks.title')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="text-lg font-semibold text-text mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat) => (
            <div key={stat.labelKey} className="stat-card">
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="stat-value">{t(stat.valueKey)}</div>
              <div className="stat-label">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container">
        <div className="glass-card p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #6C5CE7 0%, transparent 70%)' }} />
          <div className="scanline-overlay" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4 font-heading">
              {t('home.finalCta.title')}
            </h2>
            <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
              {t('home.finalCta.subtitle')}
            </p>
            <button className="btn-primary text-lg px-10 py-4">
              {t('home.finalCta.btn')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
