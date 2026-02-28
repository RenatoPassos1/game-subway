'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getDepositAddress } from '../utils/api';
import { PRICE_PER_CLICK, MIN_DEPOSIT_AMOUNT } from '@click-win/shared/src/constants';
import type { DepositAddress } from '@click-win/shared/src/types';

// ---------- Simple QR code using inline SVG ----------
// Generates a basic visual representation; for production you'd use qrcode.react.
// We'll render a data-uri QR via the canvas API as a fallback.

function QRPlaceholder({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    // Try dynamic import of qrcode library if available
    // Fallback to a styled address display
    async function generateQR() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const QRCode = (await import('qrcode')) as any;
        const url = await QRCode.toDataURL(value, {
          width: 180,
          margin: 2,
          color: { dark: '#E0E0FF', light: '#00000000' },
        });
        setDataUrl(url);
      } catch {
        // qrcode not available, show placeholder
        setDataUrl('');
      }
    }
    generateQR();
  }, [value]);

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt="Deposit address QR code"
        className="w-44 h-44 rounded-lg bg-white/5 p-2"
      />
    );
  }

  // Styled fallback
  return (
    <div className="w-44 h-44 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-3">
      <div className="grid grid-cols-8 gap-[2px]">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={`w-[4px] h-[4px] rounded-[1px] ${
              // Pseudo-random pattern based on address chars
              value.charCodeAt(i % value.length) % 3 === 0
                ? 'bg-[#6C5CE7]'
                : value.charCodeAt(i % value.length) % 3 === 1
                ? 'bg-[#00D2FF]'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Token selector ----------
type DepositToken = 'USDT' | 'BNB';

export default function DepositPanel() {
  const { user, isAuthenticated, refreshBalance } = useAuthContext();
  const [depositAddr, setDepositAddr] = useState<DepositAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<DepositToken>('USDT');
  const [usdtAmount, setUsdtAmount] = useState('10');
  const [copied, setCopied] = useState(false);

  // Calculate clicks from USDT amount
  const clicksForAmount = useMemo(() => {
    const amount = parseFloat(usdtAmount);
    if (isNaN(amount) || amount < MIN_DEPOSIT_AMOUNT) return 0;
    return Math.floor(amount / PRICE_PER_CLICK);
  }, [usdtAmount]);

  // Fetch deposit address
  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    getDepositAddress()
      .then((addr) => setDepositAddr(addr))
      .catch((err) => setError(err.message ?? 'Failed to load deposit address'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const handleCopy = useCallback(async () => {
    if (!depositAddr) return;
    try {
      await navigator.clipboard.writeText(depositAddr.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = depositAddr.address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [depositAddr]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
        <p className="text-[#E0E0FF]/50">Connect your wallet and sign in to deposit.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#FFD700] via-[#6C5CE7] to-[#FFD700]" />

      <div className="p-6 space-y-6">
        <h2 className="text-xl font-bold text-[#E0E0FF]">Deposit & Buy Clicks</h2>

        {/* Current Balance */}
        <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-[#E0E0FF]/60">Your Click Balance</span>
          <span className="text-2xl font-bold text-[#FFD700] tabular-nums">
            {user?.clickBalance ?? 0}
          </span>
        </div>

        {/* Network Info */}
        <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 text-yellow-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-yellow-300">
            Send only on <strong>BNB Smart Chain (BSC)</strong>. Other networks will result in loss of funds.
          </span>
        </div>

        {/* Token Selector */}
        <div>
          <label className="text-xs text-[#E0E0FF]/50 uppercase tracking-wider mb-2 block">
            Select Token
          </label>
          <div className="flex gap-2">
            {(['USDT', 'BNB'] as DepositToken[]).map((token) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  selectedToken === token
                    ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white'
                    : 'bg-white/5 text-[#E0E0FF]/60 hover:bg-white/10'
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Address + QR */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#6C5CE7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 rounded-lg p-3 text-sm text-red-300">
            {error}
          </div>
        ) : depositAddr ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <QRPlaceholder value={depositAddr.address} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={depositAddr.address}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-[#00D2FF] truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  copied
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-white/10 text-[#E0E0FF] hover:bg-white/20'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Click Calculator */}
        <div>
          <label className="text-xs text-[#E0E0FF]/50 uppercase tracking-wider mb-2 block">
            Click Calculator
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min={MIN_DEPOSIT_AMOUNT}
                step="1"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-14 text-[#E0E0FF] focus:outline-none focus:border-[#6C5CE7]/50"
                placeholder="Amount"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#E0E0FF]/40">
                USDT
              </span>
            </div>
            <span className="text-[#E0E0FF]/30">=</span>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 min-w-[100px] text-center">
              <span className="text-lg font-bold text-[#FFD700] tabular-nums">
                {clicksForAmount}
              </span>
              <span className="text-xs text-[#E0E0FF]/40 ml-1">clicks</span>
            </div>
          </div>
          <p className="text-xs text-[#E0E0FF]/30 mt-1">
            1 click = ${PRICE_PER_CLICK.toFixed(2)} USDT &middot; Min deposit: ${MIN_DEPOSIT_AMOUNT} USDT
          </p>
        </div>

        {/* Recent Deposits placeholder */}
        <div>
          <h3 className="text-sm font-semibold text-[#E0E0FF]/70 mb-2">
            Recent Deposits
          </h3>
          <div className="bg-white/5 rounded-lg p-4 text-center text-sm text-[#E0E0FF]/30">
            Your deposit history will appear here once you make your first deposit.
          </div>
        </div>
      </div>
    </div>
  );
}
