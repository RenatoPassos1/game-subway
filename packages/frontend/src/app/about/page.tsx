'use client';

import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  link: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l1.757-1.757a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
    </svg>
  ),
  money: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  ticket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  ),
  cursor: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
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
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  server: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
  ),
  signal: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  database: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  key: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  chain: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
    </svg>
  ),
};

/* ---------- Theme colors (6 rotating) ---------- */
const THEMES = [
  { accent: 'linear-gradient(90deg, transparent, #6C5CE7, #00D2FF, transparent)', glow: 'rgba(108,92,231,0.08)', shadow: 'rgba(108,92,231,0.12)', ping: 'rgba(108,92,231,0.15)', ring: 'rgba(108,92,231,0.1)', iconBg: 'rgba(108,92,231,0.1)', numBg: 'linear-gradient(135deg,#6C5CE7,#00D2FF)', numShadow: 'rgba(108,92,231,0.4)', iconColor: 'text-primary', cornerColor: 'text-primary' },
  { accent: 'linear-gradient(90deg, transparent, #FFD700, #FF8C00, transparent)', glow: 'rgba(255,215,0,0.06)', shadow: 'rgba(255,215,0,0.12)', ping: 'rgba(255,215,0,0.15)', ring: 'rgba(255,215,0,0.1)', iconBg: 'rgba(255,215,0,0.08)', numBg: 'linear-gradient(135deg,#FFD700,#FF8C00)', numShadow: 'rgba(255,215,0,0.4)', iconColor: 'text-accent', cornerColor: 'text-accent' },
  { accent: 'linear-gradient(90deg, transparent, #FF3B30, #FF7A18, transparent)', glow: 'rgba(255,59,48,0.06)', shadow: 'rgba(255,59,48,0.12)', ping: 'rgba(255,59,48,0.15)', ring: 'rgba(255,59,48,0.1)', iconBg: 'rgba(255,59,48,0.08)', numBg: 'linear-gradient(135deg,#FF3B30,#FF7A18)', numShadow: 'rgba(255,59,48,0.4)', iconColor: 'text-[#FF3B30]', cornerColor: 'text-[#FF3B30]' },
  { accent: 'linear-gradient(90deg, transparent, #00FF88, #00D2FF, transparent)', glow: 'rgba(0,255,136,0.06)', shadow: 'rgba(0,255,136,0.12)', ping: 'rgba(0,255,136,0.15)', ring: 'rgba(0,255,136,0.1)', iconBg: 'rgba(0,255,136,0.08)', numBg: 'linear-gradient(135deg,#00FF88,#00D2FF)', numShadow: 'rgba(0,255,136,0.4)', iconColor: 'text-[#00FF88]', cornerColor: 'text-[#00FF88]' },
  { accent: 'linear-gradient(90deg, transparent, #00D2FF, #6C5CE7, transparent)', glow: 'rgba(0,210,255,0.06)', shadow: 'rgba(0,210,255,0.12)', ping: 'rgba(0,210,255,0.15)', ring: 'rgba(0,210,255,0.1)', iconBg: 'rgba(0,210,255,0.08)', numBg: 'linear-gradient(135deg,#00D2FF,#6C5CE7)', numShadow: 'rgba(0,210,255,0.4)', iconColor: 'text-secondary', cornerColor: 'text-secondary' },
  { accent: 'linear-gradient(90deg, transparent, #FF6B9D, #6C5CE7, transparent)', glow: 'rgba(255,107,157,0.06)', shadow: 'rgba(255,107,157,0.12)', ping: 'rgba(255,107,157,0.15)', ring: 'rgba(255,107,157,0.1)', iconBg: 'rgba(255,107,157,0.08)', numBg: 'linear-gradient(135deg,#FF6B9D,#6C5CE7)', numShadow: 'rgba(255,107,157,0.4)', iconColor: 'text-[#FF6B9D]', cornerColor: 'text-[#FF6B9D]' },
];

/* ---------- Data arrays ---------- */
const HOW_IT_WORKS_STEPS = [
  { number: '1', titleKey: 'about.steps.s1.title', descKey: 'about.steps.s1.desc', icon: Icons.link },
  { number: '2', titleKey: 'about.steps.s2.title', descKey: 'about.steps.s2.desc', icon: Icons.money },
  { number: '3', titleKey: 'about.steps.s3.title', descKey: 'about.steps.s3.desc', icon: Icons.ticket },
  { number: '4', titleKey: 'about.steps.s4.title', descKey: 'about.steps.s4.desc', icon: Icons.cursor },
  { number: '5', titleKey: 'about.steps.s5.title', descKey: 'about.steps.s5.desc', icon: Icons.trophy },
  { number: '6', titleKey: 'about.steps.s6.title', descKey: 'about.steps.s6.desc', icon: Icons.search },
];

