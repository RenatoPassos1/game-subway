'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getActiveAds, recordAdImpression, type ActiveAd } from '../utils/api';
import AdDetailModal from './AdDetailModal';

export default function DynamicSideCards() {
  const { t } = useTranslation();
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [selectedAd, setSelectedAd] = useState<ActiveAd | null>(null);
  const [loading, setLoading] = useState(true);
  const impressionRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getActiveAds();
        if (!cancelled) {
          setAds(res.side_cards.slice(0, 2));
        }
      } catch {
        // Fallback to defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Record impressions on mount
  useEffect(() => {
    ads.forEach((ad) => {
      if (!impressionRef.current.has(ad.campaign_id)) {
        impressionRef.current.add(ad.campaign_id);
        recordAdImpression(ad.campaign_id).catch(() => {});
      }
    });
  }, [ads]);

  const handleAdClick = (ad: ActiveAd) => {
    setSelectedAd(ad);
  };

  const useAds = ads.length > 0;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Loading state */}
        {loading && (
          <>
            <div className="glass-card p-6 flex-1 flex items-center justify-center animate-pulse" style={{ minHeight: 140 }}>
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <div className="glass-card p-6 flex-1 flex items-center justify-center animate-pulse" style={{ minHeight: 140 }}>
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </>
        )}

        {/* Ad-based side cards */}
        {!loading && useAds && ads.map((ad) => (
          <div
            key={ad.campaign_id}
            className="glass-card p-0 flex-1 flex flex-col cursor-pointer group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            onClick={() => handleAdClick(ad)}
          >
            {/* Thumbnail */}
            <div className="relative w-full h-24 overflow-hidden rounded-t-2xl">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              {/* Ad badge */}
              <span className="absolute top-2 right-2 text-[9px] font-mono text-text-muted bg-surface/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
                {t('ads.ad', 'Ad')}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 justify-center">
              <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider mb-1">
                {ad.advertiser_name}
              </p>
              <h3 className="text-base font-bold text-text font-heading mb-1 line-clamp-1">
                {ad.title}
              </h3>
              <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                {ad.description}
              </p>
              {ad.is_token_promo && ad.token_name && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-primary">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                  {ad.token_name}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Default static cards (fallback) */}
        {!loading && !useAds && (
          <>
            {/* Card 1 - Live Status */}
            <div className="glass-card p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="mono-label">{t('home.sideCard.liveLabel')}</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text font-heading mb-2">
                {t('home.sideCard.liveTitle')}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {t('home.sideCard.liveDesc')}
              </p>
            </div>

            {/* Card 2 - Quick Start */}
            <div className="glass-card p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">&#9889;</span>
                <span className="mono-label">{t('home.sideCard.quickLabel')}</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text-accent font-heading mb-2">
                {t('home.sideCard.quickTitle')}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                {t('home.sideCard.quickDesc')}
              </p>
              <button className="btn-accent text-sm px-5 py-2.5 w-full">
                {t('home.cta.start')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Ad Detail Modal */}
      <AdDetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </>
  );
}
