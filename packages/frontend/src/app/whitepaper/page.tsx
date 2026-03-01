'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ================================================================
   SVG ICONS
   ================================================================ */
const Icons = {
  doc: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  layers: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  bolt: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  cpu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  question: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  ),
  handshake: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l4-4 4 4M3 17l4-4M17 17l4-4M7 7l-4 4M17 7l4 4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  rocket: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 2h12" />
    </svg>
  ),
  click: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122M5.98 11.95l-2.121 2.122" />
    </svg>
  ),
  timer: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="13" r="8" />
      <path strokeLinecap="round" d="M12 9v4l2 2M5 3l2 2M19 3l-2 2M10 1h4" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M6 4h12v5a6 6 0 01-12 0V4zM9 18h6M10 22h4M12 15v3" />
    </svg>
  ),
  coin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 6v2m0 8v2M9 8.5a3.5 3.5 0 006 2.46M9 13.04A3.5 3.5 0 0015 15.5" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  chain: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  server: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <path strokeLinecap="round" d="M6 6h.01M6 18h.01" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
};

/* ================================================================
   THEMES
   ================================================================ */
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
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full"><path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className={color} /></svg>
      </div>
      <div className="absolute bottom-0 left-0 w-12 h-12 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full"><path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className={color} /></svg>
      </div>
    </>
  );
}

/* ================================================================
   DATA ARRAYS
   ================================================================ */
const TOC_ITEMS = [
  { id: 'about', key: 'whitepaper.toc.s1', num: '01', icon: Icons.layers },
  { id: 'how-it-works', key: 'whitepaper.toc.s2', num: '02', icon: Icons.bolt },
  { id: 'tech', key: 'whitepaper.toc.s3', num: '03', icon: Icons.cpu },
  { id: 'economics', key: 'whitepaper.toc.s4', num: '04', icon: Icons.chart },
  { id: 'faq', key: 'whitepaper.toc.s5', num: '05', icon: Icons.question },
  { id: 'partner', key: 'whitepaper.toc.s6', num: '06', icon: Icons.handshake },
  { id: 'roadmap', key: 'whitepaper.toc.s7', num: '07', icon: Icons.rocket },
];

const STEPS = [
  { num: '01', titleKey: 'whitepaper.howItWorks.steps.s1.title', descKey: 'whitepaper.howItWorks.steps.s1.desc', icon: Icons.wallet },
  { num: '02', titleKey: 'whitepaper.howItWorks.steps.s2.title', descKey: 'whitepaper.howItWorks.steps.s2.desc', icon: Icons.coin },
  { num: '03', titleKey: 'whitepaper.howItWorks.steps.s3.title', descKey: 'whitepaper.howItWorks.steps.s3.desc', icon: Icons.click },
  { num: '04', titleKey: 'whitepaper.howItWorks.steps.s4.title', descKey: 'whitepaper.howItWorks.steps.s4.desc', icon: Icons.timer },
  { num: '05', titleKey: 'whitepaper.howItWorks.steps.s5.title', descKey: 'whitepaper.howItWorks.steps.s5.desc', icon: Icons.trophy },
  { num: '06', titleKey: 'whitepaper.howItWorks.steps.s6.title', descKey: 'whitepaper.howItWorks.steps.s6.desc', icon: Icons.bolt },
];

const TECH_ITEMS = [
  { titleKey: 'whitepaper.tech.items.t1.title', descKey: 'whitepaper.tech.items.t1.desc', icon: Icons.chain },
  { titleKey: 'whitepaper.tech.items.t2.title', descKey: 'whitepaper.tech.items.t2.desc', icon: Icons.shield },
  { titleKey: 'whitepaper.tech.items.t3.title', descKey: 'whitepaper.tech.items.t3.desc', icon: Icons.server },
  { titleKey: 'whitepaper.tech.items.t4.title', descKey: 'whitepaper.tech.items.t4.desc', icon: Icons.lock },
  { titleKey: 'whitepaper.tech.items.t5.title', descKey: 'whitepaper.tech.items.t5.desc', icon: Icons.globe },
  { titleKey: 'whitepaper.tech.items.t6.title', descKey: 'whitepaper.tech.items.t6.desc', icon: Icons.cpu },
];

