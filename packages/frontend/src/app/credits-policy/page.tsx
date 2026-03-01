'use client';

import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  coin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  ),
  refresh: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

const CREDIT_ICONS = [Icons.coin, Icons.wallet, Icons.refresh, Icons.clock, Icons.shield];

/* ---------- Theme colors (5 rotating) ---------- */
const THEMES = [
  { accent: 'linear-gradient(90deg, transparent, #6C5CE7, #00D2FF, transparent)', glow: 'rgba(108,92,231,0.08)', shadow: 'rgba(108,92,231,0.12)', ping: 'rgba(108,92,231,0.15)', ring: 'rgba(108,92,231,0.1)', iconBg: 'rgba(108,92,231,0.1)', numBg: 'linear-gradient(135deg,#6C5CE7,#00D2FF)', numShadow: 'rgba(108,92,231,0.4)', iconColor: 'text-primary', cornerColor: 'text-primary' },
  { accent: 'linear-gradient(90deg, transparent, #FFD700, #FF8C00, transparent)', glow: 'rgba(255,215,0,0.06)', shadow: 'rgba(255,215,0,0.12)', ping: 'rgba(255,215,0,0.15)', ring: 'rgba(255,215,0,0.1)', iconBg: 'rgba(255,215,0,0.08)', numBg: 'linear-gradient(135deg,#FFD700,#FF8C00)', numShadow: 'rgba(255,215,0,0.4)', iconColor: 'text-accent', cornerColor: 'text-accent' },
  { accent: 'linear-gradient(90deg, transparent, #00FF88, #00D2FF, transparent)', glow: 'rgba(0,255,136,0.06)', shadow: 'rgba(0,255,136,0.12)', ping: 'rgba(0,255,136,0.15)', ring: 'rgba(0,255,136,0.1)', iconBg: 'rgba(0,255,136,0.08)', numBg: 'linear-gradient(135deg,#00FF88,#00D2FF)', numShadow: 'rgba(0,255,136,0.4)', iconColor: 'text-[#00FF88]', cornerColor: 'text-[#00FF88]' },
  { accent: 'linear-gradient(90deg, transparent, #00D2FF, #6C5CE7, transparent)', glow: 'rgba(0,210,255,0.06)', shadow: 'rgba(0,210,255,0.12)', ping: 'rgba(0,210,255,0.15)', ring: 'rgba(0,210,255,0.1)', iconBg: 'rgba(0,210,255,0.08)', numBg: 'linear-gradient(135deg,#00D2FF,#6C5CE7)', numShadow: 'rgba(0,210,255,0.4)', iconColor: 'text-secondary', cornerColor: 'text-secondary' },
  { accent: 'linear-gradient(90deg, transparent, #FF6B9D, #6C5CE7, transparent)', glow: 'rgba(255,107,157,0.06)', shadow: 'rgba(255,107,157,0.12)', ping: 'rgba(255,107,157,0.15)', ring: 'rgba(255,107,157,0.1)', iconBg: 'rgba(255,107,157,0.08)', numBg: 'linear-gradient(135deg,#FF6B9D,#6C5CE7)', numShadow: 'rgba(255,107,157,0.4)', iconColor: 'text-[#FF6B9D]', cornerColor: 'text-[#FF6B9D]' },
];

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

export default function CreditsPolicyPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// CREDITS_POLICY</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">
            <span className="gradient-text">{t('credits.title')}</span>
          </h1>
          <p className="text-text-dim text-sm font-mono">{t('credits.lastUpdated')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Intro */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div className="tech-card p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #FFD700 0%, transparent 70%)' }} />
              <div className="scanline-overlay" />
              <div className="relative z-10">
                <p className="text-lg text-text-muted leading-relaxed">{t('credits.intro')}</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Credit items */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="mono-label">// POLICIES</span>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5].map((num, idx) => {
              const theme = THEMES[idx % THEMES.length];
              const isLast = num === 5;
              return (
                <RevealOnScroll key={num} delay={idx * 100}>
                  <div
                    className={`step-card h-full group ${isLast ? 'sm:col-span-2' : ''}`}
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
                    <CornerDecorations color={theme.cornerColor} />
                    <div className="step-icon-wrap relative z-10">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={theme.iconColor}>{CREDIT_ICONS[idx]}</span>
                      </div>
                      <div className="step-number">{num}</div>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-text mb-2 relative z-10">{t(`credits.c${num}.title`)}</h3>
                    <p className="text-sm text-text-muted relative z-10">{t(`credits.c${num}.desc`)}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Final note */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div
              className="step-card p-6 text-center"
              style={{
                '--step-accent': THEMES[0].accent,
                '--step-glow': THEMES[0].glow,
                '--step-shadow': THEMES[0].shadow,
                '--step-ping': THEMES[0].ping,
                '--step-ring': THEMES[0].ring,
                '--step-icon-bg': THEMES[0].iconBg,
                '--step-num-bg': THEMES[0].numBg,
                '--step-num-shadow': THEMES[0].numShadow,
              } as React.CSSProperties}
            >
              <CornerDecorations color={THEMES[0].cornerColor} />
              <p className="text-primary font-semibold relative z-10">{t('credits.finalNote')}</p>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
