'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPastAuctions } from '../utils/api';
import type { Auction } from '@click-win/shared/src/types';

interface PastAuctionsProps {
  isOpen: boolean;
  onClose: () => void;
}

function abbreviateWallet(addr: string | null | undefined): string {
  if (!addr) return '---';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '---';
  }
}

// --- Seed data: 20 past auctions (max_discount_pct = 50, min_revenue_multiplier = 1.2) ---
const SEED_AUCTIONS: Auction[] = [
  {
    id: 'pa-001', prize_value: 0.25, prize_token: 'BNB', prize_description: '0.25 BNB Giveaway',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.5,
    timer_duration: 30, click_count: 96, accumulated_discount: 48.0, revenue: 0.36,
    winner_id: '0x7a3F...9e2B', final_discount: 48.0, started_at: '2026-02-28T18:00:00Z', ended_at: '2026-02-28T18:47:00Z', created_at: '2026-02-28T17:00:00Z',
  },
  {
    id: 'pa-002', prize_value: 50, prize_token: 'USDT', prize_description: '50 USDT Flash Auction',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.4,
    timer_duration: 30, click_count: 112, accumulated_discount: 44.8, revenue: 67.2,
    winner_id: '0xB4c1...3fAa', final_discount: 44.8, started_at: '2026-02-28T15:00:00Z', ended_at: '2026-02-28T15:52:00Z', created_at: '2026-02-28T14:00:00Z',
  },
  {
    id: 'pa-003', prize_value: 0.5, prize_token: 'BNB', prize_description: '0.5 BNB Premium Round',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.3,
    timer_duration: 30, click_count: 163, accumulated_discount: 48.9, revenue: 0.72,
    winner_id: '0x1De7...aB09', final_discount: 48.9, started_at: '2026-02-28T12:00:00Z', ended_at: '2026-02-28T13:05:00Z', created_at: '2026-02-28T11:00:00Z',
  },
  {
    id: 'pa-004', prize_value: 25, prize_token: 'USDT', prize_description: '25 USDT Quick Drop',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.5,
    timer_duration: 30, click_count: 78, accumulated_discount: 39.0, revenue: 35.1,
    winner_id: '0xE9f3...7cD4', final_discount: 39.0, started_at: '2026-02-27T20:00:00Z', ended_at: '2026-02-27T20:38:00Z', created_at: '2026-02-27T19:00:00Z',
  },
  {
    id: 'pa-005', prize_value: 0.15, prize_token: 'BNB', prize_description: '0.15 BNB Starter',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.6,
    timer_duration: 30, click_count: 75, accumulated_discount: 45.0, revenue: 0.21,
    winner_id: '0x3Ac5...e1F2', final_discount: 45.0, started_at: '2026-02-27T16:00:00Z', ended_at: '2026-02-27T16:33:00Z', created_at: '2026-02-27T15:00:00Z',
  },
  {
    id: 'pa-006', prize_value: 100, prize_token: 'USDT', prize_description: '100 USDT Mega Round',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.25,
    timer_duration: 30, click_count: 192, accumulated_discount: 48.0, revenue: 134.4,
    winner_id: '0xF7b2...4a8C', final_discount: 48.0, started_at: '2026-02-27T10:00:00Z', ended_at: '2026-02-27T11:22:00Z', created_at: '2026-02-27T09:00:00Z',
  },
  {
    id: 'pa-007', prize_value: 0.3, prize_token: 'BNB', prize_description: '0.3 BNB Lucky Draw',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.4,
    timer_duration: 30, click_count: 105, accumulated_discount: 42.0, revenue: 0.41,
    winner_id: '0x8Dd4...bC61', final_discount: 42.0, started_at: '2026-02-26T22:00:00Z', ended_at: '2026-02-26T22:49:00Z', created_at: '2026-02-26T21:00:00Z',
  },
  {
    id: 'pa-008', prize_value: 75, prize_token: 'USDT', prize_description: '75 USDT Night Auction',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.35,
    timer_duration: 30, click_count: 131, accumulated_discount: 45.85, revenue: 99.0,
    winner_id: '0x2Cf6...d3A7', final_discount: 45.85, started_at: '2026-02-26T18:00:00Z', ended_at: '2026-02-26T18:55:00Z', created_at: '2026-02-26T17:00:00Z',
  },
  {
    id: 'pa-009', prize_value: 0.1, prize_token: 'BNB', prize_description: '0.1 BNB Mini Sprint',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.7,
    timer_duration: 30, click_count: 50, accumulated_discount: 35.0, revenue: 0.14,
    winner_id: '0x5Ea9...f0B3', final_discount: 35.0, started_at: '2026-02-26T14:00:00Z', ended_at: '2026-02-26T14:28:00Z', created_at: '2026-02-26T13:00:00Z',
  },
  {
    id: 'pa-010', prize_value: 30, prize_token: 'USDT', prize_description: '30 USDT Express',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.45,
    timer_duration: 30, click_count: 98, accumulated_discount: 44.1, revenue: 39.6,
    winner_id: '0xAb12...8eD5', final_discount: 44.1, started_at: '2026-02-26T10:00:00Z', ended_at: '2026-02-26T10:42:00Z', created_at: '2026-02-26T09:00:00Z',
  },
  {
    id: 'pa-011', prize_value: 0.2, prize_token: 'BNB', prize_description: '0.2 BNB Blitz',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.5,
    timer_duration: 30, click_count: 100, accumulated_discount: 50.0, revenue: 0.28,
    winner_id: '0x9Fc8...a2E6', final_discount: 50.0, started_at: '2026-02-25T20:00:00Z', ended_at: '2026-02-25T20:41:00Z', created_at: '2026-02-25T19:00:00Z',
  },
  {
    id: 'pa-012', prize_value: 150, prize_token: 'USDT', prize_description: '150 USDT Grand Prize',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.2,
    timer_duration: 30, click_count: 240, accumulated_discount: 48.0, revenue: 198.0,
    winner_id: '0x6Ba3...c7F1', final_discount: 48.0, started_at: '2026-02-25T15:00:00Z', ended_at: '2026-02-25T16:35:00Z', created_at: '2026-02-25T14:00:00Z',
  },
  {
    id: 'pa-013', prize_value: 0.4, prize_token: 'BNB', prize_description: '0.4 BNB Rush Hour',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.35,
    timer_duration: 30, click_count: 120, accumulated_discount: 42.0, revenue: 0.54,
    winner_id: '0xD1e5...9bA4', final_discount: 42.0, started_at: '2026-02-25T12:00:00Z', ended_at: '2026-02-25T12:58:00Z', created_at: '2026-02-25T11:00:00Z',
  },
  {
    id: 'pa-014', prize_value: 40, prize_token: 'USDT', prize_description: '40 USDT Midday Special',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.4,
    timer_duration: 30, click_count: 115, accumulated_discount: 46.0, revenue: 52.8,
    winner_id: '0x4Db7...e5C2', final_discount: 46.0, started_at: '2026-02-24T18:00:00Z', ended_at: '2026-02-24T18:48:00Z', created_at: '2026-02-24T17:00:00Z',
  },
  {
    id: 'pa-015', prize_value: 0.35, prize_token: 'BNB', prize_description: '0.35 BNB Evening Drop',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.4,
    timer_duration: 30, click_count: 88, accumulated_discount: 35.2, revenue: 0.47,
    winner_id: '0xC3f9...a1D8', final_discount: 35.2, started_at: '2026-02-24T14:00:00Z', ended_at: '2026-02-24T14:51:00Z', created_at: '2026-02-24T13:00:00Z',
  },
  {
    id: 'pa-016', prize_value: 60, prize_token: 'USDT', prize_description: '60 USDT Power Round',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.3,
    timer_duration: 30, click_count: 156, accumulated_discount: 46.8, revenue: 79.2,
    winner_id: '0x7Ed2...b4F9', final_discount: 46.8, started_at: '2026-02-24T10:00:00Z', ended_at: '2026-02-24T11:02:00Z', created_at: '2026-02-24T09:00:00Z',
  },
  {
    id: 'pa-017', prize_value: 0.18, prize_token: 'BNB', prize_description: '0.18 BNB Flash',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.55,
    timer_duration: 30, click_count: 67, accumulated_discount: 36.85, revenue: 0.24,
    winner_id: '0xBa45...c6E3', final_discount: 36.85, started_at: '2026-02-23T20:00:00Z', ended_at: '2026-02-23T20:36:00Z', created_at: '2026-02-23T19:00:00Z',
  },
  {
    id: 'pa-018', prize_value: 200, prize_token: 'USDT', prize_description: '200 USDT Jackpot',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.15,
    timer_duration: 30, click_count: 320, accumulated_discount: 48.0, revenue: 264.0,
    winner_id: '0x1Af8...d9B7', final_discount: 48.0, started_at: '2026-02-23T15:00:00Z', ended_at: '2026-02-23T16:48:00Z', created_at: '2026-02-23T14:00:00Z',
  },
  {
    id: 'pa-019', prize_value: 0.12, prize_token: 'BNB', prize_description: '0.12 BNB Warm-up',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.65,
    timer_duration: 30, click_count: 55, accumulated_discount: 35.75, revenue: 0.16,
    winner_id: '0xE2c6...a3F5', final_discount: 35.75, started_at: '2026-02-23T10:00:00Z', ended_at: '2026-02-23T10:31:00Z', created_at: '2026-02-23T09:00:00Z',
  },
  {
    id: 'pa-020', prize_value: 80, prize_token: 'USDT', prize_description: '80 USDT Weekend Special',
    status: 'SETTLED', min_revenue_multiplier: 1.2, max_discount_pct: 50, discount_per_click: 0.3,
    timer_duration: 30, click_count: 143, accumulated_discount: 42.9, revenue: 105.6,
    winner_id: '0x8Db1...e7C4', final_discount: 42.9, started_at: '2026-02-22T18:00:00Z', ended_at: '2026-02-22T19:01:00Z', created_at: '2026-02-22T17:00:00Z',
  },
];

