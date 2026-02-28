'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AuctionState,
  WsAuctionClickPayload,
  WsAuctionEndedPayload,
} from '@click-win/shared/src/types';
import { WS_EVENTS, AUCTION_STATES } from '@click-win/shared/src/constants';
import { getWsManager } from '../utils/ws';

// ---------- Context type ----------
interface AuctionContextValue {
  currentAuction: AuctionState | null;
  isSubscribed: boolean;
  subscribe: (auctionId: string) => void;
  unsubscribe: () => void;
  sendClick: (auctionId: string) => void;
}

const AuctionContext = createContext<AuctionContextValue | null>(null);

// ---------- Provider ----------
export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const [currentAuction, setCurrentAuction] = useState<AuctionState | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const cleanupRef = useRef<(() => void)[]>([]);
  const subscribedAuctionRef = useRef<string | null>(null);

  // Clean up WS listeners on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, []);

  // ---------- Subscribe to auction updates ----------
  const subscribe = useCallback((auctionId: string) => {
    const ws = getWsManager();
    if (!ws) return;

    // Unsubscribe previous if any
    cleanupRef.current.forEach((fn) => fn());
    cleanupRef.current = [];

    // Send subscribe event to server
    ws.send(WS_EVENTS.SUBSCRIBE, { auctionId });
    subscribedAuctionRef.current = auctionId;

    // Listen for full auction state updates
    const offState = ws.on(WS_EVENTS.AUCTION_STATE, (data) => {
      const state = data as AuctionState;
      setCurrentAuction(state);
    });

    // Listen for individual click updates (partial update)
    const offClick = ws.on(WS_EVENTS.AUCTION_CLICK, (data) => {
      const clickData = data as WsAuctionClickPayload;
      setCurrentAuction((prev: AuctionState | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          clickCount: clickData.clickCount,
          accumulatedDiscount: prev.accumulatedDiscount + prev.discountPerClick,
          timerRemaining: clickData.timer,
          lastClick: {
            userId: clickData.userId,
            walletAddress: clickData.walletAddress,
            timestamp: Date.now(),
            clickNumber: clickData.clickCount,
          },
        };
      });
    });

    // Listen for auction ended
    const offEnded = ws.on(WS_EVENTS.AUCTION_ENDED, (data) => {
      const endedData = data as WsAuctionEndedPayload;
      setCurrentAuction((prev: AuctionState | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: AUCTION_STATES.ENDED,
          lastClick: prev.lastClick
            ? {
                ...prev.lastClick,
                userId: endedData.winnerId,
                walletAddress: endedData.winnerWallet,
              }
            : null,
        };
      });
    });

    cleanupRef.current = [offState, offClick, offEnded];
    setIsSubscribed(true);
  }, []);

  // ---------- Unsubscribe ----------
  const unsubscribe = useCallback(() => {
    cleanupRef.current.forEach((fn) => fn());
    cleanupRef.current = [];
    subscribedAuctionRef.current = null;
    setIsSubscribed(false);
  }, []);

  // ---------- Send click ----------
  const sendClick = useCallback((auctionId: string) => {
    const ws = getWsManager();
    if (!ws) return;

    ws.send(WS_EVENTS.CLICK, {
      auctionId,
      timestamp: Date.now(),
    });
  }, []);

  // ---------- Timer countdown (local interpolation) ----------
  useEffect(() => {
    if (!currentAuction) return;
    if (
      currentAuction.status !== AUCTION_STATES.ACTIVE &&
      currentAuction.status !== AUCTION_STATES.CLOSING
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentAuction((prev: AuctionState | null) => {
        if (!prev) return prev;
        const newRemaining = Math.max(0, prev.timerRemaining - 100);
        if (newRemaining <= 0 && prev.status === AUCTION_STATES.ACTIVE) {
          return { ...prev, timerRemaining: 0, status: AUCTION_STATES.CLOSING };
        }
        return { ...prev, timerRemaining: newRemaining };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentAuction?.status]);

  const value = useMemo<AuctionContextValue>(
    () => ({
      currentAuction,
      isSubscribed,
      subscribe,
      unsubscribe,
      sendClick,
    }),
    [currentAuction, isSubscribed, subscribe, unsubscribe, sendClick]
  );

  return (
    <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
  );
}

export function useAuctionContext(): AuctionContextValue {
  const ctx = useContext(AuctionContext);
  if (!ctx) {
    throw new Error('useAuctionContext must be used within an AuctionProvider');
  }
  return ctx;
}

export { AuctionContext };
export type { AuctionContextValue };
