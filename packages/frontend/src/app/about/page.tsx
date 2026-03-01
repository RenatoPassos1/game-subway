'use client';

import { useTranslation } from 'react-i18next';

const HOW_IT_WORKS_STEPS = [
  { number: '1', titleKey: 'about.steps.s1.title', descKey: 'about.steps.s1.desc', icon: '🔗' },
  { number: '2', titleKey: 'about.steps.s2.title', descKey: 'about.steps.s2.desc', icon: '💰' },
  { number: '3', titleKey: 'about.steps.s3.title', descKey: 'about.steps.s3.desc', icon: '🎫' },
  { number: '4', titleKey: 'about.steps.s4.title', descKey: 'about.steps.s4.desc', icon: '🖱️' },
  { number: '5', titleKey: 'about.steps.s5.title', descKey: 'about.steps.s5.desc', icon: '🏆' },
  { number: '6', titleKey: 'about.steps.s6.title', descKey: 'about.steps.s6.desc', icon: '🔍' },
];

const WHY_ITEMS = [
  { titleKey: 'about.why.w1.title', descKey: 'about.why.w1.desc', icon: '👛' },
  { titleKey: 'about.why.w2.title', descKey: 'about.why.w2.desc', icon: '⚡' },
  { titleKey: 'about.why.w3.title', descKey: 'about.why.w3.desc', icon: '📊' },
  { titleKey: 'about.why.w4.title', descKey: 'about.why.w4.desc', icon: '🔗' },
  { titleKey: 'about.why.w5.title', descKey: 'about.why.w5.desc', icon: '🌍' },
  { titleKey: 'about.why.w6.title', descKey: 'about.why.w6.desc', icon: '🏗️' },
];

const TECH_ITEMS = [
  { titleKey: 'about.tech.t1.title', descKey: 'about.tech.t1.desc', icon: '🖥️' },
  { titleKey: 'about.tech.t2.title', descKey: 'about.tech.t2.desc', icon: '📡' },
  { titleKey: 'about.tech.t3.title', descKey: 'about.tech.t3.desc', icon: '🔒' },
  { titleKey: 'about.tech.t4.title', descKey: 'about.tech.t4.desc', icon: '🗄️' },
  { titleKey: 'about.tech.t5.title', descKey: 'about.tech.t5.desc', icon: '🔑' },
  { titleKey: 'about.tech.t6.title', descKey: 'about.tech.t6.desc', icon: '⛓️' },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// ABOUT</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">{t('about.hero.title')}</span>
          </h1>
          <p className="text-text-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t('about.hero.desc1')}
          </p>
          <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed mt-4">
            {t('about.hero.desc2')}
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Mission */}
      <section className="section-container">
        <div className="tech-card p-8 md:p-12 text-center">
          <span className="mono-label">// MISSION</span>
          <h2 className="font-heading section-title mb-6">{t('about.mission.title')}</h2>
          <p className="text-text-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t('about.mission.desc')}
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* How It Works */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// HOW_IT_WORKS</span>
          <h2 className="font-heading section-title">{t('about.howItWorks.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-number font-mono">{step.number}</div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-text mb-2">{t(step.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Why Click Win */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// WHY_CLICK_WIN</span>
          <h2 className="font-heading section-title">{t('about.why.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_ITEMS.map((item, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{item.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-text mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-center mt-8 max-w-2xl mx-auto">
          {t('about.why.footer')}
        </p>
      </section>

      <div className="section-divider" />

      {/* Our Technology */}
      <section className="section-container">
        <div className="text-center mb-12">
          <span className="mono-label">// TECH_STACK</span>
          <h2 className="font-heading section-title">{t('about.tech.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_ITEMS.map((item, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{item.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-text mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-text-muted">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Vision */}
      <section className="section-container">
        <div className="tech-card p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #00D2FF 0%, transparent 70%)' }} />
          <div className="scanline-overlay" />
          <div className="relative z-10">
            <span className="mono-label">// VISION</span>
            <h2 className="font-heading section-title mb-6">{t('about.vision.title')}</h2>
            <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed">
              {t('about.vision.desc1')}
            </p>
            <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed mt-4">
              {t('about.vision.desc2')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
