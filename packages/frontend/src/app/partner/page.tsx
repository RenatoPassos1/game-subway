'use client';

import { useTranslation } from 'react-i18next';
import ReferralCard from '../../components/ReferralCard';
import ReferralDashboard from '../../components/ReferralDashboard';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  bolt: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  chain: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l1.757-1.757a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
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
  handshake: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  money: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  tag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  plug: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.07-9.07l1.757-1.757a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  doc: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  rocket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

/* ---------- Data arrays ---------- */
const WHY_PARTNER = [
  { titleKey: 'partner.why.w1.title', descKey: 'partner.why.w1.desc', icon: Icons.bolt },
  { titleKey: 'partner.why.w2.title', descKey: 'partner.why.w2.desc', icon: Icons.chain },
  { titleKey: 'partner.why.w3.title', descKey: 'partner.why.w3.desc', icon: Icons.globe },
  { titleKey: 'partner.why.w4.title', descKey: 'partner.why.w4.desc', icon: Icons.chart },
  { titleKey: 'partner.why.w5.title', descKey: 'partner.why.w5.desc', icon: Icons.building },
  { titleKey: 'partner.why.w6.title', descKey: 'partner.why.w6.desc', icon: Icons.handshake },
];

const OPPORTUNITIES = [
  { titleKey: 'partner.opp.token.title', descKey: 'partner.opp.token.desc', icon: Icons.money },
  { titleKey: 'partner.opp.brand.title', descKey: 'partner.opp.brand.desc', icon: Icons.tag },
  { titleKey: 'partner.opp.strategic.title', descKey: 'partner.opp.strategic.desc', icon: Icons.plug },
];

const PARTNER_STEPS = [
  { number: '1', titleKey: 'partner.steps.s1.title', descKey: 'partner.steps.s1.desc', icon: Icons.search },
  { number: '2', titleKey: 'partner.steps.s2.title', descKey: 'partner.steps.s2.desc', icon: Icons.doc },
  { number: '3', titleKey: 'partner.steps.s3.title', descKey: 'partner.steps.s3.desc', icon: Icons.rocket },
  { number: '4', titleKey: 'partner.steps.s4.title', descKey: 'partner.steps.s4.desc', icon: Icons.check },
];

export default function PartnerPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
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
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// WHY_PARTNER</span>
            <h2 className="font-heading section-title">{t('partner.why.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_PARTNER.map((item, idx) => {
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
            {t('partner.why.footer')}
          </p>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Partnership Opportunities */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// OPPORTUNITIES</span>
            <h2 className="font-heading section-title">{t('partner.opp.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OPPORTUNITIES.map((item, idx) => {
            const theme = THEMES[(idx + 3) % THEMES.length];
            return (
              <RevealOnScroll key={idx} delay={idx * 120}>
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
                  <h3 className="font-heading text-xl font-semibold text-text mb-3 relative z-10">{t(item.titleKey)}</h3>
                  <p className="text-text-muted relative z-10">{t(item.descKey)}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* How It Works */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// PROCESS</span>
            <h2 className="font-heading section-title">{t('partner.steps.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNER_STEPS.map((step, idx) => {
            const theme = THEMES[idx % THEMES.length];
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
        <RevealOnScroll delay={200}>
          <p className="text-text-muted text-center text-sm mt-8">
            {t('partner.steps.footer')}
          </p>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Referral Card + Dashboard */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-8">
            <span className="mono-label">// REFERRAL_PROGRAM</span>
            <h2 className="font-heading section-title">{t('partner.referral.title')}</h2>
            <p className="section-subtitle mx-auto">{t('partner.referral.subtitle')}</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="max-w-md mx-auto mb-8">
            <ReferralCard />
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <ReferralDashboard />
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* Contact CTA */}
      <section className="section-container">
        <RevealOnScroll>
          <div
            className="step-card p-8 md:p-12 text-center"
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
            <div className="relative z-10">
              <div className="step-icon-wrap mx-auto mb-6">
                <div className="step-icon-ping" />
                <div className="step-icon-ring" />
                <div className="step-icon-inner">
                  <span className={THEMES[1].iconColor}>{Icons.handshake}</span>
                </div>
              </div>
              <span className="mono-label">// CONTACT</span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-text mb-4">{t('partner.cta.title')}</h2>
              <p className="text-text-muted max-w-xl mx-auto mb-6">{t('partner.cta.desc')}</p>
              <a href="#" className="btn-primary text-lg px-8 py-3">
                {t('partner.cta.btn')}
              </a>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
