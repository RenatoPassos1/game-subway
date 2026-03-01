'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

function FaqAccordion({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const { t } = useTranslation();

  const listItems = item.listKey ? (t(item.listKey, { returnObjects: true }) as string[]) : null;

  return (
    <div className="faq-item" data-open={isOpen ? 'true' : 'false'}>
      <button className="faq-question" onClick={onToggle}>
        <span className="font-heading">{t(item.questionKey)}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="faq-answer">
          <p>{t(item.answerKey)}</p>
          {Array.isArray(listItems) && listItems.length > 0 && (
            <ul className="list-disc list-inside mt-3 space-y-1 text-text-muted">
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
        </div>
        <div className="scanline-overlay" />
        <div className="relative z-10 section-container text-center">
          <span className="mono-label">// HELP CENTER</span>
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
        <div className="text-center mb-12">
          <span className="mono-label">// FAQ</span>
          <h2 className="font-heading section-title">{t('help.hero.title')}</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <FaqAccordion
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Support CTA */}
      <section className="section-container">
        <div className="tech-card p-8 md:p-12 text-center">
          <span className="mono-label">// SUPPORT</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-text mb-4">{t('help.support.title')}</h2>
          <p className="text-text-muted max-w-xl mx-auto mb-6">{t('help.support.desc')}</p>
          <a
            href="#"
            className="btn-primary text-lg px-8 py-3"
          >
            {t('help.support.btn')}
          </a>
        </div>
      </section>
    </div>
  );
}
