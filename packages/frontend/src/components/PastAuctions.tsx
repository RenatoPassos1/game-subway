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

export default function PastAuctions({ isOpen, onClose }: PastAuctionsProps) {
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await getPastAuctions(p, 10);
      setAuctions(res.data);
      // API returns { data, page, limit } - derive pagination from data length
      setTotalPages(res.data.length < 10 ? p : p + 1);
      setTotal(0); // total not provided by API
      setPage(res.page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPage(1);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchPage]);

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
  const totalAuctions = total;
  const avgDiscount = auctions.length > 0
    ? (auctions.reduce((sum, a) => sum + (a.final_discount ?? 0), 0) / auctions.length).toFixed(1)
    : '0';

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
              {t('pastAuctions.subtitle', 'Browse completed auction history')}
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
            <p className="font-mono text-lg font-bold text-text">{totalAuctions}</p>
            <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
              {t('pastAuctions.totalAuctions', 'Total Auctions')}
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-[#14F195]">
              {auctions.reduce((s, a) => s + a.prize_value, 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
              {t('pastAuctions.totalPrizes', 'Prizes Awarded')}
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

          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">{t('pastAuctions.error', 'Failed to load auctions')}</p>
              <button
                onClick={() => fetchPage(page)}
                className="mt-3 text-xs text-primary hover:text-primary-light transition-colors font-mono"
              >
                {t('pastAuctions.retry', 'Retry')}
              </button>
            </div>
          )}

          {!loading && !error && auctions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">{t('pastAuctions.empty', 'No past auctions found')}</p>
            </div>
          )}

          {!loading && !error && auctions.map((auction) => (
            <div
              key={auction.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-surface-light/20 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
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
                    {abbreviateWallet(auction.winner_id)}
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

                {/* Clicks */}
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    {t('pastAuctions.clicks', 'Clicks')}
                  </p>
                  <p className="font-mono text-xs text-text-muted">{auction.click_count}</p>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page <= 1 || loading}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-text-muted hover:text-text hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('pastAuctions.prev', 'Previous')}
            </button>
            <span className="text-xs font-mono text-text-dim">
              {t('pastAuctions.pageOf', 'Page {{page}} of {{pages}}', { page, pages: totalPages })}
            </span>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-text-muted hover:text-text hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t('pastAuctions.next', 'Next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
