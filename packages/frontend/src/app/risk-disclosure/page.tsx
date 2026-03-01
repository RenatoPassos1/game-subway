'use client';

import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  bolt: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
};

const RISK_ITEMS = [
  { key: 'r1', icon: Icons.warning },
  { key: 'r2', icon: Icons.shield },
  { key: 'r3', icon: Icons.bolt },
  { key: 'r4', icon: Icons.chart },
  { key: 'r5', icon: Icons.building },
];

/* ---------- Theme colors ---------- */
const THEMES = [
  { accent: 'linear-gradient(90deg, transparent, #FF3B30, #FF7A18, transparent)', glow: 'rgba(255,59,48,0.06)', shadow: 'rgba(255,59,48,0.12)', ping: 'rgba(255,59,48,0.15)', ring: 'rgba(255,59,48,0.1)', iconBg: 'rgba(255,59,48,0.08)', numBg: 'linear-gradient(135deg,#FF3B30,#FF7A18)', numShadow: 'rgba(255,59,48,0.4)', iconColor: 'text-[#FF3B30]', cornerColor: 'text-[#FF3B30]' },
  { accent: 'linear-gradient(90deg, transparent, #FFD700, #FF8C00, transparent)', glow: 'rgba(255,215,0,0.06)', shadow: 'rgba(255,215,0,0.12)', ping: 'rgba(255,215,0,0.15)', ring: 'rgba(255,215,0,0.1)', iconBg: 'rgba(255,215,0,0.08)', numBg: 'linear-gradient(135deg,#FFD700,#FF8C00)', numShadow: 'rgba(255,215,0,0.4)', iconColor: 'text-accent', cornerColor: 'text-accent' },
  { accent: 'linear-gradient(90deg, transparent, #FF6B9D, #6C5CE7, transparent)', glow: 'rgba(255,107,157,0.06)', shadow: 'rgba(255,107,157,0.12)', ping: 'rgba(255,107,157,0.15)', ring: 'rgba(255,107,157,0.1)', iconBg: 'rgba(255,107,157,0.08)', numBg: 'linear-gradient(135deg,#FF6B9D,#6C5CE7)', numShadow: 'rgba(255,107,157,0.4)', iconColor: 'text-[#FF6B9D]', cornerColor: 'text-[#FF6B9D]' },
  { accent: 'linear-gradient(90deg, transparent, #6C5CE7, #00D2FF, transparent)', glow: 'rgba(108,92,231,0.08)', shadow: 'rgba(108,92,231,0.12)', ping: 'rgba(108,92,231,0.15)', ring: 'rgba(108,92,231,0.1)', iconBg: 'rgba(108,92,231,0.1)', numBg: 'linear-gradient(135deg,#6C5CE7,#00D2FF)', numShadow: 'rgba(108,92,231,0.4)', iconColor: 'text-primary', cornerColor: 'text-primary' },
  { accent: 'linear-gradient(90deg, transparent, #00D2FF, #6C5CE7, transparent)', glow: 'rgba(0,210,255,0.06)', shadow: 'rgba(0,210,255,0.12)', ping: 'rgba(0,210,255,0.15)', ring: 'rgba(0,210,255,0.1)', iconBg: 'rgba(0,210,255,0.08)', numBg: 'linear-gradient(135deg,#00D2FF,#6C5CE7)', numShadow: 'rgba(0,210,255,0.4)', iconColor: 'text-secondary', cornerColor: 'text-secondary' },
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

export default function RiskDisclosurePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF3B30 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">
            <span className="gradient-text">{t('risk.title')}</span>
          </h1>
          <p className="text-text-dim text-sm font-mono">{t('risk.lastUpdated')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Intro */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div className="tech-card p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #FF3B30 0%, transparent 70%)' }} />
              <div className="scanline-overlay" />
              <div className="relative z-10">
                <div className="step-icon-wrap mx-auto mb-6" style={{ '--step-ping': 'rgba(255,59,48,0.15)', '--step-ring': 'rgba(255,59,48,0.1)', '--step-icon-bg': 'rgba(255,59,48,0.08)' } as React.CSSProperties}>
                  <div className="step-icon-ping" />
                  <div className="step-icon-ring" />
                  <div className="step-icon-inner">
                    <span className="text-[#FF3B30]">{Icons.warning}</span>
                  </div>
                </div>
                <p className="text-text-muted leading-relaxed">{t('risk.intro')}</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Risk items */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto space-y-4">
          {RISK_ITEMS.map((item, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={item.key} delay={idx * 100}>
                <div
                  className="step-card group"
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
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="step-icon-wrap flex-shrink-0">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={theme.iconColor}>{item.icon}</span>
                      </div>
                      <div className="step-number">{idx + 1}</div>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-text mb-1">{t(`risk.${item.key}.title`)}</h3>
                      <p className="text-text-muted text-sm">{t(`risk.${item.key}.desc`)}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Disclaimer */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto">
            <div
              className="step-card p-6 text-center"
              style={{
                '--step-accent': THEMES[1].accent,
                '--step-glow': THEMES[1].glow,
                '--step-shadow': THEMES[1].shadow,
                '--step-ping': THEMES[1].ping,
                '--step-ring': THEMES[1].ring,
                '--step-icon-bg': THEMES[1].iconBg,
                '--step-num-bg': THEMES[1].numBg,
                '--step-num-shadow': THEMES[1].numShadow,
              } as React.CSSProperties}
            >
              <CornerDecorations color={THEMES[1].cornerColor} />
              <p className="text-accent font-semibold relative z-10">{t('risk.disclaimer')}</p>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
