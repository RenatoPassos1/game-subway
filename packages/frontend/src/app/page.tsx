'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import AuctionPanel from '../components/AuctionPanel';
import UpcomingAuctions from '../components/UpcomingAuctions';
import DepositPanel from '../components/DepositPanel';
import ReferralCTA from '../components/ReferralCTA';
import DynamicCarousel from '../components/DynamicCarousel';
import DynamicSideCards from '../components/DynamicSideCards';
import PastAuctions from '../components/PastAuctions';
import RevealOnScroll from '../components/RevealOnScroll';
import { useAuction } from '../hooks/useAuction';

// SVG icon components for steps
const StepIcons = {
  connect: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l1.757-1.757a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
    </svg>
  ),
  deposit: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  click: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
    </svg>
  ),
  win: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
    </svg>
  ),
};

// SVG icon components for stats
const StatIcons = {
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  auctions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
  settled: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chain: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
    </svg>
  ),
};

const STEP_THEMES = [
  { // Connect - primary/secondary
    accent: 'linear-gradient(90deg, transparent, #6C5CE7, #00D2FF, transparent)',
    glow: 'rgba(108, 92, 231, 0.08)',
    shadow: 'rgba(108, 92, 231, 0.12)',
    ping: 'rgba(108, 92, 231, 0.15)',
    ring: 'rgba(108, 92, 231, 0.1)',
    iconBg: 'rgba(108, 92, 231, 0.1)',
    numBg: 'linear-gradient(135deg, #6C5CE7, #00D2FF)',
    numShadow: 'rgba(108, 92, 231, 0.4)',
    iconColor: 'text-primary',
    cornerColor: 'text-primary',
  },
  { // Deposit - accent gold
    accent: 'linear-gradient(90deg, transparent, #FFD700, #FF8C00, transparent)',
    glow: 'rgba(255, 215, 0, 0.06)',
    shadow: 'rgba(255, 215, 0, 0.12)',
    ping: 'rgba(255, 215, 0, 0.15)',
    ring: 'rgba(255, 215, 0, 0.1)',
    iconBg: 'rgba(255, 215, 0, 0.08)',
    numBg: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    numShadow: 'rgba(255, 215, 0, 0.4)',
    iconColor: 'text-accent',
    cornerColor: 'text-accent',
  },
  { // Click - red/orange action
    accent: 'linear-gradient(90deg, transparent, #FF3B30, #FF7A18, transparent)',
    glow: 'rgba(255, 59, 48, 0.06)',
    shadow: 'rgba(255, 59, 48, 0.12)',
    ping: 'rgba(255, 59, 48, 0.15)',
    ring: 'rgba(255, 59, 48, 0.1)',
    iconBg: 'rgba(255, 59, 48, 0.08)',
    numBg: 'linear-gradient(135deg, #FF3B30, #FF7A18)',
    numShadow: 'rgba(255, 59, 48, 0.4)',
    iconColor: 'text-[#FF3B30]',
    cornerColor: 'text-[#FF3B30]',
  },
  { // Win - green/cyan
    accent: 'linear-gradient(90deg, transparent, #00FF88, #00D2FF, transparent)',
    glow: 'rgba(0, 255, 136, 0.06)',
    shadow: 'rgba(0, 255, 136, 0.12)',
    ping: 'rgba(0, 255, 136, 0.15)',
    ring: 'rgba(0, 255, 136, 0.1)',
    iconBg: 'rgba(0, 255, 136, 0.08)',
    numBg: 'linear-gradient(135deg, #00FF88, #00D2FF)',
    numShadow: 'rgba(0, 255, 136, 0.4)',
    iconColor: 'text-[#00FF88]',
    cornerColor: 'text-[#00FF88]',
  },
];

const STAT_THEMES = [
  { // Users - primary
    accent: 'linear-gradient(90deg, transparent, #6C5CE7, transparent)',
    glow: 'rgba(108, 92, 231, 0.08)',
    shadow: 'rgba(108, 92, 231, 0.12)',
    ping: 'rgba(108, 92, 231, 0.15)',
    ring: 'rgba(108, 92, 231, 0.1)',
    iconBg: 'rgba(108, 92, 231, 0.1)',
    gradient: 'linear-gradient(135deg, #6C5CE7, #00D2FF)',
    iconColor: 'text-primary',
    cornerColor: 'text-primary',
  },
  { // Auctions - gold
    accent: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
    glow: 'rgba(255, 215, 0, 0.06)',
    shadow: 'rgba(255, 215, 0, 0.12)',
    ping: 'rgba(255, 215, 0, 0.15)',
    ring: 'rgba(255, 215, 0, 0.1)',
    iconBg: 'rgba(255, 215, 0, 0.08)',
    gradient: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    iconColor: 'text-accent',
    cornerColor: 'text-accent',
  },
  { // Settled - green
    accent: 'linear-gradient(90deg, transparent, #00FF88, transparent)',
    glow: 'rgba(0, 255, 136, 0.06)',
    shadow: 'rgba(0, 255, 136, 0.12)',
    ping: 'rgba(0, 255, 136, 0.15)',
    ring: 'rgba(0, 255, 136, 0.1)',
    iconBg: 'rgba(0, 255, 136, 0.08)',
    gradient: 'linear-gradient(135deg, #00FF88, #00D2FF)',
    iconColor: 'text-[#00FF88]',
    cornerColor: 'text-[#00FF88]',
  },
  { // Chain - cyan
    accent: 'linear-gradient(90deg, transparent, #00D2FF, transparent)',
    glow: 'rgba(0, 210, 255, 0.06)',
    shadow: 'rgba(0, 210, 255, 0.12)',
    ping: 'rgba(0, 210, 255, 0.15)',
    ring: 'rgba(0, 210, 255, 0.1)',
    iconBg: 'rgba(0, 210, 255, 0.08)',
    gradient: 'linear-gradient(135deg, #00D2FF, #6C5CE7)',
    iconColor: 'text-secondary',
    cornerColor: 'text-secondary',
  },
];

