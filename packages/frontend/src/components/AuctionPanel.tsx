'use client';

import React from 'react';
import { useAuction } from '../hooks/useAuction';

// ---------- Helpers ----------
function truncateWallet(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

// ---------- Component ----------
export default function AuctionPanel() {
  const {
    auction,
    discountFormatted,
    statusLabel,
    statusColor,
    revenueProgress,
    minRevenueTarget,
    hasMetRevenue,
    isActive,
    isClosing,
  } = useAuction();

  if (!auction) {
    return (
      <div className="tech-card p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-48 mx-auto" />
          <div className="h-10 bg-white/10 rounded w-32 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-64 mx-auto" />
        </div>
        <p className="mt-6 text-text-muted text-sm">
          Waiting for the next auction...
        </p>
      </div>
    );
  }

  const revenuePercent = Math.round(revenueProgress * 100);

  return (
    <div className="tech-card overflow-hidden p-0">
      {/* Gradient top accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

      <div className="p-6 space-y-6">
        {/* Header: Prize + Status */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text font-heading">
              {auction.prizeDescription || 'Prize Auction'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold text-accent font-mono">
                {auction.prizeValue.toLocaleString()} {auction.prizeToken}
              </span>
            </div>
          </div>
          <span
            className={`${statusColor} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white font-mono`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Discount Display */}
        <div className="text-center py-4">
          <p className="mono-label mb-1">
            Current Discount
          </p>
          <div className="relative inline-block">
            <span
              className={`text-6xl font-black tabular-nums font-mono ${
                isActive || isClosing
                  ? 'gradient-text'
                  : 'text-text/40'
              }`}
            >
              {discountFormatted}%
            </span>
          </div>
          <p className="text-xs text-text-dim mt-1 font-mono">
            Max {(auction.maxDiscountPct * 100).toFixed(0)}% discount
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Click Count */}
          <div className="kpi-card text-center">
            <p className="mono-label mb-1">
              Total Clicks
            </p>
            <p className="text-2xl font-bold text-text tabular-nums font-mono">
              {auction.clickCount.toLocaleString()}
            </p>
          </div>

          {/* Revenue */}
          <div className="kpi-card text-center">
            <p className="mono-label mb-1">
              Revenue
            </p>
            <p className="text-2xl font-bold text-text tabular-nums font-mono">
              ${auction.revenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Revenue Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-muted">Revenue Progress</span>
            <span className="text-xs text-text-muted font-mono">
              {revenuePercent}% of ${minRevenueTarget.toFixed(0)}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                hasMetRevenue
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : 'bg-gradient-primary'
              }`}
              style={{ width: `${Math.min(100, revenuePercent)}%` }}
            />
          </div>
          {hasMetRevenue && (
            <p className="text-xs text-green-400 mt-1 text-right font-mono">
              Minimum revenue reached
            </p>
          )}
        </div>

        {/* Last Clicker */}
        {auction.lastClick && (
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-text-muted">Last Click</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-secondary">
                {truncateWallet(auction.lastClick.walletAddress)}
              </p>
              <p className="text-xs text-text-dim font-mono">
                Click #{auction.lastClick.clickNumber} &middot;{' '}
                {timeAgo(auction.lastClick.timestamp)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