const KPI_KEYS = [
  { labelKey: 'whitepaper.economics.clickPrice', valueKey: 'whitepaper.economics.clickPriceValue', icon: Icons.click },
  { labelKey: 'whitepaper.economics.maxDiscount', valueKey: 'whitepaper.economics.maxDiscountValue', icon: Icons.chart },
  { labelKey: 'whitepaper.economics.timerDuration', valueKey: 'whitepaper.economics.timerDurationValue', icon: Icons.timer },
  { labelKey: 'whitepaper.economics.referralBonus', valueKey: 'whitepaper.economics.referralBonusValue', icon: Icons.handshake },
  { labelKey: 'whitepaper.economics.minDeposit', valueKey: 'whitepaper.economics.minDepositValue', icon: Icons.wallet },
];

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

const PARTNER_ITEMS = [
  { titleKey: 'whitepaper.partner.opportunities.o1.title', descKey: 'whitepaper.partner.opportunities.o1.desc', icon: Icons.globe },
  { titleKey: 'whitepaper.partner.opportunities.o2.title', descKey: 'whitepaper.partner.opportunities.o2.desc', icon: Icons.chain },
  { titleKey: 'whitepaper.partner.opportunities.o3.title', descKey: 'whitepaper.partner.opportunities.o3.desc', icon: Icons.rocket },
];

const PHASES = [
  { titleKey: 'whitepaper.roadmap.phases.p1.title', descKey: 'whitepaper.roadmap.phases.p1.desc', icon: Icons.bolt },
  { titleKey: 'whitepaper.roadmap.phases.p2.title', descKey: 'whitepaper.roadmap.phases.p2.desc', icon: Icons.cpu },
  { titleKey: 'whitepaper.roadmap.phases.p3.title', descKey: 'whitepaper.roadmap.phases.p3.desc', icon: Icons.globe },
  { titleKey: 'whitepaper.roadmap.phases.p4.title', descKey: 'whitepaper.roadmap.phases.p4.desc', icon: Icons.rocket },
];

/* revenue segments for donut diagram */
const REVENUE_SEGMENTS = [
  { label: 'Winners', pct: 50, color: '#00FF88' },
  { label: 'Platform', pct: 25, color: '#6C5CE7' },
  { label: 'Referrals', pct: 15, color: '#FFD700' },
  { label: 'Reserve', pct: 10, color: '#00D2FF' },
];

/* ================================================================
   DONUT CHART (pure SVG)
   ================================================================ */
function DonutChart() {
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {REVENUE_SEGMENTS.map((seg) => {
          const dashArray = (seg.pct / 100) * circumference;
          const dashOffset = -offset;
          offset += dashArray;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500 hover:opacity-80"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          );
        })}
        <text x="50%" y="48%" textAnchor="middle" className="fill-text font-heading font-bold text-lg" fontSize="18">100%</text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-text-muted font-mono" fontSize="10">Revenue</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-4">
        {REVENUE_SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-text-muted font-mono">{seg.label} {seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   ARCHITECTURE DIAGRAM (SVG)
   ================================================================ */
function ArchitectureDiagram() {
  const layers = [
    { label: 'Frontend', sub: 'Next.js / React', color: '#00D2FF', y: 20 },
    { label: 'API Layer', sub: 'Node.js / WebSocket', color: '#6C5CE7', y: 90 },
    { label: 'Smart Contracts', sub: 'Solana / BNB Chain', color: '#FFD700', y: 160 },
  ];

  return (
    <svg viewBox="0 0 400 220" className="w-full max-w-md mx-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(108,92,231,0.2))' }}>
      {/* connecting arrows */}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6C5CE7" opacity="0.6" />
        </marker>
      </defs>
      <line x1="200" y1="55" x2="200" y2="82" stroke="#6C5CE7" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrowhead)" opacity="0.5" />
      <line x1="200" y1="125" x2="200" y2="152" stroke="#FFD700" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrowhead)" opacity="0.5" />

      {layers.map((layer) => (
        <g key={layer.label}>
          <rect x="60" y={layer.y} width="280" height="50" rx="12" fill="rgba(15,15,30,0.8)" stroke={layer.color} strokeWidth="1.5" opacity="0.9" />
          <text x="200" y={layer.y + 22} textAnchor="middle" fill={layer.color} fontSize="13" fontWeight="bold" fontFamily="monospace">{layer.label}</text>
          <text x="200" y={layer.y + 38} textAnchor="middle" fill="#A0AEC0" fontSize="10" fontFamily="monospace">{layer.sub}</text>
          {/* glow effect */}
          <rect x="60" y={layer.y} width="280" height="50" rx="12" fill="none" stroke={layer.color} strokeWidth="0.5" opacity="0.3" filter="url(#glow)" />
        </g>
      ))}
    </svg>
  );
}

