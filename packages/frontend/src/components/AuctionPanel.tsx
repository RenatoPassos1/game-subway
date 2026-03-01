'use client';

import React, { useState } from 'react';
import { useAuction } from '../hooks/useAuction';
import { useWalletContext } from '../contexts/WalletContext';
import { updateAuctionPaymentTx } from '../utils/api';
import Timer from './Timer';
import ClickButton from './ClickButton';

// ---------- Constants ----------
const FOUNDER_WALLET = '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48';
const PLATFORM_FEE_PCT = 0.20; // 20% platform fee

// ---------- Helpers ----------
function truncateWallet(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    isEnded,
    isClosing,
  } = useAuction();
  const { walletAddress } = useWalletContext();
  const [sendingPayment, setSendingPayment] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);

  const showDemo = !auction;
  const isFounder = walletAddress?.toLowerCase() === FOUNDER_WALLET.toLowerCase();
  const auctionEnded = !showDemo && isEnded;

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

        {/* ===== Winner (when auction ended) ===== */}
        {auctionEnded && auction?.lastClick?.walletAddress && (
          <div className="px-2 py-2 rounded-lg border border-[#14F195]/20" style={{ background: 'rgba(20, 241, 149, 0.05)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#14F195]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.853m0 0l.009.262A7.454 7.454 0 019.497 14.25" />
                </svg>
                <span className="text-[10px] text-[#14F195] font-mono font-bold uppercase tracking-wider">Winner</span>
              </div>
              <span className="font-mono text-xs text-[#14F195] font-bold">
                {truncateWallet(auction.lastClick.walletAddress)}
              </span>
            </div>

            {/* Send Payment button - only visible to FOUNDER */}
            {isFounder && !paymentTxHash && !auction.paymentTxHash && (
              <button
                onClick={async () => {
                  if (!auction?.lastClick?.walletAddress || !auction?.id) return;
                  setSendingPayment(true);
                  try {
                    const w = window as any;
                    if (!w.ethereum) {
                      alert('MetaMask not found!');
                      return;
                    }
                    const netPrize = auction.prizeValue * (1 - PLATFORM_FEE_PCT);
                    // Convert to wei (18 decimals for BNB)
                    const amountWei = '0x' + BigInt(Math.floor(netPrize * 1e18)).toString(16);
                    const txHash = await w.ethereum.request({
                      method: 'eth_sendTransaction',
                      params: [{
                        from: walletAddress,
                        to: auction.lastClick.walletAddress,
                        value: amountWei,
                      }],
                    });
                    if (txHash) {
                      setPaymentTxHash(txHash);
                      // Save tx hash in backend
                      await updateAuctionPaymentTx(auction.id, txHash).catch(() => {});
                    }
                  } catch (err: any) {
                    if (err?.code !== 4001) { // user didn't reject
                      console.error('Payment error:', err);
                      alert('Payment failed: ' + (err?.message || 'Unknown error'));
                    }
                  } finally {
                    setSendingPayment(false);
                  }
                }}
                disabled={sendingPayment}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#14F195]/20 hover:bg-[#14F195]/30 border border-[#14F195]/30 text-[#14F195] text-xs font-mono font-bold transition-all disabled:opacity-50"
              >
                {sendingPayment ? (
                  <div className="w-4 h-4 border-2 border-[#14F195]/30 border-t-[#14F195] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
                Send Payment ({(auction.prizeValue * (1 - PLATFORM_FEE_PCT)).toFixed(4)} {auction.prizeToken})
              </button>
            )}

            {/* Payment TX Hash link */}
            {(paymentTxHash || auction.paymentTxHash) && (
              <a
                href={`https://bscscan.com/tx/${paymentTxHash || auction.paymentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#14F195]/70 hover:text-[#14F195] transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                TX: {truncateWallet(paymentTxHash || auction.paymentTxHash || '')}
              </a>
            )}
          </div>
        )}

        {/* ===== Sponsor Card ===== */}
        {auction?.sponsorImageUrl && (
          <div className="px-2 py-1.5 rounded-md border border-white/5" style={{ background: 'rgba(26, 26, 46, 0.3)' }}>
            <p className="text-[8px] text-text-dim font-mono uppercase tracking-wider mb-1 text-center">Sponsored by</p>
            <a
              href={auction.sponsorLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity"
            >
              <img
                src={auction.sponsorImageUrl}
                alt="Sponsor"
                className="h-8 mx-auto object-contain rounded"
                style={{ maxWidth: '140px' }}
              />
            </a>
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

      {/* ===== Audited Badge (top-left corner) ===== */}
      <div className="absolute top-3 left-3 z-20">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 backdrop-blur-sm">
          <svg className="w-3 h-3 text-[#14F195]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-[9px] font-mono font-bold text-[#14F195] tracking-wide">Audited</span>
        </div>
      </div>
    </div>
  );
}