const WHY_ITEMS = [
  { titleKey: 'about.why.w1.title', descKey: 'about.why.w1.desc', icon: Icons.wallet },
  { titleKey: 'about.why.w2.title', descKey: 'about.why.w2.desc', icon: Icons.bolt },
  { titleKey: 'about.why.w3.title', descKey: 'about.why.w3.desc', icon: Icons.chart },
  { titleKey: 'about.why.w4.title', descKey: 'about.why.w4.desc', icon: Icons.link },
  { titleKey: 'about.why.w5.title', descKey: 'about.why.w5.desc', icon: Icons.globe },
  { titleKey: 'about.why.w6.title', descKey: 'about.why.w6.desc', icon: Icons.building },
];

const TECH_ITEMS = [
  { titleKey: 'about.tech.t1.title', descKey: 'about.tech.t1.desc', icon: Icons.server },
  { titleKey: 'about.tech.t2.title', descKey: 'about.tech.t2.desc', icon: Icons.signal },
  { titleKey: 'about.tech.t3.title', descKey: 'about.tech.t3.desc', icon: Icons.lock },
  { titleKey: 'about.tech.t4.title', descKey: 'about.tech.t4.desc', icon: Icons.database },
  { titleKey: 'about.tech.t5.title', descKey: 'about.tech.t5.desc', icon: Icons.key },
  { titleKey: 'about.tech.t6.title', descKey: 'about.tech.t6.desc', icon: Icons.chain },
];

/* ---------- Reusable card sub-components ---------- */
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

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }} />
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
        <RevealOnScroll>
          <div className="tech-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #6C5CE7 0%, transparent 70%)' }} />
            <div className="scanline-overlay" />
            <div className="relative z-10">
              <span className="mono-label">// MISSION</span>
              <h2 className="font-heading section-title mb-6">{t('about.mission.title')}</h2>
              <p className="text-text-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                {t('about.mission.desc')}
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* How It Works */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// HOW_IT_WORKS</span>
            <h2 className="font-heading section-title">{t('about.howItWorks.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={step.number} delay={idx * 100}>
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
                  <CornerDecorations color={theme.cornerColor} />
                  <div className="step-icon-wrap relative z-10">
                    <div className="step-icon-ping" />
                    <div className="step-icon-ring" />
                    <div className="step-icon-inner">
                      <span className={theme.iconColor}>{step.icon}</span>
                    </div>
                    <div className="step-number">{step.number}</div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text mb-2 relative z-10">{t(step.titleKey)}</h3>
                  <p className="text-sm text-text-muted relative z-10">{t(step.descKey)}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Why Click Win */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// WHY_CLICK_WIN</span>
            <h2 className="font-heading section-title">{t('about.why.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_ITEMS.map((item, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={idx} delay={idx * 100}>
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
                  <CornerDecorations color={theme.cornerColor} />
                  <div className="step-icon-wrap relative z-10">
                    <div className="step-icon-ping" />
                    <div className="step-icon-ring" />
                    <div className="step-icon-inner">
                      <span className={theme.iconColor}>{item.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text mb-2 relative z-10">{t(item.titleKey)}</h3>
                  <p className="text-sm text-text-muted relative z-10">{t(item.descKey)}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
        <RevealOnScroll delay={200}>
          <p className="text-text-muted text-center mt-8 max-w-2xl mx-auto">
            {t('about.why.footer')}
          </p>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Our Technology */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// TECH_STACK</span>
            <h2 className="font-heading section-title">{t('about.tech.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECH_ITEMS.map((item, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={idx} delay={idx * 100}>
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
                  <CornerDecorations color={theme.cornerColor} />
                  <div className="step-icon-wrap relative z-10">
                    <div className="step-icon-ping" />
                    <div className="step-icon-ring" />
                    <div className="step-icon-inner">
                      <span className={theme.iconColor}>{item.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-text mb-2 relative z-10">{t(item.titleKey)}</h3>
                  <p className="text-sm text-text-muted relative z-10">{t(item.descKey)}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Vision */}
      <section className="section-container">
        <RevealOnScroll>
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
        </RevealOnScroll>
      </section>
    </div>
  );
}
