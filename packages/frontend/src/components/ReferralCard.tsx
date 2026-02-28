'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getReferralStats } from '../utils/api';
import type { ReferralStats } from '@click-win/shared/src/types';
import { REFERRAL_BONUS_PCT } from '@click-win/shared/src/constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clickwin.fun';

export default function ReferralCard() {
  const { user, isAuthenticated } = useAuthContext();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  const referralLink = user
    ? `${SITE_URL}/?ref=${user.referralCode}`
    : '';

  useEffect(() => {
    if (!isAuthenticated) return;
    getReferralStats()
      .then(setStats)
      .catch(() => {
        // Silently fail
      });
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
      `Join Click Win and get bonus clicks on your first deposit! ${referralLink}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [referralLink]);

  const handleShareTelegram = useCallback(() => {
    const text = encodeURIComponent(
      `Join Click Win and get bonus clicks on your first deposit!`
    );
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [referralLink]);

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 text-center">
        <p className="text-[#E0E0FF]/50 text-sm">
          Sign in to get your referral link.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#00D2FF] via-[#6C5CE7] to-[#00D2FF]" />

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#E0E0FF]">Refer & Earn</h3>
          <span className="bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold px-2 py-1 rounded-full">
            {(REFERRAL_BONUS_PCT * 100).toFixed(0)}% Bonus
          </span>
        </div>

        {/* Referral Link */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-[#00D2FF] truncate focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
              copied
                ? 'bg-green-500/20 text-green-300'
                : 'bg-white/10 text-[#E0E0FF] hover:bg-white/20'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShareTwitter}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg py-2 text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0088CC]/10 hover:bg-[#0088CC]/20 text-[#0088CC] rounded-lg py-2 text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Telegram
          </button>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-[#E0E0FF]/50">Referred</p>
              <p className="text-lg font-bold text-[#E0E0FF] tabular-nums">
                {stats.totalReferred}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-[#E0E0FF]/50">Clicks Earned</p>
              <p className="text-lg font-bold text-[#FFD700] tabular-nums">
                {stats.totalClicksEarned}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
