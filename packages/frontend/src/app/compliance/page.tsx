'use client';

import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  xMark: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

/* ---------- Theme colors ---------- */
const THEME_RED = {
  accent: 'linear-gradient(90deg, transparent, #FF3B30, #FF7A18, transparent)',
  glow: 'rgba(255,59,48,0.06)', shadow: 'rgba(255,59,48,0.12)',
  ping: 'rgba(255,59,48,0.15)', ring: 'rgba(255,59,48,0.1)',
  iconBg: 'rgba(255,59,48,0.08)', numBg: 'linear-gradient(135deg,#FF3B30,#FF7A18)',
  numShadow: 'rgba(255,59,48,0.4)', iconColor: 'text-[#FF3B30]', cornerColor: 'text-[#FF3B30]',
};

const THEME_GREEN = {
  accent: 'linear-gradient(90deg, transparent, #00FF88, #00D2FF, transparent)',
  glow: 'rgba(0,255,136,0.06)', shadow: 'rgba(0,255,136,0.12)',
  ping: 'rgba(0,255,136,0.15)', ring: 'rgba(0,255,136,0.1)',
  iconBg: 'rgba(0,255,136,0.08)', numBg: 'linear-gradient(135deg,#00FF88,#00D2FF)',
  numShadow: 'rgba(0,255,136,0.4)', iconColor: 'text-[#00FF88]', cornerColor: 'text-[#00FF88]',
};

function CornerDecorations({ color }: { color: string }) {
  return (
    <>
      <div className="absolute top-0 right-0 w-12 h-12 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className={color} />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-12 h-12 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className={color} />
        </svg>
      </div>
    </>
  );
}

const DO_NOT_ITEMS = ['compliance.doNot.l1', 'compliance.doNot.l2', 'compliance.doNot.l3'];
const RIGHTS_ITEMS = ['compliance.rights.l1', 'compliance.rights.l2', 'compliance.rights.l3'];

export default function CompliancePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF3B30 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">
            <span className="gradient-text">{t('compliance.title')}</span>
          </h1>
          <p className="text-text-dim text-sm font-mono">{t('compliance.lastUpdated')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Intro */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div className="tech-card p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #6C5CE7 0%, transparent 70%)' }} />
              <div className="scanline-overlay" />
              <div className="relative z-10">
                <div className="step-icon-wrap mx-auto mb-6" style={{ '--step-ping': 'rgba(108,92,231,0.15)', '--step-ring': 'rgba(108,92,231,0.1)', '--step-icon-bg': 'rgba(108,92,231,0.1)' } as React.CSSProperties}>
                  <div className="step-icon-ping" />
                  <div className="step-icon-ring" />
                  <div className="step-icon-inner">
                    <span className="text-primary">{Icons.shield}</span>
                  </div>
                </div>
                <p className="text-lg text-text-muted leading-relaxed">{t('compliance.intro')}</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* What we do NOT support */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-8">
              <h2 className="font-heading section-title">{t('compliance.doNot.title')}</h2>
            </div>
          </RevealOnScroll>
          <div className="space-y-4">
            {DO_NOT_ITEMS.map((key, idx) => (
              <RevealOnScroll key={idx} delay={idx * 100}>
                <div
                  className="step-card group"
                  style={{
                    '--step-accent': THEME_RED.accent,
                    '--step-glow': THEME_RED.glow,
                    '--step-shadow': THEME_RED.shadow,
                    '--step-ping': THEME_RED.ping,
                    '--step-ring': THEME_RED.ring,
                    '--step-icon-bg': THEME_RED.iconBg,
                    '--step-num-bg': THEME_RED.numBg,
                    '--step-num-shadow': THEME_RED.numShadow,
                  } as React.CSSProperties}
                >
                  <CornerDecorations color={THEME_RED.cornerColor} />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="step-icon-wrap flex-shrink-0">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={THEME_RED.iconColor}>{Icons.xMark}</span>
                      </div>
                    </div>
                    <p className="text-text-muted">{t(key)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Platform rights */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-8">
              <h2 className="font-heading section-title">{t('compliance.rights.title')}</h2>
            </div>
          </RevealOnScroll>
          <div className="space-y-4">
            {RIGHTS_ITEMS.map((key, idx) => (
              <RevealOnScroll key={idx} delay={idx * 100}>
                <div
                  className="step-card group"
                  style={{
                    '--step-accent': THEME_GREEN.accent,
                    '--step-glow': THEME_GREEN.glow,
                    '--step-shadow': THEME_GREEN.shadow,
                    '--step-ping': THEME_GREEN.ping,
                    '--step-ring': THEME_GREEN.ring,
                    '--step-icon-bg': THEME_GREEN.iconBg,
                    '--step-num-bg': THEME_GREEN.numBg,
                    '--step-num-shadow': THEME_GREEN.numShadow,
                  } as React.CSSProperties}
                >
                  <CornerDecorations color={THEME_GREEN.cornerColor} />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="step-icon-wrap flex-shrink-0">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={THEME_GREEN.iconColor}>{Icons.check}</span>
                      </div>
                    </div>
                    <p className="text-text-muted">{t(key)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