/* ================================================================
   FLOW DIAGRAM (horizontal connecting arrows for How It Works)
   ================================================================ */
function FlowConnector() {
  return (
    <div className="hidden lg:flex items-center justify-center -my-2 relative z-0">
      <svg viewBox="0 0 40 30" className="w-8 h-6 text-primary/30">
        <path d="M20 0 L20 20 L14 14 M20 20 L26 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ================================================================
   COMPONENT
   ================================================================ */
export default function WhitepaperPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTechTab, setActiveTechTab] = useState(0);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 w-60 h-60 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
            <span className="gradient-text">{t('whitepaper.hero.title')}</span>
          </h1>
          <p className="text-text-muted text-lg max-w-3xl mx-auto mb-8">
            {t('whitepaper.hero.subtitle')}
          </p>
          <button
            onClick={() => scrollTo('about')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary font-mono text-sm hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Explore
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TABLE OF CONTENTS                                                */}
      {/* ================================================================ */}
      <section className="section-container">
        <RevealOnScroll>
          <h2 className="section-title text-center mb-8 font-heading">{t('whitepaper.toc.title')}</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {TOC_ITEMS.map((item, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={item.id} delay={idx * 60}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className="step-card group w-full text-left h-full"
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
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`${theme.iconColor} flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`}>
                      {item.icon}
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-text-dim block">{item.num}</span>
                      <span className="text-text text-sm font-heading group-hover:text-primary transition-colors">
                        {t(item.key)}
                      </span>
                    </div>
                  </div>
                </button>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 01 - ABOUT                                               */}
      {/* ================================================================ */}
      <section id="about" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-6">{t('whitepaper.about.title')}</h2>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <div
            className="step-card"
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
            <div className="flex items-start gap-4 relative z-10">
              <div className="step-icon-wrap flex-shrink-0">
                <div className="step-icon-ping" />
                <div className="step-icon-ring" />
                <div className="step-icon-inner">
                  <span className={THEMES[0].iconColor}>{Icons.layers}</span>
                </div>
                <div className="step-number">01</div>
              </div>
              <div className="space-y-3">
                <p className="text-text-muted text-lg leading-relaxed">{t('whitepaper.about.desc')}</p>
                <p className="text-text-muted leading-relaxed">{t('whitepaper.about.mission')}</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 02 - HOW IT WORKS (Flow Diagram)                         */}
      {/* ================================================================ */}
      <section id="how-it-works" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-8">{t('whitepaper.howItWorks.title')}</h2>
        </RevealOnScroll>

        {/* Flow diagram: vertical connected cards */}
        <div className="max-w-2xl mx-auto">
          {STEPS.map((step, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <div key={step.num}>
                <RevealOnScroll delay={idx * 100}>
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
                          <span className={theme.iconColor}>{step.icon}</span>
                        </div>
                        <div className="step-number">{step.num}</div>
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-text mb-1">{t(step.titleKey)}</h3>
                        <p className="text-sm text-text-muted">{t(step.descKey)}</p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
                {/* Flow connector arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="flex justify-center -my-1 relative z-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary/25">
                      <path d="M12 4 L12 18 L7 13 M12 18 L17 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 03 - TECHNOLOGY (Architecture Diagram + Tabs)            */}
      {/* ================================================================ */}
      <section id="tech" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-8">{t('whitepaper.tech.title')}</h2>
        </RevealOnScroll>

        {/* Architecture Diagram */}
        <RevealOnScroll delay={100}>
          <div
            className="step-card mb-8"
            style={{
              '--step-accent': THEMES[4].accent,
              '--step-glow': THEMES[4].glow,
              '--step-shadow': THEMES[4].shadow,
              '--step-ping': THEMES[4].ping,
              '--step-ring': THEMES[4].ring,
              '--step-icon-bg': THEMES[4].iconBg,
              '--step-num-bg': THEMES[4].numBg,
              '--step-num-shadow': THEMES[4].numShadow,
            } as React.CSSProperties}
          >
            <CornerDecorations color={THEMES[4].cornerColor} />
            <h3 className="font-heading text-sm font-semibold text-secondary mb-4 text-center relative z-10">SYSTEM ARCHITECTURE</h3>
            <div className="relative z-10">
              <ArchitectureDiagram />
            </div>
          </div>
        </RevealOnScroll>

        {/* Interactive tech tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {TECH_ITEMS.map((item, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <button
                key={idx}
                onClick={() => setActiveTechTab(idx)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all duration-300 ${
                  activeTechTab === idx
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-transparent border-border/30 text-text-dim hover:border-primary/20 hover:text-text-muted'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Active tech card */}
        <RevealOnScroll>
          {(() => {
            const idx = activeTechTab;
            const theme = THEMES[idx % THEMES.length];
            const item = TECH_ITEMS[idx];
            return (
              <div
                className="step-card group max-w-2xl mx-auto"
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
                    <div className="step-number">{String(idx + 1).padStart(2, '0')}</div>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-text mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 04 - ECONOMICS (KPIs + Donut Chart)                      */}
      {/* ================================================================ */}
      <section id="economics" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-8">{t('whitepaper.economics.title')}</h2>
        </RevealOnScroll>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {KPI_KEYS.map((kpi, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={idx} delay={idx * 80}>
                <div
                  className="step-card h-full group text-center"
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
                  <div className="relative z-10">
                    <div className="step-icon-wrap mx-auto mb-3">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={theme.iconColor}>{kpi.icon}</span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-1">{t(kpi.labelKey)}</p>
                    <p className="text-2xl font-heading font-bold text-text">{t(kpi.valueKey)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Revenue Donut Chart */}
        <RevealOnScroll delay={200}>
          <div
            className="step-card max-w-lg mx-auto"
            style={{
              '--step-accent': THEMES[3].accent,
              '--step-glow': THEMES[3].glow,
              '--step-shadow': THEMES[3].shadow,
              '--step-ping': THEMES[3].ping,
              '--step-ring': THEMES[3].ring,
              '--step-icon-bg': THEMES[3].iconBg,
              '--step-num-bg': THEMES[3].numBg,
              '--step-num-shadow': THEMES[3].numShadow,
            } as React.CSSProperties}
          >
            <CornerDecorations color={THEMES[3].cornerColor} />
            <h3 className="font-heading text-sm font-semibold text-[#00FF88] mb-6 text-center relative z-10">REVENUE DISTRIBUTION</h3>
            <div className="relative z-10">
              <DonutChart />
            </div>
          </div>
        </RevealOnScroll>

        {/* Revenue Model text */}
        <RevealOnScroll delay={300}>
          <div
            className="step-card mt-6 max-w-3xl mx-auto"
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
            <p className="text-text-muted leading-relaxed relative z-10">{t('whitepaper.economics.revenueModel')}</p>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 05 - FAQ (Interactive Accordion)                         */}
      {/* ================================================================ */}
      <section id="faq" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-8">{t('whitepaper.faq.title')}</h2>
        </RevealOnScroll>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_KEYS.map((key, idx) => {
            const isOpen = openFaq === idx;
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={key} delay={idx * 60}>
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
                  <button
                    className="w-full flex items-center justify-between text-left relative z-10"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className="step-icon-wrap flex-shrink-0" style={{ width: 36, height: 36 }}>
                        <div className="step-icon-ping" />
                        <div className="step-icon-ring" />
                        <div className="step-icon-inner" style={{ width: 28, height: 28 }}>
                          <span className={`${theme.iconColor} text-xs font-bold font-mono`}>{String(idx + 1).padStart(2, '0')}</span>
                        </div>
                      </div>
                      <span className="text-text font-heading font-semibold text-sm md:text-base">
                        {t(`whitepaper.faq.items.${key}.q`)}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? '400px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="text-text-muted text-sm mt-4 ml-12 leading-relaxed relative z-10">
                      {t(`whitepaper.faq.items.${key}.a`)}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 06 - PARTNERSHIPS                                        */}
      {/* ================================================================ */}
      <section id="partner" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-4">{t('whitepaper.partner.title')}</h2>
          <p className="text-text-muted max-w-3xl mb-8">{t('whitepaper.partner.desc')}</p>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PARTNER_ITEMS.map((item, idx) => {
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
                  <div className="relative z-10">
                    <div className="step-icon-wrap mb-4">
                      <div className="step-icon-ping" />
                      <div className="step-icon-ring" />
                      <div className="step-icon-inner">
                        <span className={theme.iconColor}>{item.icon}</span>
                      </div>
                      <div className="step-number">{String(idx + 1).padStart(2, '0')}</div>
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-text mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-text-muted">{t(item.descKey)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
        <RevealOnScroll delay={200}>
          <div
            className="step-card p-6 text-center"
            style={{
              '--step-accent': THEMES[5].accent,
              '--step-glow': THEMES[5].glow,
              '--step-shadow': THEMES[5].shadow,
              '--step-ping': THEMES[5].ping,
              '--step-ring': THEMES[5].ring,
              '--step-icon-bg': THEMES[5].iconBg,
              '--step-num-bg': THEMES[5].numBg,
              '--step-num-shadow': THEMES[5].numShadow,
            } as React.CSSProperties}
          >
            <CornerDecorations color={THEMES[5].cornerColor} />
            <p className="font-mono text-sm text-text-muted relative z-10">{t('whitepaper.partner.contact')}</p>
          </div>
        </RevealOnScroll>
      </section>

      <div className="section-divider" />

      {/* ================================================================ */}
      {/* SECTION 07 - ROADMAP (Timeline Diagram)                          */}
      {/* ================================================================ */}
      <section id="roadmap" className="section-container scroll-mt-20">
        <RevealOnScroll>
          <h2 className="section-title font-heading mb-8">{t('whitepaper.roadmap.title')}</h2>
        </RevealOnScroll>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-secondary/30 to-accent/20" />

          {PHASES.map((phase, idx) => {
            const theme = THEMES[idx % THEMES.length];
            return (
              <RevealOnScroll key={idx} delay={idx * 120}>
                <div className="relative pl-16 md:pl-20 pb-8 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-6 top-4 w-4 h-4 rounded-full border-2 z-10" style={{ borderColor: REVENUE_SEGMENTS[idx]?.color || '#6C5CE7', background: 'rgba(15,15,30,0.9)', boxShadow: `0 0 12px ${REVENUE_SEGMENTS[idx]?.color || '#6C5CE7'}40` }} />
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
                          <span className={theme.iconColor}>{phase.icon}</span>
                        </div>
                        <div className="step-number">{String(idx + 1).padStart(2, '0')}</div>
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg text-text mb-1">{t(phase.titleKey)}</h3>
                        <p className="text-sm text-text-muted">{t(phase.descKey)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Vision */}
        <RevealOnScroll delay={300}>
          <div
            className="step-card mt-10 max-w-3xl mx-auto text-center relative overflow-hidden"
            style={{
              '--step-accent': THEMES[4].accent,
              '--step-glow': THEMES[4].glow,
              '--step-shadow': THEMES[4].shadow,
              '--step-ping': THEMES[4].ping,
              '--step-ring': THEMES[4].ring,
              '--step-icon-bg': THEMES[4].iconBg,
              '--step-num-bg': THEMES[4].numBg,
              '--step-num-shadow': THEMES[4].numShadow,
            } as React.CSSProperties}
          >
            <CornerDecorations color={THEMES[4].cornerColor} />
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #00D2FF 0%, transparent 70%)' }} />
            <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed relative z-10">
              {t('whitepaper.roadmap.vision')}
            </p>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
