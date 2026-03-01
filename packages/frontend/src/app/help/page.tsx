'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RevealOnScroll from '../../components/RevealOnScroll';

/* ---------- SVG Icons ---------- */
const Icons = {
  question: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  chat: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  headphones: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
};

/* ---------- Theme colors ---------- */
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

interface FaqItem {
  questionKey: string;
  answerKey: string;
  listKey?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  { questionKey: 'help.faq.q1.question', answerKey: 'help.faq.q1.answer', listKey: 'help.faq.q1.list' },
  { questionKey: 'help.faq.q2.question', answerKey: 'help.faq.q2.answer', listKey: 'help.faq.q2.list' },
  { questionKey: 'help.faq.q3.question', answerKey: 'help.faq.q3.answer' },
  { questionKey: 'help.faq.q4.question', answerKey: 'help.faq.q4.answer', listKey: 'help.faq.q4.list' },
  { questionKey: 'help.faq.q5.question', answerKey: 'help.faq.q5.answer' },
  { questionKey: 'help.faq.q6.question', answerKey: 'help.faq.q6.answer', listKey: 'help.faq.q6.list' },
  { questionKey: 'help.faq.q7.question', answerKey: 'help.faq.q7.answer' },
];

function FaqAccordion({ item, index, isOpen, onToggle }: { item: FaqItem; index: number; isOpen: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const theme = THEMES[index % THEMES.length];
  const listItems = item.listKey ? (t(item.listKey, { returnObjects: true }) as string[]) : null;

  return (
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
      <button className="w-full flex items-center gap-4 text-left relative z-10" onClick={onToggle}>
        <div className="step-icon-wrap flex-shrink-0">
          <div className="step-icon-ping" />
          <div className="step-icon-ring" />
          <div className="step-icon-inner">
            <span className={theme.iconColor}>{Icons.question}</span>
          </div>
          <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
        </div>
        <span className="font-heading font-semibold text-text flex-1 pr-4">{t(item.questionKey)}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: isOpen ? theme.numShadow.replace('0.4', '1') : 'rgba(255,255,255,0.3)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 relative z-10"
        style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="pt-4 pl-[72px] border-t border-white/5 mt-4">
          <p className="text-text-muted text-sm leading-relaxed">{t(item.answerKey)}</p>
          {Array.isArray(listItems) && listItems.length > 0 && (
            <ul className="list-disc list-inside mt-3 space-y-1 text-text-muted text-sm">
              {listItems.map((li, idx) => (
                <li key={idx}>{li}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 grid-pattern">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)' }} />
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// HELP_CENTER</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">{t('help.hero.title')}</span>
          </h1>
          <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto">
            {t('help.hero.subtitle')}
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* FAQ */}
      <section className="section-container">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <span className="mono-label">// FAQ</span>
            <h2 className="font-heading section-title">{t('help.hero.title')}</h2>
          </div>
        </RevealOnScroll>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <RevealOnScroll key={index} delay={index * 80}>
              <FaqAccordion
                item={item}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Support CTA */}
      <section className="section-container">
        <RevealOnScroll>
          <div
            className="step-card p-8 md:p-12 text-center"
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
            <div className="relative z-10">
              <div className="step-icon-wrap mx-auto mb-6">
                <div className="step-icon-ping" />
                <div className="step-icon-ring" />
                <div className="step-icon-inner">
                  <span className={THEMES[3].iconColor}>{Icons.headphones}</span>
                </div>
              </div>
              <span className="mono-label">// SUPPORT</span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-text mb-4">{t('help.support.title')}</h2>
              <p className="text-text-muted max-w-xl mx-auto mb-6">{t('help.support.desc')}</p>
              <a href="#" className="btn-primary text-lg px-8 py-3">
                {t('help.support.btn')}
              </a>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  );
}
