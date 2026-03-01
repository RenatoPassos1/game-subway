'use client';

import React from 'react';
import { useAuction } from '../hooks/useAuction';
import Timer from './Timer';
import ClickButton from './ClickButton';

// ---------- Helpers ----------
function truncateWallet(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ---------- Solana Logo SVG ----------
function SolanaLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397.7 311.7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <linearGradient id="sol-a" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-a)" />
      <linearGradient id="sol-b" x1="264.829" y1="401.601" x2="45.163" y2="-19.148" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-b)" />
      <linearGradient id="sol-c" x1="312.548" y1="376.688" x2="92.882" y2="-44.061" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-c)" />
    </svg>
  );
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

  const showDemo = !auction;

  const prizeValue = auction?.prizeValue ?? 1;
  const prizeToken = auction?.prizeToken ?? 'SOL';
  const clickCount = auction?.clickCount ?? 1247;
  const revenue = auction?.revenue ?? 124.70;
  const maxDiscountPct = auction ? auction.maxDiscountPct * 100 : 90;
  const discount = showDemo ? '42.5' : discountFormatted;
  const demoRevenueProgress = showDemo ? 0.65 : revenueProgress;
  const revenuePercent = Math.round(demoRevenueProgress * 100);
  const demoMinRevenue = showDemo ? 1.2 : minRevenueTarget;
  const demoHasMetRevenue = showDemo ? false : hasMetRevenue;
  const demoStatusLabel = showDemo ? 'Active' : statusLabel;
  const demoStatusColor = showDemo ? 'bg-green-500' : statusColor;
  const demoIsActive = showDemo ? true : (isActive || isClosing);
  const lastClick = auction?.lastClick ?? (showDemo ? {
    walletAddress: '7a3F9e2B4c1D',
    clickNumber: 1247,
    timestamp: Date.now() - 3000,
  } : null);

  return (
    <div className="auction-card overflow-hidden p-0 relative group h-full flex flex-col">
      {/* Top accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#9945FF] to-[#14F195]" />

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-12 h-12 opacity-20 pointer-events-none z-20">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className="text-[#9945FF]" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-12 h-12 opacity-20 pointer-events-none z-20">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className="text-[#14F195]" />
        </svg>
      </div>

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none transition-opacity duration-500 group-hover:opacity-10"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #9945FF 0%, transparent 70%)' }}
      />

      {/* ===== TOP: Auction Info (compact) ===== */}
      <div className="p-4 space-y-3 relative z-10 flex-1">
        {/* Header: Prize + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-[-2px] rounded-full border border-[#14F195]/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="w-9 h-9 rounded-full bg-[#9945FF]/10 border border-[#9945FF]/20 flex items-center justify-center">
                <SolanaLogo className="w-5 h-5" />
              </div>
            </div>
            <span
              className="text-xl font-extrabold font-mono"
              style={{
                background: 'linear-gradient(90deg, #14F195 0%, #9945FF 50%, #14F195 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'prizeShimmer 3s ease-in-out infinite',
              }}
            >
              {prizeValue} {prizeToken}
            </span>
          </div>
          <span className={`auction-status-badge ${demoStatusColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {demoStatusLabel}
          </span>
        </div>

        {/* Discount + Stats Row */}
        <div className="flex items-stretch gap-2">
          {/* Discount */}
          <div className="flex-1 text-center py-2 rounded-lg border border-white/5" style={{ background: 'rgba(153, 69, 255, 0.04)' }}>
            <p className="text-[9px] text-[#9945FF]/70 font-mono uppercase tracking-wider mb-0.5">Discount</p>
            <span
              className={`text-2xl font-black tabular-nums font-mono ${demoIsActive ? '' : 'text-text/40'}`}
              style={
                demoIsActive
                  ? {
                      background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }
                  : undefined
              }
            >
              {discount}%
            </span>
            <p className="text-[8px] text-text-dim font-mono">max {maxDiscountPct.toFixed(0)}%</p>
          </div>

          {/* Clicks */}
          <div className="flex-1 text-center py-2 rounded-lg border border-white/5" style={{ background: 'rgba(153, 69, 255, 0.04)' }}>
            <p className="text-[9px] text-[#9945FF]/70 font-mono uppercase tracking-wider mb-0.5">Clicks</p>
            <p className="text-2xl font-bold text-text tabular-nums font-mono">
              {clickCount.toLocaleString()}
            </p>
            <p className="text-[8px] text-text-dim font-mono">${revenue.toFixed(2)} rev</p>
          </div>
        </div>

        {/* Revenue Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-text-muted font-mono uppercase">Revenue</span>
            <span className="text-[9px] text-text-muted font-mono">
              {revenuePercent}% of ${demoMinRevenue.toFixed(2)}
            </span>
          </div>
          <div className="auction-progress-track">
            <div
              className={`auction-progress-bar ${
                demoHasMetRevenue
                  ? 'bg-gradient-to-r from-[#14F195] to-[#00E676]'
                  : 'bg-gradient-to-r from-[#9945FF] to-[#14F195]'
              }`}
              style={{ width: `${Math.min(100, revenuePercent)}%` }}
            />
          </div>
          {demoHasMetRevenue && (
            <p className="text-[9px] text-[#14F195] mt-0.5 text-right font-mono flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
              Revenue reached
            </p>
          )}
        </div>

        {/* Last Clicker */}
        {lastClick && (
          <div className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-md border border-white/5" style={{ background: 'rgba(26, 26, 46, 0.3)' }}>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[#14F195] animate-ping opacity-50" />
              </div>
              <span className="text-text-muted font-mono">Last</span>
            </div>
            <span className="font-mono text-[#14F195]">
              {truncateWallet(lastClick.walletAddress)} &middot; #{lastClick.clickNumber}
            </span>
          </div>
        )}
      </div>

      {/* ===== BOTTOM: Click Button (left) + Timer (right) ===== */}
      <div className="border-t border-white/5 px-4 py-3 relative z-10">
        <div className="flex items-center justify-center gap-5">
          <ClickButton />
          <Timer />
        </div>
      </div>
    </div>
  );
}
