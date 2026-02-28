'use client';

import { useTranslation } from 'react-i18next';

export default function CompliancePage() {
  const { t } = useTranslation();

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t('compliance.title')}</span>
        </h1>
        <p className="text-text-dim text-sm mb-10">{t('compliance.lastUpdated')}</p>

        <div className="legal-content space-y-8">
          <p className="text-lg text-text-muted">{t('compliance.intro')}</p>

          {/* What we do NOT support */}
          <section>
            <h2>{t('compliance.doNot.title')}</h2>
            <div className="space-y-3">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.doNot.l1')}</p>
              </div>
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.doNot.l2')}</p>
              </div>
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.doNot.l3')}</p>
              </div>
            </div>
          </section>

          {/* What the platform reserves the right to do */}
          <section>
            <h2>{t('compliance.rights.title')}</h2>
            <div className="space-y-3">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.rights.l1')}</p>
              </div>
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.rights.l2')}</p>
              </div>
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 text-green-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-text-muted">{t('compliance.rights.l3')}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
