'use client';

import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons (w-6 h-6) ---------- */
const sectionIcons: Record<number, JSX.Element> = {
  1: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  2: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  ),
  3: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  4: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path strokeLinecap="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" />
    </svg>
  ),
  5: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
    </svg>
  ),
  6: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  7: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M12 1v4M12 19v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M1 12h4M19 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  8: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  ),
  9: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  10: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  11: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};

/* ---------- Theme colors (rotating) ---------- */
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

const SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export default function TermsPage() {
  const { t } = useTranslation();

  const sectionsWithList = [2, 3, 4, 5, 6, 9];
  const sectionListCounts: Record<number, number> = {
    2: 5, 3: 3, 4: 2, 5: 5, 6: 3, 9: 5,
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// TERMS_OF_SERVICE</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">
            <span className="gradient-text">{t('terms.title')}</span>
          </h1>
          <p className="text-text-dim text-sm font-mono">{t('terms.lastUpdated')}</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Sections */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto space-y-4">
          {SECTIONS.map((num, idx) => {
            const theme = THEMES[idx % THEMES.length];
            const hasIntro = [2, 3, 4, 5, 6, 9].includes(num);
            const hasList = sectionsWithList.includes(num);
            const listCount = sectionListCounts[num] ?? 0;
            const hasP1 = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11].includes(num);
            const hasP2 = num === 7;

            return (
              <RevealOnScroll key={num} delay={idx * 80}>
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
                        <span className={theme.iconColor}>{sectionIcons[num]}</span>
                      </div>
                      <div className="step-number">{String(num).padStart(2, '0')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-lg text-text mb-2">
                        {t(`terms.s${num}.title`)}
                      </h3>
                      <div className="space-y-2 text-sm text-text-muted leading-relaxed">
                        {hasIntro && <p>{t(`terms.s${num}.intro`)}</p>}
                        {hasList && (
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            {Array.from({ length: listCount }, (_, i) => (
                              <li key={i}>{t(`terms.s${num}.l${i + 1}`)}</li>
                            ))}
                          </ul>
                        )}
                        {hasP1 && <p>{t(`terms.s${num}.p1`)}</p>}
                        {hasP2 && <p>{t(`terms.s${num}.p2`)}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Footer note */}
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
              <p className="text-primary font-semibold relative z-10">{t('terms.lastUpdated')}</p>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
