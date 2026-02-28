// Click Win useAuction Hook
// Wraps AuctionContext with derived computed values

import { useMemo } from 'react';
import { useAuctionContext } from '../contexts/AuctionContext';
import { AUCTION_STATES, CLICK_RATE_LIMIT_MS } from '@click-win/shared/src/constants';
import type { AuctionState } from '@click-win/shared/src/types';
import { useAuthContext } from '../contexts/AuthContext';

interface UseAuctionReturn {
  auction: AuctionState | null;
  isSubscribed: boolean;
  subscribe: (auctionId: string) => void;
  unsubscribe: () => void;
  sendClick: (auctionId: string) => void;
  // Derived values
  timeLeft: number;
  timeLeftFormatted: string;
  discountPercent: number;
  discountFormatted: string;
  canClick: boolean;
  isActive: boolean;
  isEnded: boolean;
  isClosing: boolean;
  statusLabel: string;
  statusColor: string;
  revenueProgress: number;
  minRevenueTarget: number;
  hasMetRevenue: boolean;
}

export function useAuction(): UseAuctionReturn {
  const { currentAuction, isSubscribed, subscribe, unsubscribe, sendClick } =
    useAuctionContext();
  const { isAuthenticated, user } = useAuthContext();

  return useMemo(() => {
    const auction = currentAuction;

    // Time left in seconds
    const timeLeft = auction ? Math.max(0, auction.timerRemaining / 1000) : 0;
    const timeLeftFormatted = timeLeft.toFixed(1);

    // Discount percentage
    const discountPercent = auction
      ? Math.min(auction.accumulatedDiscount, auction.maxDiscountPct) * 100
      : 0;
    const discountFormatted = discountPercent.toFixed(1);

    // Can the current user click?
    const isActive = auction?.status === AUCTION_STATES.ACTIVE;
    const isEnded =
      auction?.status === AUCTION_STATES.ENDED ||
      auction?.status === AUCTION_STATES.SETTLED;
    const isClosing = auction?.status === AUCTION_STATES.CLOSING;

    const hasBalance = (user?.clickBalance ?? 0) > 0;
    const canClick = isAuthenticated && isActive && hasBalance;

    // Status label and color
    let statusLabel = 'Unknown';
    let statusColor = 'bg-gray-500';

    if (auction) {
      switch (auction.status) {
        case AUCTION_STATES.PENDING:
          statusLabel = 'Pending';
          statusColor = 'bg-yellow-500';
          break;
        case AUCTION_STATES.ACTIVE:
          statusLabel = 'Active';
          statusColor = 'bg-green-500';
          break;
        case AUCTION_STATES.CLOSING:
          statusLabel = 'Closing';
          statusColor = 'bg-orange-500';
          break;
        case AUCTION_STATES.ENDED:
          statusLabel = 'Ended';
          statusColor = 'bg-red-500';
          break;
        case AUCTION_STATES.SETTLED:
          statusLabel = 'Settled';
          statusColor = 'bg-blue-500';
          break;
        case AUCTION_STATES.PAUSED:
          statusLabel = 'Paused';
          statusColor = 'bg-gray-500';
          break;
        case AUCTION_STATES.CANCELLED:
          statusLabel = 'Cancelled';
          statusColor = 'bg-red-700';
          break;
      }
    }

    // Revenue progress towards min threshold
    const minRevenueTarget = auction
      ? auction.prizeValue * 1.2 // MIN_REVENUE_MULTIPLIER
      : 0;
    const revenueProgress =
      auction && minRevenueTarget > 0
        ? Math.min(1, auction.revenue / minRevenueTarget)
        : 0;
    const hasMetRevenue = revenueProgress >= 1;

    return {
      auction,
      isSubscribed,
      subscribe,
      unsubscribe,
      sendClick,
      timeLeft,
      timeLeftFormatted,
      discountPercent,
      discountFormatted,
      canClick,
      isActive,
      isEnded,
      isClosing,
      statusLabel,
      statusColor,
      revenueProgress,
      minRevenueTarget,
      hasMetRevenue,
    };
  }, [currentAuction, isSubscribed, subscribe, unsubscribe, sendClick, isAuthenticated, user]);
}
