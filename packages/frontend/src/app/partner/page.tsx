'use client';

import { useTranslation } from 'react-i18next';
import ReferralCard from '../../components/ReferralCard';
import ReferralDashboard from '../../components/ReferralDashboard';

const WHY_PARTNER = [
  { titleKey: 'partner.why.w1.title', descKey: 'partner.why.w1.desc', icon: '⚡' },
  { titleKey: 'partner.why.w2.title', descKey: 'partner.why.w2.desc', icon: '🔗' },
  { titleKey: 'partner.why.w3.title', descKey: 'partner.why.w3.desc', icon: '🌍' },
  { titleKey: 'partner.why.w4.title', descKey: 'partner.why.w4.desc', icon: '📊' },
  { titleKey: 'partner.why.w5.title', descKey: 'partner.why.w5.desc', icon: '🏗️' },
  { titleKey: 'partner.why.w6.title', descKey: 'partner.why.w6.desc', icon: '🤝' },
];

const OPPORTUNITIES = [
  { titleKey: 'partner.opp.token.title', descKey: 'partner.opp.token.desc', icon: '🪙' },
  { titleKey: 'partner.opp.brand.title', descKey: 'partner.opp.brand.desc', icon: '🏷️' },
  { titleKey: 'partner.opp.strategic.title', descKey: 'partner.opp.strategic.desc', icon: '🔌' },
];

const PARTNER_STEPS = [
  { number: '1', titleKey: 'partner.steps.s1.title', descKey: 'partner.steps.s1.desc' },
  { number: '2', titleKey: 'partner.steps.s2.title', descKey: 'partner.steps.s2.desc' },
  { number: '3', titleKey: 'partner.steps.s3.title', descKey: 'partner.steps.s3.desc' },
  { number: '4', titleKey: 'partner.steps.s4.title', descKey: 'partner.steps.s4.desc' },
];

export default function PartnerPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// PARTNERSHIPS</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">{t('partner.hero.title')}</span>
          </h1>
          <p className="text-text-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t('partner.hero.desc')}
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Why Partner */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// WHY_PARTNER</span>
          <h2 className="font-heading section-title">{t('partner.why.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_PARTNER.map((item, idx) => (
            <div key={idx} className="tech-card p-6 text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-text mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-center mt-8 max-w-2xl mx-auto">
          {t('partner.why.footer')}
        </p>
      </section>

      <div className="section-divider" />

      {/* Partnership Opportunities */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// OPPORTUNITIES</span>
          <h2 className="font-heading section-title">{t('partner.opp.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OPPORTUNITIES.map((item, idx) => (
            <div key={idx} className="tech-card p-8 text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-heading text-xl font-semibold text-text mb-3">{t(item.titleKey)}</h3>
              <p className="text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* How It Works */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// PROCESS</span>
          <h2 className="font-heading section-title">{t('partner.steps.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNER_STEPS.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-number font-mono">{step.number}</div>
              <h3 className="font-heading text-lg font-semibold text-text mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-center text-sm mt-8">
          {t('partner.steps.footer')}
        </p>
      </section>

      <div className="section-divider" />

      {/* Referral Card + Dashboard */}
      <section className="section-container">
        <div className="text-center mb-8">
          <span className="mono-label">// REFERRAL_PROGRAM</span>
          <h2 className="font-heading section-title">{t('partner.referral.title')}</h2>
          <p className="section-subtitle mx-auto">{t('partner.referral.subtitle')}</p>
        </div>

        {/* Compact Referral Card (link + share + quick stats) */}
        <div className="max-w-md mx-auto mb-8">
          <ReferralCard />
        </div>

        {/* Full Referral Dashboard (stats, chart, history table) */}
        <ReferralDashboard />
      </section>

      <div className="section-divider" />

      {/* Contact CTA */}
      <section className="section-container">
        <div className="tech-card p-8 md:p-12 text-center">
          <span className="mono-label">// CONTACT</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-text mb-4">{t('partner.cta.title')}</h2>
          <p className="text-text-muted max-w-xl mx-auto mb-6">{t('partner.cta.desc')}</p>
          <a href="#" className="btn-primary text-lg px-8 py-3">
            {t('partner.cta.btn')}
          </a>
        </div>
      </section>
    </div>
  );
}
