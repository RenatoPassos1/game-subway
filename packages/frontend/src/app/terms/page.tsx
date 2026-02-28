'use client';

import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="section-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t('terms.title')}</span>
        </h1>
        <p className="text-text-dim text-sm mb-10">{t('terms.lastUpdated')}</p>

        <div className="legal-content space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2>1. {t('terms.s1.title')}</h2>
            <p>{t('terms.s1.p1')}</p>
          </section>

          {/* 2. Nature of the Platform */}
          <section>
            <h2>2. {t('terms.s2.title')}</h2>
            <p>{t('terms.s2.intro')}</p>
            <ul>
              <li>{t('terms.s2.l1')}</li>
              <li>{t('terms.s2.l2')}</li>
              <li>{t('terms.s2.l3')}</li>
              <li>{t('terms.s2.l4')}</li>
              <li>{t('terms.s2.l5')}</li>
            </ul>
            <p>{t('terms.s2.p1')}</p>
          </section>

          {/* 3. Eligibility */}
          <section>
            <h2>3. {t('terms.s3.title')}</h2>
            <p>{t('terms.s3.intro')}</p>
            <ul>
              <li>{t('terms.s3.l1')}</li>
              <li>{t('terms.s3.l2')}</li>
              <li>{t('terms.s3.l3')}</li>
            </ul>
            <p>{t('terms.s3.p1')}</p>
          </section>

          {/* 4. Wallet-Based Access */}
          <section>
            <h2>4. {t('terms.s4.title')}</h2>
            <p>{t('terms.s4.intro')}</p>
            <ul>
              <li>{t('terms.s4.l1')}</li>
              <li>{t('terms.s4.l2')}</li>
            </ul>
            <p>{t('terms.s4.p1')}</p>
          </section>

          {/* 5. Digital Credits */}
          <section>
            <h2>5. {t('terms.s5.title')}</h2>
            <p>{t('terms.s5.intro')}</p>
            <ul>
              <li>{t('terms.s5.l1')}</li>
              <li>{t('terms.s5.l2')}</li>
              <li>{t('terms.s5.l3')}</li>
              <li>{t('terms.s5.l4')}</li>
              <li>{t('terms.s5.l5')}</li>
            </ul>
            <p>{t('terms.s5.p1')}</p>
          </section>

          {/* 6. Auction Mechanism */}
          <section>
            <h2>6. {t('terms.s6.title')}</h2>
            <p>{t('terms.s6.intro')}</p>
            <ul>
              <li>{t('terms.s6.l1')}</li>
              <li>{t('terms.s6.l2')}</li>
              <li>{t('terms.s6.l3')}</li>
            </ul>
            <p>{t('terms.s6.p1')}</p>
          </section>

          {/* 7. Prize Settlement */}
          <section>
            <h2>7. {t('terms.s7.title')}</h2>
            <p>{t('terms.s7.p1')}</p>
            <p>{t('terms.s7.p2')}</p>
          </section>

          {/* 8. Volatility Disclaimer */}
          <section>
            <h2>8. {t('terms.s8.title')}</h2>
            <p>{t('terms.s8.p1')}</p>
          </section>

          {/* 9. Platform Rights */}
          <section>
            <h2>9. {t('terms.s9.title')}</h2>
            <p>{t('terms.s9.intro')}</p>
            <ul>
              <li>{t('terms.s9.l1')}</li>
              <li>{t('terms.s9.l2')}</li>
              <li>{t('terms.s9.l3')}</li>
              <li>{t('terms.s9.l4')}</li>
              <li>{t('terms.s9.l5')}</li>
            </ul>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2>10. {t('terms.s10.title')}</h2>
            <p>{t('terms.s10.p1')}</p>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2>11. {t('terms.s11.title')}</h2>
            <p>{t('terms.s11.p1')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
