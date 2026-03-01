'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuthContext } from '../contexts/AuthContext';
import { getReferralStats } from '../utils/api';
import type { ReferralStats } from '@click-win/shared/src/types';
import { REFERRAL_BONUS_PCT } from '@click-win/shared/src/constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clickwin.fun';

export default function ReferralCTA() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthContext();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  const referralLink = user ? `${SITE_URL}/?ref=${user.referralCode}` : '';
  const bonusPct = (REFERRAL_BONUS_PCT * 100).toFixed(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    getReferralStats().then(setStats).catch(() => {});
  }, [isAuthenticated]);

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(
      t('referralCta.shareTwitterText', { link: referralLink })
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  }, [referralLink]);

  const handleShareTelegram = useCallback(() => {
    const text = encodeURIComponent(t('referralCta.shareTelegramText'));
    const url = encodeURIComponent(referralLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  }, [referralLink]);

  if (!isAuthenticated || !user) {
    return (
      <div className="tech-card p-6 text-center h-full flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, #FFD700 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 mx-auto">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">{t('referralCta.signIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tech-card overflow-hidden p-0 h-full flex flex-col relative group">
      {/* Top accent bar - gold */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-[#FF8C00]" />

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className="text-accent" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className="text-accent" />
        </svg>
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 opacity-5 pointer-events-none transition-opacity duration-500 group-hover:opacity-10" style={{ background: 'radial-gradient(ellipse at 50% 30%, #FFD700 0%, transparent 70%)' }} />

      <div className="p-5 flex-1 flex flex-col space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-text font-heading">{t('referralCta.title')}</h2>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-[10px] font-bold text-accent font-mono">+{bonusPct}%</span>
          </div>
        </div>

        {/* Hero CTA message */}
        <div className="text-center py-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 relative">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 rounded-full border border-accent/10" />
            <div className="relative w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-accent font-mono">{bonusPct}%</span>
            </div>
          </div>
          <p className="text-sm text-text leading-snug font-heading font-semibold">
            <Trans
              i18nKey="referralCta.earnBonus"
              values={{ pct: bonusPct }}
              components={{ accent: <span className="text-accent" /> }}
            />
          </p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {t('referralCta.earnDesc')}
          </p>
        </div>

        {/* Referral link */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-secondary truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                copied
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20'
              }`}
            >
              {copied ? t('referralCta.copied') : t('referralCta.copy')}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={handleShareTwitter}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#1DA1F2]/8 hover:bg-[#1DA1F2]/15 text-[#1DA1F2] rounded-lg py-1.5 text-xs font-medium transition-all border border-[#1DA1F2]/10"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t('referralCta.twitter')}
            </button>
            <button
              onClick={handleShareTelegram}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#0088CC]/8 hover:bg-[#0088CC]/15 text-[#0088CC] rounded-lg py-1.5 text-xs font-medium transition-all border border-[#0088CC]/10"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              {t('referralCta.telegram')}
            </button>
          </div>
        </div>

        {/* Stats - at bottom */}
        <div className="mt-auto pt-2 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
              <p className="text-[10px] text-text-muted font-mono uppercase">{t('referralCta.referred')}</p>
              <p className="text-base font-bold text-text tabular-nums font-mono">
                {stats?.totalReferred ?? 0}
              </p>
            </div>
            <div className="bg-accent/5 rounded-lg p-2 text-center border border-accent/10">
              <p className="text-[10px] text-accent/60 font-mono uppercase">{t('referralCta.earned')}</p>
              <p className="text-base font-bold text-accent tabular-nums font-mono">
                {stats?.totalClicksEarned ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