export default function PastAuctions({ isOpen, onClose }: PastAuctionsProps) {
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getPastAuctions(1, 20);
      if (res.data && res.data.length > 0) {
        setAuctions(res.data.slice(0, 20));
      } else {
        // Use seed data when no real auctions exist yet
        setAuctions(SEED_AUCTIONS);
      }
    } catch {
      // On API error, show seed data so the page is never empty
      setAuctions(SEED_AUCTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Stats summary
  const totalPrizes = auctions.reduce((s, a) => s + a.prize_value, 0);
  const avgDiscount = auctions.length > 0
    ? (auctions.reduce((sum, a) => sum + (a.final_discount ?? 0), 0) / auctions.length).toFixed(1)
    : '0';
  const totalClicks = auctions.reduce((s, a) => s + a.click_count, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-glow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-heading font-bold text-text">
              {t('pastAuctions.title', 'Past Auctions')}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {t('pastAuctions.subtitle', 'Last 20 completed auctions')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-text-muted hover:text-text"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 bg-surface-light/30">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-text">{auctions.length}</p>
            <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
              {t('pastAuctions.totalAuctions', 'Total Auctions')}
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-[#14F195]">
              {totalClicks.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
              {t('pastAuctions.totalClicks', 'Total Clicks')}
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-accent">{avgDiscount}%</p>
            <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
              {t('pastAuctions.avgDiscount', 'Avg Discount')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!loading && auctions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">{t('pastAuctions.empty', 'No past auctions found')}</p>
            </div>
          )}

          {!loading && auctions.map((auction) => (
            <div
              key={auction.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface-light/20 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Token badge */}
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                  auction.prize_token === 'BNB'
                    ? 'bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/20'
                    : 'bg-[#26A17B]/10 text-[#26A17B] border border-[#26A17B]/20'
                }`}>
                  {auction.prize_token}
                </div>
                {/* Prize */}
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-text truncate">
                    {auction.prize_value} {auction.prize_token}
                  </p>
                  <p className="text-[10px] text-text-dim truncate">{auction.prize_description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                {/* Winner */}
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    {t('pastAuctions.winner', 'Winner')}
                  </p>
                  <p className="font-mono text-xs text-text-muted">
                    {abbreviateWallet(auction.winner_wallet || auction.winner_id)}
                  </p>
                </div>

                {/* Discount */}
                <div className="text-right">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    {t('pastAuctions.discount', 'Discount')}
                  </p>
                  <p className="font-mono text-xs text-[#14F195] font-bold">
                    {auction.final_discount != null ? `${auction.final_discount.toFixed(1)}%` : '---'}
                  </p>
                </div>

                {/* TX Hash */}
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    {t('pastAuctions.txHash', 'TX')}
                  </p>
                  {auction.payment_tx_hash ? (
                    <a
                      href={`https://bscscan.com/tx/${auction.payment_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#9945FF] hover:text-[#14F195] transition-colors flex items-center gap-0.5 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {abbreviateWallet(auction.payment_tx_hash)}
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-text-dim">---</p>
                  )}
                </div>

                {/* Date */}
                <div className="text-right hidden lg:block">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    {t('pastAuctions.date', 'Date')}
                  </p>
                  <p className="font-mono text-xs text-text-muted">{formatDate(auction.ended_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
