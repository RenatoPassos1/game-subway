'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../contexts/AuthContext';
import { getDepositAddress } from '../utils/api';
import { PRICE_PER_CLICK, MIN_DEPOSIT_AMOUNT } from '@click-win/shared/src/constants';
import type { DepositAddress } from '@click-win/shared/src/types';

// ---------- Compact QR code ----------
function QRCode({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    async function generateQR() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const QRCode = (await import('qrcode')) as any;
        const url = await QRCode.toDataURL(value, {
          width: 140,
          margin: 2,
          color: { dark: '#E0E0FF', light: '#00000000' },
        });
        setDataUrl(url);
      } catch {
        setDataUrl('');
      }
    }
    generateQR();
  }, [value]);

  if (!dataUrl) {
    return (
      <div className="w-28 h-28 rounded-lg bg-white/5 border border-secondary/20 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      className="w-28 h-28 rounded-lg bg-white/5 p-1.5 border border-secondary/20"
    />
  );
}

// ---------- Token selector ----------
type DepositToken = 'USDT' | 'BNB';

export default function DepositPanel() {
  const { t } = useTranslation();
  const { user, isAuthenticated, refreshBalance } = useAuthContext();
  const [depositAddr, setDepositAddr] = useState<DepositAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<DepositToken>('USDT');
  const [usdtAmount, setUsdtAmount] = useState('10');
  const [copied, setCopied] = useState(false);
  const [balanceAnimated, setBalanceAnimated] = useState(false);

  const clicksForAmount = useMemo(() => {
    const amount = parseFloat(usdtAmount);
    if (isNaN(amount) || amount < MIN_DEPOSIT_AMOUNT) return 0;
    return Math.floor(amount / PRICE_PER_CLICK);
  }, [usdtAmount]);

  const prevBalance = React.useRef(user?.clickBalance ?? 0);
  useEffect(() => {
    const current = user?.clickBalance ?? 0;
    if (current !== prevBalance.current && prevBalance.current !== 0) {
      setBalanceAnimated(true);
      setTimeout(() => setBalanceAnimated(false), 600);
    }
    prevBalance.current = current;
  }, [user?.clickBalance]);

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
      <div className="tech-card p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">Connect your wallet to deposit.</p>
      </div>
    );
  }

  return (
    <div className="tech-card overflow-hidden p-0 h-full flex flex-col relative group">
      {/* Top accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-secondary" />

      {/* Subtle corner decorations */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M64 0v16h-2V2H48V0h16z" fill="currentColor" className="text-primary" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 opacity-20 pointer-events-none">
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path d="M0 64v-16h2v14h14v2H0z" fill="currentColor" className="text-secondary" />
        </svg>
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Header + Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-text font-heading">Deposit</h2>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300 ${
            balanceAnimated ? 'bg-accent/15 ring-1 ring-accent/30 scale-105' : 'bg-white/5'
          }`}>
            <span className="text-[10px] text-text-muted font-mono uppercase">Clicks</span>
            <span className={`text-lg font-bold tabular-nums font-mono transition-all duration-300 ${
              balanceAnimated ? 'text-accent' : 'text-accent'
            }`}>
              {user?.clickBalance ?? 0}
            </span>
          </div>
        </div>

        {/* BSC Warning - prominent */}
        <div className="flex items-center gap-3 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <svg className="relative w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
              ⚠ {t('depositPanel.bscWarning')}
            </span>
            <span className="text-[11px] text-red-300/80 font-medium">
              {t('depositPanel.bscWarningDesc')}
            </span>
          </div>
        </div>

        {/* Token Selector - compact */}
        <div className="flex gap-1.5">
          {(['USDT', 'BNB'] as DepositToken[]).map((token) => (
            <button
              key={token}
              onClick={() => setSelectedToken(token)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 font-mono ${
                selectedToken === token
                  ? 'bg-gradient-primary text-white shadow-glow-primary'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 border border-white/5'
              }`}
            >
              {token}
            </button>
          ))}
        </div>

        {/* QR + Address */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 rounded-lg p-2.5 text-xs text-red-300 border border-red-500/20">
            {error}
          </div>
        ) : depositAddr ? (
          <div className="space-y-3 flex-1">
            <div className="flex justify-center">
              <div className="qr-pulse-wrap">
                <div className="qr-pulse-ring-outer" />
                <div className="qr-pulse-ring" />
                <QRCode value={depositAddr.address} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={depositAddr.address}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-secondary truncate focus:outline-none focus:border-secondary/50"
              />
              <button
                onClick={handleCopy}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                  copied
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-white/10 text-text hover:bg-white/20 border border-white/10'
                }`}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Click Calculator - compact */}
        <div className="mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={MIN_DEPOSIT_AMOUNT}
                step="1"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 pr-12 text-sm text-text font-mono focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Amount"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-dim font-mono">
                USDT
              </span>
            </div>
            <span className="text-text-dim text-sm">=</span>
            <div
              className="border rounded-lg px-3 py-1.5 min-w-[90px] text-center"
              style={{
                background: 'rgba(255, 215, 0, 0.08)',
                borderColor: 'rgba(255, 215, 0, 0.2)',
                boxShadow: '0 0 12px rgba(255, 215, 0, 0.06)',
              }}
            >
              <span className="text-base font-bold text-accent tabular-nums font-mono">
                {clicksForAmount}
              </span>
              <span className="text-[9px] text-accent/70 ml-0.5 font-mono">clicks</span>
            </div>
          </div>
          <p className="text-[10px] text-text-dim mt-1 font-mono">
            1 click = ${PRICE_PER_CLICK.toFixed(2)} · Min: ${MIN_DEPOSIT_AMOUNT} USDT
          </p>
        </div>
      </div>
    </div>
  );
}
