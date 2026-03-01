'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '../hooks/useWallet';
import { useAuthContext } from '../contexts/AuthContext';

const FOUNDER_WALLET = '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48';

export default function WalletButton() {
  const {
    walletAddress,
    shortAddress,
    isConnected,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
    switchToBNBChain,
  } = useWallet();
  const { user, isAuthenticated, login, logout, isLoading } = useAuthContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = useMemo(
    () => walletAddress?.toLowerCase() === FOUNDER_WALLET.toLowerCase(),
    [walletAddress],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      await connectWallet();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect wallet'
      );
    }
  }, [connectWallet]);

  const handleLogin = useCallback(async () => {
    setError(null);
    try {
      // Get referral code from localStorage if any
      const storedRef = localStorage.getItem('clickwin_referral_code') ?? undefined;
      await login(storedRef);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed'
      );
    }
  }, [login]);

  const handleDisconnect = useCallback(() => {
    logout();
    disconnectWallet();
    setIsDropdownOpen(false);
  }, [logout, disconnectWallet]);

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
    } catch {
      const el = document.createElement('textarea');
      el.value = walletAddress;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [walletAddress]);

  // Not connected at all
  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          className="px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white hover:opacity-90 active:scale-95 transition-all"
        >
          Connect Wallet
        </button>
        {error && (
          <p className="text-xs text-red-400 max-w-[200px] text-right">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Connected but not on BSC
  if (!isCorrectChain) {
    return (
      <button
        onClick={switchToBNBChain}
        className="px-4 py-2 rounded-xl font-semibold text-sm bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all"
      >
        Switch to BSC
      </button>
    );
  }

  // Connected to BSC but not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#00D2FF]">{shortAddress}</span>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 max-w-[250px] text-right">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Fully authenticated
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        {/* Dot indicator */}
        <span className="w-2 h-2 rounded-full bg-green-400" />

        {/* Address */}
        <span className="text-sm font-mono text-[#00D2FF]">{shortAddress}</span>

        {/* Click balance badge */}
        {user && (
          <span className="bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
            {user.clickBalance}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-[#E0E0FF]/40 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#1A1A2E] border border-white/10 shadow-xl overflow-hidden z-50">
          {/* Balance info */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs text-[#E0E0FF]/40">Click Balance</p>
            <p className="text-lg font-bold text-[#FFD700] tabular-nums">
              {user?.clickBalance ?? 0}
            </p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleCopyAddress}
              className="w-full px-4 py-2 text-left text-sm text-[#E0E0FF]/70 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            {/* Admin Panel - founder only */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
