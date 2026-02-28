'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useAuction } from '../hooks/useAuction';
import { useAuthContext } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { CLICK_RATE_LIMIT_MS } from '@click-win/shared/src/constants';

// ---------- Ripple Effect ----------
interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function ClickButton() {
  const { auction, canClick, isActive, sendClick } = useAuction();
  const { isAuthenticated, user } = useAuthContext();
  const { isConnected } = useWallet();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isCooling, setIsCooling] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const lastClickRef = useRef(0);
  const rippleIdRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Determine button disabled state and reason
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
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!canClick || !auction) return;

      const now = Date.now();
      if (now - lastClickRef.current < CLICK_RATE_LIMIT_MS) return;

      lastClickRef.current = now;

      // Fire click
      sendClick(auction.id);

      // Ripple effect at click position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++rippleIdRef.current;

      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      // Cooldown visual
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
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          relative overflow-hidden
          w-36 h-36 sm:w-44 sm:h-44 rounded-full
          font-black text-2xl sm:text-3xl tracking-wider uppercase
          transition-all duration-200 select-none
          focus:outline-none focus:ring-4 focus:ring-[#6C5CE7]/50
          ${
            isDisabled
              ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border-2 border-white/5'
              : `
                bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF]
                text-white shadow-lg shadow-[#6C5CE7]/30
                hover:shadow-xl hover:shadow-[#6C5CE7]/40
                hover:scale-105 active:scale-95
                border-2 border-white/20
              `
          }
        `}
        aria-label="Click to participate in auction"
      >
        {/* Pulse ring when active */}
        {isActive && !isDisabled && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping bg-[#6C5CE7]/20" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-[#00D2FF]/30 animate-pulse" />
          </>
        )}

        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-[ripple_0.6s_ease-out_forwards] pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
          />
        ))}

        {/* Button text */}
        <span className="relative z-10">
          {isCooling ? (
            <span className="text-lg tabular-nums">
              {(cooldownMs / 1000).toFixed(1)}s
            </span>
          ) : (
            'CLICK!'
          )}
        </span>
      </button>

      {/* Disabled reason */}
      {isDisabled && disabledReason && (
        <p className="text-sm text-[#E0E0FF]/50">{disabledReason}</p>
      )}

      {/* Balance indicator */}
      {isAuthenticated && user && (
        <p className="text-xs text-[#E0E0FF]/40">
          <span className="text-[#FFD700] font-semibold">
            {user.clickBalance}
          </span>{' '}
          clicks remaining
        </p>
      )}

      {/* Inline keyframe for ripple animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(6); opacity: 0; }
        }
      `}} />
    </div>
  );
}
