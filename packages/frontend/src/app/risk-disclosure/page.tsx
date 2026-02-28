'use client';

import { useTranslation } from 'react-i18next';

export default function RiskDisclosurePage() {
  const { t } = useTranslation();

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t('risk.title')}</span>
        </h1>
        <p className="text-text-dim text-sm mb-10">{t('risk.lastUpdated')}</p>

        <div className="legal-content space-y-6">
          <p>{t('risk.intro')}</p>

          <div className="space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{t('risk.r1.title')}</h3>
                  <p className="text-text-muted text-sm">{t('risk.r1.desc')}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{t('risk.r2.title')}</h3>
                  <p className="text-text-muted text-sm">{t('risk.r2.desc')}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/10 text-yellow-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{t('risk.r3.title')}</h3>
                  <p className="text-text-muted text-sm">{t('risk.r3.desc')}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{t('risk.r4.title')}</h3>
                  <p className="text-text-muted text-sm">{t('risk.r4.desc')}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{t('risk.r5.title')}</h3>
                  <p className="text-text-muted text-sm">{t('risk.r5.desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-accent/20 mt-8">
            <p className="text-accent font-semibold text-center">{t('risk.disclaimer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
