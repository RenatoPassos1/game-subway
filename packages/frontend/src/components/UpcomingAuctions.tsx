'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getUpcomingAuctions } from '../utils/api';
import type { Auction } from '@click-win/shared/src/types';
import AuctionCountdown from './AuctionCountdown';

/* ---------- Fictional fallback data ---------- */
const FALLBACK_UPCOMING = [
  {
    id: 'demo-1',
    prize_description: '2.5 SOL',
    startsIn: '12 min',
    click_price: '$0.10',
    max_discount_pct: 85,
    statusKey: 'startingSoon' as const,
    statusColor: '#FFD700',
    gradient: 'from-[#9945FF]/20 to-[#14F195]/10',
    scheduled_start: null as string | null,
  },
  {
    id: 'demo-2',
    prize_description: '5 SOL',
    startsIn: '1h 30m',
    click_price: '$0.15',
    max_discount_pct: 90,
    statusKey: 'scheduled' as const,
    statusColor: '#9945FF',
    gradient: 'from-[#14F195]/15 to-[#9945FF]/10',
    scheduled_start: null as string | null,
  },
  {
    id: 'demo-3',
    prize_description: '1 SOL',
    startsIn: '3h 15m',
    click_price: '$0.05',
    max_discount_pct: 80,
    statusKey: 'scheduled' as const,
    statusColor: '#9945FF',
    gradient: 'from-[#9945FF]/15 to-[#FFD700]/10',
    scheduled_start: null as string | null,
  },
  {
    id: 'demo-4',
    prize_description: '10 SOL',
    startsIn: '6h 00m',
    click_price: '$0.25',
    max_discount_pct: 95,
    statusKey: 'specialEvent' as const,
    statusColor: '#14F195',
    gradient: 'from-[#14F195]/20 to-[#9945FF]/15',
    scheduled_start: null as string | null,
  },
];

function SolanaLogoSmall() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 397.7 311.7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <linearGradient id="sol-up-a" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-up-a)" />
      <linearGradient id="sol-up-b" x1="264.829" y1="401.601" x2="45.163" y2="-19.148" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-up-b)" />
      <linearGradient id="sol-up-c" x1="312.548" y1="376.688" x2="92.882" y2="-44.061" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-up-c)" />
    </svg>
  );
}

const GRADIENTS = [
  'from-[#9945FF]/20 to-[#14F195]/10',
  'from-[#14F195]/15 to-[#9945FF]/10',
  'from-[#9945FF]/15 to-[#FFD700]/10',
  'from-[#14F195]/20 to-[#9945FF]/15',
];

export default function UpcomingAuctions() {
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const fetchAuctions = useCallback(async () => {
    try {
      const data = await getUpcomingAuctions();
      if (data.length > 0) {
        setAuctions(data);
        setUseFallback(false);
      } else {
        setUseFallback(true);
      }
    } catch {
      setUseFallback(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleCountdownComplete = () => {
    // Re-fetch when a countdown reaches zero
    setTimeout(fetchAuctions, 2000);
  };

  const displayCount = useFallback ? FALLBACK_UPCOMING.length : auctions.length;

  return (
    <div className="auction-card overflow-hidden p-0 relative group h-full flex flex-col">
      {/* Top accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-[#14F195] via-[#9945FF] to-transparent" />

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-10 h-10 opacity-20 pointer-events-none z-20">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className="text-[#14F195]" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-10 h-10 opacity-20 pointer-events-none z-20">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className="text-[#9945FF]" />
        </svg>
      </div>

      {/* Header */}
      <div className="p-4 pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#14F195]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-heading font-bold text-text">
              {t('upcoming.title')}
            </h3>
          </div>
          <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 rounded-full border border-white/5 bg-white/5">
            {t('upcoming.queued', { count: displayCount })}
          </span>
        </div>
      </div>

      {/* Auction mini cards */}
      <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto relative z-10 scrollbar-thin">
        {/* API-driven cards */}
        {!useFallback && auctions.map((auction, idx) => {
          const gradient = GRADIENTS[idx % GRADIENTS.length];
          const isSoon = auction.started_at
            ? new Date(auction.started_at).getTime() - Date.now() < 15 * 60 * 1000
            : false;
          const statusColor = isSoon ? '#FFD700' : '#9945FF';
          const statusKey = isSoon ? 'startingSoon' : 'scheduled';

          return (
            <div
              key={auction.id}
              className={`
                relative rounded-lg border border-white/5 p-2.5
                bg-gradient-to-r ${gradient}
                hover:border-[#9945FF]/30 transition-all duration-300
                group/card cursor-pointer
              `}
            >
              {/* Top row: Prize + Status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <SolanaLogoSmall />
                  <span
                    className="text-sm font-bold font-mono"
                    style={{
                      background: 'linear-gradient(90deg, #14F195, #9945FF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {auction.prize_value} {auction.prize_token}
                  </span>
                </div>
                <span
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border flex items-center gap-1"
                  style={{
                    color: statusColor,
                    borderColor: `${statusColor}33`,
                    backgroundColor: `${statusColor}0D`,
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full animate-pulse"
                    style={{ backgroundColor: statusColor }}
                  />
                  {t(`upcoming.${statusKey}`)}
                </span>
              </div>

              {/* Bottom row: Countdown + discount */}
              <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                <div className="flex items-center gap-3">
                  {auction.started_at ? (
                    <AuctionCountdown
                      targetDate={auction.started_at}
                      size="sm"
                      onComplete={handleCountdownComplete}
                    />
                  ) : (
                    <span className="text-text-dim">{t('upcoming.scheduled', 'Scheduled')}</span>
                  )}
                </div>
                <span className="text-[#14F195]/70">
                  {t('upcoming.upTo', { discount: `${auction.max_discount_pct}%` })}
                </span>
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(153,69,255,0.05) 0%, transparent 70%)' }}
              />
            </div>
          );
        })}

        {/* Fallback static cards */}
        {useFallback && loaded && FALLBACK_UPCOMING.map((auction) => (
          <div
            key={auction.id}
            className={`
              relative rounded-lg border border-white/5 p-2.5
              bg-gradient-to-r ${auction.gradient}
              hover:border-[#9945FF]/30 transition-all duration-300
              group/card cursor-pointer
            `}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <SolanaLogoSmall />
                <span
                  className="text-sm font-bold font-mono"
                  style={{
                    background: 'linear-gradient(90deg, #14F195, #9945FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {auction.prize_description}
                </span>
              </div>
              <span
                className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border flex items-center gap-1"
                style={{
                  color: auction.statusColor,
                  borderColor: `${auction.statusColor}33`,
                  backgroundColor: `${auction.statusColor}0D`,
                }}
              >
                <span
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: auction.statusColor }}
                />
                {t(`upcoming.${auction.statusKey}`)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {auction.startsIn}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-text-dim" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z" />
                  </svg>
                  {auction.click_price}
                </span>
              </div>
              <span className="text-[#14F195]/70">
                {t('upcoming.upTo', { discount: `${auction.max_discount_pct}%` })}
              </span>
            </div>

            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(153,69,255,0.05) 0%, transparent 70%)' }}
            />
          </div>
        ))}

        {/* Loading state */}
        {!loaded && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#9945FF]/30 border-t-[#9945FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state (API returned empty and not using fallback) */}
        {loaded && !useFallback && auctions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-text-dim font-mono">{t('upcoming.noUpcoming', 'No upcoming auctions')}</p>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="border-t border-white/5 px-4 py-2.5 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text-dim font-mono">
            {t('upcoming.runsAllDay')}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-[#9945FF] font-mono">
            <span>{t('upcoming.viewAll')}</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
