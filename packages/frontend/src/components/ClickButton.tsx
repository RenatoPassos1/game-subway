'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useAuction } from '../hooks/useAuction';
import { useAuthContext } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { CLICK_RATE_LIMIT_MS } from '@click-win/shared/src/constants';

export default function ClickButton() {
  const { auction, canClick, isActive, sendClick } = useAuction();
  const { isAuthenticated, user } = useAuthContext();
  const { isConnected } = useWallet();
  const [isCooling, setIsCooling] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [flash, setFlash] = useState(false);
  const lastClickRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  let disabledReason = '';
  let isDisabled = false;

  if (!isConnected) {
    isDisabled = true;
    disabledReason = 'Connect Wallet';
  } else if (!isAuthenticated) {
    isDisabled = true;
    disabledReason = 'Sign In First';
  } else if (!auction) {
    isDisabled = true;
    disabledReason = 'No Auction';
  } else if (!isActive) {
    isDisabled = true;
    disabledReason = 'Auction Not Active';
  } else if ((user?.clickBalance ?? 0) <= 0) {
    isDisabled = true;
    disabledReason = 'No Clicks Left';
  } else if (isCooling) {
    isDisabled = true;
    disabledReason = '';
  }

  const handleClick = useCallback(
    () => {
      if (!canClick || !auction) return;

      const now = Date.now();
      if (now - lastClickRef.current < CLICK_RATE_LIMIT_MS) return;
      lastClickRef.current = now;

      sendClick(auction.id);

      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      setIsCooling(true);
      setCooldownMs(CLICK_RATE_LIMIT_MS);

      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      const startTime = Date.now();
      cooldownTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = CLICK_RATE_LIMIT_MS - elapsed;
        if (remaining <= 0) {
          setIsCooling(false);
          setCooldownMs(0);
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        } else {
          setCooldownMs(remaining);
        }
      }, 50);
    },
    [canClick, auction, sendClick]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Button wrapper */}
      <div className="relative">
        {/* Outer spinning red ring */}
        <div
          className="absolute inset-[-6px] rounded-full pointer-events-none animate-[neonSpin_4s_linear_infinite]"
          style={{
            background: 'conic-gradient(from 0deg, #FF3B30, #FF6B4A, #FF3B30, #FF6B4A, #FF3B30)',
            opacity: 0.7,
          }}
        >
          <div
            className="absolute inset-[3px] rounded-full"
            style={{ background: '#0F0F23' }}
          />
        </div>

        {/* Red neon pulsing glow ring */}
        <div
          className="absolute inset-[-3px] rounded-full pointer-events-none animate-[neonRedPulse_2s_ease-in-out_infinite]"
          style={{
            border: '2px solid rgba(255, 59, 48, 0.8)',
            boxShadow: '0 0 10px rgba(255,59,48,0.6), 0 0 25px rgba(255,59,48,0.3), 0 0 50px rgba(255,59,48,0.15)',
          }}
        />

        {/* Red breathing glow behind button */}
        <div
          className="absolute inset-[-20px] rounded-full pointer-events-none animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(255,59,48,0.25) 0%, transparent 70%)',
          }}
        />

        <button
          onClick={handleClick}
          className={`
            relative w-[100px] h-[100px] rounded-full overflow-hidden
            flex items-center justify-center
            transition-all duration-200 select-none focus:outline-none
            cursor-pointer hover:scale-105 active:scale-95
            ${flash ? 'scale-110' : ''}
          `}
          style={{
            background: 'radial-gradient(circle at 40% 40%, #1A1A2E 0%, #0F0F23 100%)',
            border: '3px solid rgba(255, 59, 48, 0.8)',
            boxShadow: flash
              ? '0 0 40px rgba(20,241,149,0.5), 0 0 80px rgba(20,241,149,0.2)'
              : '0 0 8px rgba(255,59,48,0.4), 0 0 20px rgba(255,59,48,0.2), inset 0 0 15px rgba(255,59,48,0.05)',
          }}
          aria-label="Click to participate in auction"
        >
          {/* Flash overlay */}
          {flash && (
            <div className="absolute inset-0 rounded-full bg-white/20 pointer-events-none z-10" />
          )}

          {/* Content */}
          <span className="relative z-20 flex flex-col items-center">
            {isCooling ? (
              <>
                <span className="text-xl tabular-nums font-mono font-bold text-[#FF3B30]">
                  {(cooldownMs / 1000).toFixed(1)}s
                </span>
                <span className="text-[7px] font-mono uppercase text-white/30 tracking-wider">
                  wait
                </span>
              </>
            ) : (
              <span
                className="font-heading text-sm font-black tracking-[0.2em] select-none uppercase"
                style={{
                  color: '#14F195',
                  textShadow: `
                    0 0 5px #14F195,
                    0 0 10px #14F195,
                    0 0 20px rgba(20,241,149,0.5)
                  `,
                }}
              >
                CLICK
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Disabled reason */}
      {isDisabled && disabledReason && (
        <p className="text-[9px] text-text-muted font-mono">{disabledReason}</p>
      )}

      {/* Balance */}
      {isAuthenticated && user && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
          <span className="text-accent font-bold font-mono text-xs">
            {user.clickBalance}
          </span>
          <span className="text-[8px] text-text-dim font-mono">clicks</span>
        </div>
      )}
    </div>
  );
}
