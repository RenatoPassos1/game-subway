'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/* ---------- data arrays for mapped sections ---------- */

const TOC_ITEMS = [
  { id: 'about', key: 'whitepaper.toc.s1', num: '01' },
  { id: 'how-it-works', key: 'whitepaper.toc.s2', num: '02' },
  { id: 'tech', key: 'whitepaper.toc.s3', num: '03' },
  { id: 'economics', key: 'whitepaper.toc.s4', num: '04' },
  { id: 'faq', key: 'whitepaper.toc.s5', num: '05' },
  { id: 'partner', key: 'whitepaper.toc.s6', num: '06' },
  { id: 'roadmap', key: 'whitepaper.toc.s7', num: '07' },
];

const STEPS = [
  { num: '01', titleKey: 'whitepaper.howItWorks.steps.s1.title', descKey: 'whitepaper.howItWorks.steps.s1.desc' },
  { num: '02', titleKey: 'whitepaper.howItWorks.steps.s2.title', descKey: 'whitepaper.howItWorks.steps.s2.desc' },
  { num: '03', titleKey: 'whitepaper.howItWorks.steps.s3.title', descKey: 'whitepaper.howItWorks.steps.s3.desc' },
  { num: '04', titleKey: 'whitepaper.howItWorks.steps.s4.title', descKey: 'whitepaper.howItWorks.steps.s4.desc' },
  { num: '05', titleKey: 'whitepaper.howItWorks.steps.s5.title', descKey: 'whitepaper.howItWorks.steps.s5.desc' },
  { num: '06', titleKey: 'whitepaper.howItWorks.steps.s6.title', descKey: 'whitepaper.howItWorks.steps.s6.desc' },
];

const TECH_ITEMS = [
  { titleKey: 'whitepaper.tech.items.t1.title', descKey: 'whitepaper.tech.items.t1.desc' },
  { titleKey: 'whitepaper.tech.items.t2.title', descKey: 'whitepaper.tech.items.t2.desc' },
  { titleKey: 'whitepaper.tech.items.t3.title', descKey: 'whitepaper.tech.items.t3.desc' },
  { titleKey: 'whitepaper.tech.items.t4.title', descKey: 'whitepaper.tech.items.t4.desc' },
  { titleKey: 'whitepaper.tech.items.t5.title', descKey: 'whitepaper.tech.items.t5.desc' },
  { titleKey: 'whitepaper.tech.items.t6.title', descKey: 'whitepaper.tech.items.t6.desc' },
];

const KPI_KEYS = [
  { labelKey: 'whitepaper.economics.clickPrice', valueKey: 'whitepaper.economics.clickPriceValue' },
  { labelKey: 'whitepaper.economics.maxDiscount', valueKey: 'whitepaper.economics.maxDiscountValue' },
  { labelKey: 'whitepaper.economics.timerDuration', valueKey: 'whitepaper.economics.timerDurationValue' },
  { labelKey: 'whitepaper.economics.referralBonus', valueKey: 'whitepaper.economics.referralBonusValue' },
  { labelKey: 'whitepaper.economics.minDeposit', valueKey: 'whitepaper.economics.minDepositValue' },
];

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

const PARTNER_ITEMS = [
  { titleKey: 'whitepaper.partner.opportunities.o1.title', descKey: 'whitepaper.partner.opportunities.o1.desc' },
  { titleKey: 'whitepaper.partner.opportunities.o2.title', descKey: 'whitepaper.partner.opportunities.o2.desc' },
  { titleKey: 'whitepaper.partner.opportunities.o3.title', descKey: 'whitepaper.partner.opportunities.o3.desc' },
];

const PHASES = [
  { titleKey: 'whitepaper.roadmap.phases.p1.title', descKey: 'whitepaper.roadmap.phases.p1.desc' },
  { titleKey: 'whitepaper.roadmap.phases.p2.title', descKey: 'whitepaper.roadmap.phases.p2.desc' },
  { titleKey: 'whitepaper.roadmap.phases.p3.title', descKey: 'whitepaper.roadmap.phases.p3.desc' },
  { titleKey: 'whitepaper.roadmap.phases.p4.title', descKey: 'whitepaper.roadmap.phases.p4.desc' },
];

/* ---------- component ---------- */

