'use client';

import { useTranslation } from 'react-i18next';

export default function CreditsPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t('credits.title')}</span>
        </h1>
        <p className="text-text-dim text-sm mb-10">{t('credits.lastUpdated')}</p>

        <div className="legal-content space-y-6">
          <p className="text-lg text-text-muted">{t('credits.intro')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">1</div>
                <h3 className="font-semibold text-text">{t('credits.c1.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('credits.c1.desc')}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">2</div>
                <h3 className="font-semibold text-text">{t('credits.c2.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('credits.c2.desc')}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">3</div>
                <h3 className="font-semibold text-text">{t('credits.c3.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('credits.c3.desc')}</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">4</div>
                <h3 className="font-semibold text-text">{t('credits.c4.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('credits.c4.desc')}</p>
            </div>

            <div className="glass-card p-6 sm:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">5</div>
                <h3 className="font-semibold text-text">{t('credits.c5.title')}</h3>
              </div>
              <p className="text-sm text-text-muted">{t('credits.c5.desc')}</p>
            </div>
          </div>

          <div className="glass-card p-6 border-primary/20 mt-4">
            <p className="text-primary font-semibold text-center">{t('credits.finalNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
