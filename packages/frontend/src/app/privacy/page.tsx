'use client';

import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t('privacy.title')}</span>
        </h1>
        <p className="text-text-dim text-sm mb-10">{t('privacy.lastUpdated')}</p>

        <div className="legal-content space-y-8">
          {/* 1. Data Collected */}
          <section>
            <h2>1. {t('privacy.s1.title')}</h2>
            <p>{t('privacy.s1.intro')}</p>
            <ul>
              <li>{t('privacy.s1.l1')}</li>
              <li>{t('privacy.s1.l2')}</li>
              <li>{t('privacy.s1.l3')}</li>
              <li>{t('privacy.s1.l4')}</li>
              <li>{t('privacy.s1.l5')}</li>
            </ul>
            <p>{t('privacy.s1.p1')}</p>
          </section>

          {/* 2. Purpose of Data Collection */}
          <section>
            <h2>2. {t('privacy.s2.title')}</h2>
            <p>{t('privacy.s2.intro')}</p>
            <ul>
              <li>{t('privacy.s2.l1')}</li>
              <li>{t('privacy.s2.l2')}</li>
              <li>{t('privacy.s2.l3')}</li>
              <li>{t('privacy.s2.l4')}</li>
              <li>{t('privacy.s2.l5')}</li>
            </ul>
          </section>

          {/* 3. Blockchain Transparency */}
          <section>
            <h2>3. {t('privacy.s3.title')}</h2>
            <p>{t('privacy.s3.p1')}</p>
          </section>

          {/* 4. Cookies */}
          <section>
            <h2>4. {t('privacy.s4.title')}</h2>
            <p>{t('privacy.s4.p1')}</p>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2>5. {t('privacy.s5.title')}</h2>
            <p>{t('privacy.s5.p1')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
