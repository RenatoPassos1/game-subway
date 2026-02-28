import pino from 'pino';
import type { Pool } from 'pg';
import type { PrizeBreakdown } from './calculator.js';
import type { WalletBalances } from './executor.js';

const logger = pino({ name: 'settlement-auditor' });

// ============ Types ============

interface PayoutRecord {
  id: string;
  auction_id: string;
  winner_id: string;
  gross_amount: number;
  net_amount: number;
  platform_fee: number;
  applied_discount: number;
  tx_hash: string | null;
  status: string;
}

interface AuctionRecord {
  id: string;
  prize_value: number;
  prize_token: string;
  click_count: number;
  revenue: number;
  accumulated_discount: number;
  max_discount_pct: number;
}

interface WinnerRecord {
  id: string;
  wallet_address: string;
}

// ============ SettlementAuditor ============

export class SettlementAuditor {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log a successful settlement with full calculation breakdown.
   */
  async logSettlement(
    payout: PayoutRecord,
    auction: AuctionRecord,
    winner: WinnerRecord,
    breakdown: PrizeBreakdown,
  ): Promise<void> {
    const payload = {
      payoutId: payout.id,
      auctionId: auction.id,
      winnerId: winner.id,
      winnerWallet: winner.wallet_address,
      prizeToken: auction.prize_token,
      prizeValue: Number(auction.prize_value),
      clickCount: auction.click_count,
      auctionRevenue: Number(auction.revenue),
      accumulatedDiscount: breakdown.accumulatedDiscount,
      appliedDiscount: breakdown.appliedDiscount,
      maxDiscountPct: Number(auction.max_discount_pct),
      grossPrize: breakdown.grossPrize,
      netPrize: breakdown.netPrize,
      platformFee: breakdown.platformFee,
      winnerPayout: breakdown.winnerPayout,
      txHash: payout.tx_hash,
      payoutStatus: payout.status,
      settledAt: new Date().toISOString(),
    };

    await this.pool.query(
      `INSERT INTO audit_logs (event_type, actor, payload)
       VALUES ($1, $2, $3)`,
      ['SETTLEMENT_COMPLETED', 'settlement-service', JSON.stringify(payload)],
    );

    logger.info(payload, 'Settlement audit log created');
  }

  /**
   * Log a failed settlement attempt with error details.
   */
  async logFailedSettlement(
    payoutId: string,
    auctionId: string,
    error: Error | string,
    attempt: number,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const payload = {
      payoutId,
      auctionId,
      error: errorMessage,
      stack: errorStack,
      attempt,
      failedAt: new Date().toISOString(),
    };

    await this.pool.query(
      `INSERT INTO audit_logs (event_type, actor, payload)
       VALUES ($1, $2, $3)`,
      ['SETTLEMENT_FAILED', 'settlement-service', JSON.stringify(payload)],
    );

    logger.error(payload, 'Settlement failure audit log created');
  }

  /**
   * Log a wallet balance check for monitoring purposes.
   */
  async logWalletBalance(
    walletAddress: string,
    balances: WalletBalances,
  ): Promise<void> {
    const payload = {
      walletAddress,
      bnbBalance: balances.bnb,
      usdtBalance: balances.usdt,
      checkedAt: new Date().toISOString(),
    };

    await this.pool.query(
      `INSERT INTO audit_logs (event_type, actor, payload)
       VALUES ($1, $2, $3)`,
      ['WALLET_BALANCE_CHECK', 'settlement-service', JSON.stringify(payload)],
    );

    logger.info(payload, 'Wallet balance audit log created');
  }

  /**
   * Log a settlement retry event.
   */
  async logRetry(
    payoutId: string,
    auctionId: string,
    attempt: number,
    reason: string,
  ): Promise<void> {
    const payload = {
      payoutId,
      auctionId,
      attempt,
      reason,
      retriedAt: new Date().toISOString(),
    };

    await this.pool.query(
      `INSERT INTO audit_logs (event_type, actor, payload)
       VALUES ($1, $2, $3)`,
      ['SETTLEMENT_RETRY', 'settlement-service', JSON.stringify(payload)],
    );

    logger.warn(payload, 'Settlement retry audit log created');
  }
}