const STATS = [
  { valueKey: 'home.stats.users', labelKey: 'home.stats.usersLabel', iconKey: 'users' as const },
  { valueKey: 'home.stats.auctions', labelKey: 'home.stats.auctionsLabel', iconKey: 'auctions' as const },
  { valueKey: 'home.stats.settled', labelKey: 'home.stats.settledLabel', iconKey: 'settled' as const },
  { valueKey: 'home.stats.chain', labelKey: 'home.stats.chainLabel', iconKey: 'chain' as const },
];

const STEPS = [
  { number: '1', titleKey: 'home.steps.connect.title', descKey: 'home.steps.connect.desc', iconKey: 'connect' as const },
  { number: '2', titleKey: 'home.steps.deposit.title', descKey: 'home.steps.deposit.desc', iconKey: 'deposit' as const },
  { number: '3', titleKey: 'home.steps.click.title', descKey: 'home.steps.click.desc', iconKey: 'click' as const },
  { number: '4', titleKey: 'home.steps.win.title', descKey: 'home.steps.win.desc', iconKey: 'win' as const },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [showPastAuctions, setShowPastAuctions] = useState(false);
  const { auction } = useAuction();

  return (
    <div>
      {/* Hero Section - Carousel + Side Cards */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 animate-hero-glow" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 animate-hero-glow" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)', animationDelay: '2s' }} />
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
              <button className="btn-action text-lg px-8 py-4 w-full sm:w-auto animate-cta-pulse">
                {t('home.cta.start')}
              </button>
              <Link href="/about" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto text-center">
                {t('home.cta.learn')}
              </Link>
            </div>
          </div>

          {/* Audited Badge - left side above carousel */}
          <div className="flex justify-start mt-12 mb-4 pl-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full bg-[#14F195] flex items-center justify-center shadow-[0_0_20px_rgba(20,241,149,0.3)]">
                <svg className="w-8 h-8 text-[#0a0a1a]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">Audited</span>
            </div>
          </div>

          {/* Carousel + Side Cards below hero text */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Dynamic Carousel - takes 2 of 3 columns */}
            <RevealOnScroll className="lg:col-span-2">
              <DynamicCarousel />
            </RevealOnScroll>

            {/* Dynamic Side cards - takes 1 column */}
            <RevealOnScroll delay={150}>
              <DynamicSideCards />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Live Auction Area */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="section-title">{t('home.auction.title')}</h2>
            <p className="section-subtitle mx-auto">{t('home.auction.subtitle')}</p>
          </div>
        </RevealOnScroll>

        {/* Sponsor Card - above auction grid */}
        <RevealOnScroll delay={50}>
          <div className="mb-6">
            {auction?.sponsorImageUrl ? (
              <a
                href={auction.sponsorLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/10 overflow-hidden hover:border-[#14F195]/30 transition-all duration-300 group"
                style={{ background: 'linear-gradient(135deg, rgba(20, 241, 149, 0.05), rgba(153, 69, 255, 0.05))' }}
              >
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={auction.sponsorImageUrl}
                    alt="Sponsor"
                    className="h-16 w-auto max-w-[200px] object-contain rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest mb-1">Sponsored by</p>
                    <p className="text-sm text-text-muted group-hover:text-[#14F195] transition-colors truncate font-mono">
                      {auction.sponsorLink?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Visit Sponsor'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-text-dim group-hover:text-[#14F195] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
              </a>
            ) : (
              <div
                className="rounded-2xl border border-dashed border-white/10 p-6 text-center"
                style={{ background: 'rgba(26, 26, 46, 0.3)' }}
              >
                <p className="text-xs text-text-dim font-mono uppercase tracking-widest mb-1">Sponsor</p>
                <p className="text-sm text-text-muted font-mono">{t('home.auction.sponsorPlaceholder', 'Your brand here')}</p>
              </div>
            )}
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
          <RevealOnScroll delay={100} className="h-full">
            <AuctionPanel />
          </RevealOnScroll>
          <RevealOnScroll delay={200} className="h-full">
            <UpcomingAuctions />
          </RevealOnScroll>
        </div>

        {/* Past Auctions link */}
        <RevealOnScroll delay={300}>
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowPastAuctions(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-mono font-semibold text-text-muted hover:text-[#14F195] border border-white/10 hover:border-[#14F195]/40 rounded-xl bg-surface/50 hover:bg-[#14F195]/5 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(20,241,149,0.1)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('pastAuctions.viewHistory', 'View Auction History')}
            </button>
          </div>
        </RevealOnScroll>

        {/* Deposit + Referral Cards - side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <RevealOnScroll delay={200}>
            <DepositPanel />
          </RevealOnScroll>
          <RevealOnScroll delay={350}>
            <ReferralCTA />
          </RevealOnScroll>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <p className="mono-label mb-3">{t('home.howItWorks.subtitle')}</p>
            <h2 className="section-title">{t('home.howItWorks.title')}</h2>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => {
            const theme = STEP_THEMES[idx];
            return (
              <RevealOnScroll key={step.number} delay={idx * 120}>
                <div
                  className="step-card h-full group"
                  style={{
                    '--step-accent': theme.accent,
                    '--step-glow': theme.glow,
                    '--step-shadow': theme.shadow,
                    '--step-ping': theme.ping,
                    '--step-ring': theme.ring,
                    '--step-icon-bg': theme.iconBg,
                    '--step-num-bg': theme.numBg,
                    '--step-num-shadow': theme.numShadow,
                  } as React.CSSProperties}
                >
                  {/* Corner decorations */}
                  <div className="absolute top-0 right-0 w-12 h-12 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className={theme.cornerColor} />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className={theme.cornerColor} />
                    </svg>
                  </div>

                  {/* Icon with ping effect */}
                  <div className="step-icon-wrap relative z-10">
                    <div className="step-icon-ping" />
                    <div className="step-icon-ring" />
                    <div className="step-icon-inner">
                      <span className={theme.iconColor}>{StepIcons[step.iconKey]}</span>
                    </div>
                    <div className="step-number">{step.number}</div>
                  </div>

                  <h3 className="text-lg font-semibold text-text mb-2 font-heading relative z-10">{t(step.titleKey)}</h3>
                  <p className="text-sm text-text-muted relative z-10">{t(step.descKey)}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat, idx) => {
            const theme = STAT_THEMES[idx];
            return (
              <RevealOnScroll key={stat.labelKey} delay={idx * 100}>
                <div
                  className="stat-card h-full group"
                  style={{
                    '--stat-accent': theme.accent,
                    '--stat-glow': theme.glow,
                    '--stat-shadow': theme.shadow,
                    '--stat-ping': theme.ping,
                    '--stat-ring': theme.ring,
                    '--stat-icon-bg': theme.iconBg,
                    '--stat-gradient': theme.gradient,
                  } as React.CSSProperties}
                >
                  {/* Corner decorations */}
                  <div className="absolute top-0 right-0 w-10 h-10 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className={theme.cornerColor} />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className={theme.cornerColor} />
                    </svg>
                  </div>

                  {/* Icon with ping effect */}
                  <div className="stat-icon-wrap relative z-10">
                    <div className="stat-icon-ping" />
                    <div className="stat-icon-ring" />
                    <div className="stat-icon-inner">
                      <span className={theme.iconColor}>{StatIcons[stat.iconKey]}</span>
                    </div>
                  </div>

                  <div className="stat-value relative z-10">{t(stat.valueKey)}</div>
                  <div className="stat-label relative z-10">{t(stat.labelKey)}</div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="glass-card p-8 md:p-16 text-center relative overflow-hidden group">
            {/* Brighter background glow */}
            <div className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20" style={{ background: 'radial-gradient(ellipse at center, #6C5CE7 0%, transparent 70%)' }} />
            <div className="absolute inset-0 opacity-5 transition-opacity duration-500 group-hover:opacity-15" style={{ background: 'radial-gradient(ellipse at 30% 50%, #00D2FF 0%, transparent 60%)' }} />
            <div className="absolute inset-0 opacity-5 transition-opacity duration-500 group-hover:opacity-15" style={{ background: 'radial-gradient(ellipse at 70% 50%, #FF3B30 0%, transparent 60%)' }} />
            <div className="scanline-overlay" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-text mb-4 font-heading">
                {t('home.finalCta.title')}
              </h2>
              <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
                {t('home.finalCta.subtitle')}
              </p>
              <button className="btn-action text-lg px-10 py-4 animate-cta-pulse hover:-translate-y-1 transition-transform duration-300">
                {t('home.finalCta.btn')}
              </button>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Past Auctions Modal */}
      <PastAuctions isOpen={showPastAuctions} onClose={() => setShowPastAuctions(false)} />
    </div>
  );
}
