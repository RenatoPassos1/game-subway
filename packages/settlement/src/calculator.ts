import pino from 'pino';
import type { Pool } from 'pg';
import { config } from './config.js';

const logger = pino({ name: 'prize-calculator' });

// ============ Types ============

export interface PrizeBreakdown {
  grossPrize: number;
  accumulatedDiscount: number;
  appliedDiscount: number;
  netPrize: number;
  platformFee: number;
  winnerPayout: number;
}

interface AuctionRow {
  id: string;
  prize_value: number;
  accumulated_discount: number;
  max_discount_pct: number;
  status: string;
  winner_id: string | null;
}

// ============ PrizeCalculator ============

export class PrizeCalculator {
  /**
   * Calculate the full prize breakdown for an auction settlement.
   *
   * Formula:
   *   grossPrize          = auction.prize_value
   *   appliedDiscount      = min(accumulatedDiscount, max_discount_pct)
   *   netPrize             = grossPrize * (1 - appliedDiscount)
   *   platformFee          = netPrize * PLATFORM_FEE_PCT
   *   winnerPayout         = netPrize - platformFee
   */
  calculate(auction: AuctionRow): PrizeBreakdown {
    const grossPrize = Number(auction.prize_value);
    const accumulatedDiscount = Number(auction.accumulated_discount);
    const maxDiscountPct = Number(auction.max_discount_pct);

    // Cap the applied discount at the auction's maximum
    const appliedDiscount = Math.min(accumulatedDiscount, maxDiscountPct);

    // Net prize after discount
    const netPrize = grossPrize * (1 - appliedDiscount);

    // Platform fee (configurable, default 0)
    const platformFee = netPrize * config.PLATFORM_FEE_PCT;

    // Winner receives net prize minus platform fee
    const winnerPayout = netPrize - platformFee;

    const breakdown: PrizeBreakdown = {
      grossPrize: round8(grossPrize),
      accumulatedDiscount: round8(accumulatedDiscount),
      appliedDiscount: round8(appliedDiscount),
      netPrize: round8(netPrize),
      platformFee: round8(platformFee),
      winnerPayout: round8(winnerPayout),
    };

    logger.info(
      { auctionId: auction.id, ...breakdown },
      'Prize breakdown calculated',
    );

    return breakdown;
  }

  /**
   * Validate that an auction is eligible for settlement:
   *  - Status must be ENDED
   *  - Must have a winner
   *  - Must not already have a COMPLETED or PROCESSING payout
   */
  async validateSettlement(
    auctionId: string,
    pool: Pool,
  ): Promise<{ valid: boolean; reason?: string; auction?: AuctionRow }> {
    // Fetch auction
    const auctionResult = await pool.query<AuctionRow>(
      'SELECT id, prize_value, accumulated_discount, max_discount_pct, status, winner_id FROM auctions WHERE id = $1',
      [auctionId],
    );

    if (auctionResult.rows.length === 0) {
      return { valid: false, reason: `Auction ${auctionId} not found` };
    }

    const auction = auctionResult.rows[0];

    if (auction.status !== 'ENDED') {
      return {
        valid: false,
        reason: `Auction status is ${auction.status}, expected ENDED`,
      };
    }

    if (!auction.winner_id) {
      return { valid: false, reason: 'Auction has no winner' };
    }

    // Check for existing non-failed payout
    const payoutResult = await pool.query(
      `SELECT id, status FROM payouts
       WHERE auction_id = $1 AND status IN ('PROCESSING', 'COMPLETED')
       LIMIT 1`,
      [auctionId],
    );

    if (payoutResult.rows.length > 0) {
      const existing = payoutResult.rows[0];
      return {
        valid: false,
        reason: `Payout ${existing.id} already exists with status ${existing.status}`,
      };
    }

    return { valid: true, auction };
  }
}

// ============ Helpers ============

/** Round to 8 decimal places (standard for crypto amounts). */
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