export default function WhitepaperPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="scanline-overlay" />
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative z-10 section-container text-center">
          <span className="tech-badge mb-6">{t('whitepaper.badge')}</span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            <span className="gradient-text">{t('whitepaper.hero.title')}</span>
          </h1>
          <p className="text-text-muted text-lg max-w-3xl mx-auto">
            {t('whitepaper.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TABLE OF CONTENTS                                                */}
      {/* ================================================================ */}
      <section className="section-container">
        <h2 className="section-title text-center mb-8 font-heading">{t('whitepaper.toc.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {TOC_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="tech-card flex items-center gap-3 group"
            >
              <span className="font-mono text-primary/60 text-xs">{item.num}</span>
              <span className="text-text text-sm font-heading group-hover:text-primary transition-colors">
                {t(item.key)}
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 01 - ABOUT                                               */}
      {/* ================================================================ */}
      <section id="about" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.about.label')}</span>
        <h2 className="section-title font-heading mb-6">{t('whitepaper.about.title')}</h2>
        <div className="glass-card p-8 md:p-10 space-y-4">
          <p className="text-text-muted text-lg leading-relaxed">{t('whitepaper.about.desc')}</p>
          <p className="text-text-muted leading-relaxed">{t('whitepaper.about.mission')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 02 - HOW IT WORKS                                        */}
      {/* ================================================================ */}
      <section id="how-it-works" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.howItWorks.label')}</span>
        <h2 className="section-title font-heading mb-8">{t('whitepaper.howItWorks.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.num} className="tech-card">
              <span className="font-mono text-primary/50 text-xs mb-3 block">{step.num}</span>
              <h3 className="text-lg font-heading font-semibold text-text mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 03 - TECHNOLOGY                                          */}
      {/* ================================================================ */}
      <section id="tech" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.tech.label')}</span>
        <h2 className="section-title font-heading mb-8">{t('whitepaper.tech.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_ITEMS.map((item, idx) => (
            <div key={idx} className="tech-card">
              <h3 className="text-lg font-heading font-semibold text-text mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 04 - ECONOMICS                                           */}
      {/* ================================================================ */}
      <section id="economics" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.economics.label')}</span>
        <h2 className="section-title font-heading mb-8">{t('whitepaper.economics.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {KPI_KEYS.map((kpi, idx) => (
            <div key={idx} className="kpi-card">
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-1">{t(kpi.labelKey)}</p>
              <p className="text-2xl font-heading font-bold text-text">{t(kpi.valueKey)}</p>
            </div>
          ))}
        </div>
        <div className="glass-card p-6 md:p-8">
          <p className="text-text-muted leading-relaxed">{t('whitepaper.economics.revenueModel')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 05 - FAQ                                                 */}
      {/* ================================================================ */}
      <section id="faq" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.faq.label')}</span>
        <h2 className="section-title font-heading mb-8">{t('whitepaper.faq.title')}</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_KEYS.map((key, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={key} className="tech-card">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span className="text-text font-heading font-semibold pr-4">
                    {t(`whitepaper.faq.items.${key}.q`)}
                  </span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0 }}
                >
                  <p className="text-text-muted text-sm mt-4 leading-relaxed">
                    {t(`whitepaper.faq.items.${key}.a`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 06 - PARTNERSHIPS                                        */}
      {/* ================================================================ */}
      <section id="partner" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.partner.label')}</span>
        <h2 className="section-title font-heading mb-4">{t('whitepaper.partner.title')}</h2>
        <p className="text-text-muted max-w-3xl mb-8">{t('whitepaper.partner.desc')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PARTNER_ITEMS.map((item, idx) => (
            <div key={idx} className="tech-card">
              <h3 className="text-lg font-heading font-semibold text-text mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
        <div className="glass-card p-6 text-center">
          <p className="font-mono text-sm text-text-muted">{t('whitepaper.partner.contact')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 07 - ROADMAP                                             */}
      {/* ================================================================ */}
      <section id="roadmap" className="section-container">
        <span className="mono-label block mb-4">{t('whitepaper.roadmap.label')}</span>
        <h2 className="section-title font-heading mb-8">{t('whitepaper.roadmap.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {PHASES.map((phase, idx) => (
            <div key={idx} className="kpi-card">
              <h3 className="text-lg font-heading font-semibold text-text mb-2">{t(phase.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(phase.descKey)}</p>
            </div>
          ))}
        </div>
        <div className="glass-card p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #00D2FF 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed">
              {t('whitepaper.roadmap.vision')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
