'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getReferralStats, getReferralHistory } from '../utils/api';
import type { ReferralStats, ReferralHistoryEntry } from '@click-win/shared/src/types';
import { REFERRAL_BONUS_PCT } from '@click-win/shared/src/constants';

// ---------- Helpers ----------
function truncateWallet(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type SortKey = 'createdAt' | 'clicksEarned' | 'depositAmount';
type SortDir = 'asc' | 'desc';

export default function ReferralDashboard() {
  const { isAuthenticated } = useAuthContext();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);

    Promise.all([
      getReferralStats().catch(() => null),
      getReferralHistory(page).catch(() => ({
        data: [],
        total: 0,
        page: 1,
        pages: 1,
      })),
    ]).then(([statsData, historyData]) => {
      if (statsData) setStats(statsData);
      setHistory(historyData.data);
      setTotalPages(historyData.pages);
      setIsLoading(false);
    });
  }, [isAuthenticated, page]);

  // Sort handler
  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey]
  );

  // Sorted history
  const sortedHistory = [...history].sort((a, b) => {
    let valA: number;
    let valB: number;

    switch (sortKey) {
      case 'createdAt':
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
      case 'clicksEarned':
        valA = a.clicksEarned;
        valB = b.clicksEarned;
        break;
      case 'depositAmount':
        valA = a.depositAmount;
        valB = b.depositAmount;
        break;
      default:
        return 0;
    }

    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span className={`ml-1 inline-block ${active ? 'text-[#00D2FF]' : 'text-[#E0E0FF]/20'}`}>
      {active && dir === 'asc' ? '\u2191' : '\u2193'}
    </span>
  );

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
        <p className="text-[#E0E0FF]/50">Sign in to view your referral dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <p className="text-xs text-[#E0E0FF]/50 uppercase tracking-wider mb-1">
            Total Referrals
          </p>
          <p className="text-3xl font-black text-[#E0E0FF] tabular-nums">
            {stats?.totalReferred ?? 0}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <p className="text-xs text-[#E0E0FF]/50 uppercase tracking-wider mb-1">
            Total Clicks Earned
          </p>
          <p className="text-3xl font-black text-[#FFD700] tabular-nums">
            {stats?.totalClicksEarned ?? 0}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <p className="text-xs text-[#E0E0FF]/50 uppercase tracking-wider mb-1">
            Pending Bonuses
          </p>
          <p className="text-3xl font-black text-[#6C5CE7] tabular-nums">
            {stats?.pendingBonuses ?? 0}
          </p>
        </div>
      </div>

      {/* Earnings Chart Placeholder */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <h3 className="text-sm font-semibold text-[#E0E0FF]/70 mb-4">
          Earnings Over Time
        </h3>
        <div className="h-40 flex items-end justify-between gap-1 px-2">
          {/* Simplified bar chart placeholder showing last 12 periods */}
          {Array.from({ length: 12 }).map((_, i) => {
            const height = Math.max(
              8,
              Math.random() * 100 * (stats?.totalClicksEarned ? 1 : 0.1)
            );
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-[#6C5CE7] to-[#00D2FF] rounded-t-sm opacity-60 transition-all duration-500"
                  style={{
                    height: `${stats?.totalClicksEarned ? height : 8}%`,
                    minHeight: 4,
                  }}
                />
                <span className="text-[9px] text-[#E0E0FF]/20">{i + 1}</span>
              </div>
            );
          })}
        </div>
        {!stats?.totalClicksEarned && (
          <p className="text-center text-xs text-[#E0E0FF]/30 mt-2">
            Chart data will populate as you earn referral bonuses.
          </p>
        )}
      </div>

      {/* Earnings History Table */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-semibold text-[#E0E0FF]/70">
            Earnings History
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#6C5CE7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#E0E0FF]/30">
            No referral earnings yet. Share your link to start earning!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#E0E0FF]/40 uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Referred Wallet</th>
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-[#E0E0FF]/60"
                      onClick={() => handleSort('depositAmount')}
                    >
                      Deposit
                      <SortIcon
                        active={sortKey === 'depositAmount'}
                        dir={sortDir}
                      />
                    </th>
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-[#E0E0FF]/60"
                      onClick={() => handleSort('clicksEarned')}
                    >
                      Clicks Earned
                      <SortIcon
                        active={sortKey === 'clicksEarned'}
                        dir={sortDir}
                      />
                    </th>
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-[#E0E0FF]/60"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date
                      <SortIcon
                        active={sortKey === 'createdAt'}
                        dir={sortDir}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-[#00D2FF]">
                        {truncateWallet(entry.referredWallet)}
                      </td>
                      <td className="px-5 py-3 text-[#E0E0FF]">
                        {entry.depositAmount.toFixed(2)} {entry.depositToken}
                      </td>
                      <td className="px-5 py-3 text-[#FFD700] font-semibold tabular-nums">
                        +{entry.clicksEarned}
                      </td>
                      <td className="px-5 py-3 text-[#E0E0FF]/50">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-[#E0E0FF]/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-[#E0E0FF]/40">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-[#E0E0FF]/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* How Referrals Work */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-[#E0E0FF] mb-4">
          How Referrals Work
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#6C5CE7]">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E0E0FF]">
                Share Your Link
              </p>
              <p className="text-xs text-[#E0E0FF]/50 mt-1">
                Send your unique referral link to friends and crypto communities.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00D2FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#00D2FF]">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E0E0FF]">
                They Deposit
              </p>
              <p className="text-xs text-[#E0E0FF]/50 mt-1">
                When your referred user makes their first deposit, you both benefit.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#FFD700]">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E0E0FF]">
                Earn {(REFERRAL_BONUS_PCT * 100).toFixed(0)}% Bonus
              </p>
              <p className="text-xs text-[#E0E0FF]/50 mt-1">
                You receive {(REFERRAL_BONUS_PCT * 100).toFixed(0)}% of their first deposit in free
                clicks, automatically credited to your balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
