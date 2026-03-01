'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveAd } from '../utils/api';
import { recordAdClick } from '../utils/api';

interface AdDetailModalProps {
  ad: ActiveAd | null;
  onClose: () => void;
}

export default function AdDetailModal({ ad, onClose }: AdDetailModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!ad) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [ad, handleEscape]);

  if (!ad) return null;

  const handleVisit = async () => {
    try {
      await recordAdClick(ad.campaign_id);
    } catch {
      // Silently fail - don't block navigation
    }
    window.open(ad.click_url, '_blank', 'noopener,noreferrer');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopyToken = async () => {
    if (!ad.token_name) return;
    try {
      await navigator.clipboard.writeText(ad.token_name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-glow-lg animate-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-text-muted hover:text-text"
          aria-label={t('ads.close', 'Close')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative w-full aspect-video bg-surface-light overflow-hidden">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          {/* Sponsored badge */}
          <span className="absolute top-3 left-3 text-[10px] font-mono text-text-muted bg-surface/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
            {t('ads.sponsored', 'Sponsored')}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1">
              {ad.advertiser_name}
            </p>
            <h3 className="text-xl font-heading font-bold text-text">{ad.title}</h3>
          </div>

          <p className="text-sm text-text-muted leading-relaxed">{ad.description}</p>

          {/* Token promo info */}
          {ad.is_token_promo && ad.token_name && (
            <div className="bg-surface-light/50 border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                </div>
                <span className="text-sm font-heading font-semibold text-text">
                  {t('ads.tokenInfo', 'Token Info')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t('ads.tokenName', 'Token')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-text">{ad.token_name}</span>
                  <button
                    onClick={handleCopyToken}
                    className="text-[10px] text-primary hover:text-primary-light transition-colors"
                  >
                    {copied ? t('ads.copied', 'Copied!') : t('ads.copy', 'Copy')}
                  </button>
                </div>
              </div>

              {ad.token_exchanges && ad.token_exchanges.length > 0 && (
                <div>
                  <span className="text-xs text-text-muted block mb-2">
                    {t('ads.listedOn', 'Listed on')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ad.token_exchanges.map((ex) => (
                      <span
                        key={ex}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleVisit}
            className="w-full btn-action py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            {t('ads.visit', 'Visit')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
