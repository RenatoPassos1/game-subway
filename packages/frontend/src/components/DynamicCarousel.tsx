'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getActiveAds, recordAdImpression, type ActiveAd } from '../utils/api';
import AdDetailModal from './AdDetailModal';

const INTERVAL_MS = 5000;

/* ---- Default static slides (fallback when no carousel ads exist) ---- */
interface StaticSlide {
  titleKey: string;
  descKey: string;
  gradient: string;
  icon: React.ReactNode;
}

function DefaultSlides(t: (k: string) => string): StaticSlide[] {
  return [
    {
      titleKey: 'home.carousel.slide1.title',
      descKey: 'home.carousel.slide1.desc',
      gradient: 'from-primary/30 to-secondary/20',
      icon: (
        <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80">
          <circle cx="40" cy="40" r="30" stroke="#6C5CE7" strokeWidth="2" fill="none" opacity="0.4" />
          <circle cx="40" cy="40" r="18" stroke="#00D2FF" strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="40" cy="40" r="6" fill="url(#dcg)" />
          <path d="M20 14 L20 42 L28 34 L36 48 L40 46 L32 32 L40 30 Z" fill="url(#dcg)" />
          <defs>
            <linearGradient id="dcg" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6C5CE7" />
              <stop offset="100%" stopColor="#00D2FF" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      titleKey: 'home.carousel.slide2.title',
      descKey: 'home.carousel.slide2.desc',
      gradient: 'from-accent/20 to-primary/20',
      icon: (
        <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80">
          <rect x="10" y="20" width="60" height="40" rx="6" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M25 45 L35 32 L45 40 L58 25" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="58" cy="25" r="4" fill="#FFD700" opacity="0.7" />
          <text x="40" y="55" textAnchor="middle" fill="#FFD700" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.8">99%</text>
        </svg>
      ),
    },
    {
      titleKey: 'home.carousel.slide3.title',
      descKey: 'home.carousel.slide3.desc',
      gradient: 'from-secondary/20 to-primary/30',
      icon: (
        <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 opacity-80">
          <rect x="12" y="12" width="56" height="56" rx="12" stroke="#00D2FF" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M24 50 L24 35 L32 35 L32 50" stroke="#6C5CE7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M36 50 L36 28 L44 28 L44 50" stroke="#00D2FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M48 50 L48 22 L56 22 L56 50" stroke="#6C5CE7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="20" y1="50" x2="62" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      ),
    },
  ];
}

export default function DynamicCarousel() {
  const { t } = useTranslation();
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [active, setActive] = useState(0);
  const [selectedAd, setSelectedAd] = useState<ActiveAd | null>(null);
  const [loading, setLoading] = useState(true);
  const impressionRef = useRef<Set<string>>(new Set());

  // Fetch ads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getActiveAds();
        if (!cancelled) {
          setAds(res.carousel);
        }
      } catch {
        // Fallback to empty (will show default slides)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate
  const slideCount = ads.length > 0 ? ads.length : 3;
  const next = useCallback(() => setActive((p) => (p + 1) % slideCount), [slideCount]);

  useEffect(() => {
    const id = setInterval(next, INTERVAL_MS);
    return () => clearInterval(id);
  }, [next]);

  // Record impression when slide changes (only for ad slides)
  useEffect(() => {
    if (ads.length > 0 && ads[active]) {
      const cid = ads[active].campaign_id;
      if (!impressionRef.current.has(cid)) {
        impressionRef.current.add(cid);
        recordAdImpression(cid).catch(() => {});
      }
    }
  }, [active, ads]);

  const handleSlideClick = (ad: ActiveAd) => {
    setSelectedAd(ad);
  };

  const useAds = ads.length > 0;
  const defaults = DefaultSlides(t);

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: 320 }}>
        {/* Ad-based slides */}
        {useAds &&
          ads.map((ad, i) => (
            <div
              key={ad.campaign_id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out cursor-pointer ${
                i === active
                  ? 'opacity-100 translate-x-0'
                  : i < active
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
              }`}
              onClick={() => handleSlideClick(ad)}
            >
              {/* Image background */}
              <img
                src={ad.image_url}
                alt={ad.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Sponsored badge */}
              <span className="absolute top-4 right-4 z-10 text-[10px] font-mono bg-primary/80 text-white px-2 py-1 rounded backdrop-blur-sm">
                {t('ads.sponsored', 'Sponsored')}
              </span>

              {/* Title */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider mb-1">
                  {ad.advertiser_name}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white font-heading leading-tight">
                  {ad.title}
                </h2>
                <p className="text-white/70 text-sm mt-1 max-w-md line-clamp-2">
                  {ad.description}
                </p>
              </div>
            </div>
          ))}

        {/* Default static slides (fallback) */}
        {!useAds && !loading &&
          defaults.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col justify-center px-8 md:px-12 transition-all duration-700 ease-in-out bg-gradient-to-br ${slide.gradient} ${
                i === active
                  ? 'opacity-100 translate-x-0'
                  : i < active
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="mb-6">{slide.icon}</div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text mb-3 font-heading leading-tight">
                {t(slide.titleKey)}
              </h2>
              <p className="text-text-muted text-sm md:text-base max-w-md leading-relaxed">
                {t(slide.descKey)}
              </p>
            </div>
          ))}

        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Glass overlay border */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

        {/* Scanline effect */}
        <div className="scanline-overlay rounded-2xl" />

        {/* Navigation dots */}
        <div className="absolute bottom-4 left-8 md:left-12 flex items-center gap-2 z-10">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-8 bg-primary' : 'w-3 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Ad Detail Modal */}
      <AdDetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </>
  );
}
