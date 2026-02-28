import pino from 'pino';
import type { Pool } from 'pg';
import type Redis from 'ioredis';
import { PrizeCalculator, type PrizeBreakdown } from './calculator.js';
import { TransactionExecutor } from './executor.js';
import { SettlementAuditor } from './auditor.js';
import { config } from './config.js';

const logger = pino({ name: 'settlement-processor' });

// ============ Types ============

interface AuctionRow {
  id: string;
  prize_value: number;
  prize_token: string;
  prize_description: string;
  status: string;
  click_count: number;
  accumulated_discount: number;
  max_discount_pct: number;
  revenue: number;
  winner_id: string;
}

interface WinnerRow {
  id: string;
  wallet_address: string;
}

interface PayoutRow {
  id: string;
  auction_id: string;
  winner_id: string;
  gross_amount: number;
  net_amount: number;
  platform_fee: number;
  applied_discount: number;
  tx_hash: string | null;
  status: string;
  attempt: number;
}

// ============ SettlementProcessor ============

export class SettlementProcessor {
  private pool: Pool;
  private redis: Redis;
  private calculator: PrizeCalculator;
  private executor: TransactionExecutor;
  private auditor: SettlementAuditor;

  constructor(pool: Pool, redis: Redis) {
    this.pool = pool;
    this.redis = redis;
    this.calculator = new PrizeCalculator();
    this.executor = new TransactionExecutor();
    this.auditor = new SettlementAuditor(pool);
  }

  /**
   * Main settlement flow triggered when an auction ends.
   *
   * Steps:
   *   1. Get auction from PG (verify status = ENDED)
   *   2. Get winner from PG (users table)
   *   3. Calculate payout (PrizeCalculator)
   *   4. Create payout record in PG (status = PROCESSING)
   *   5. Execute on-chain transfer (Executor)
   *   6. Update payout with txHash, status = COMPLETED
   *   7. Update auction status to SETTLED
   *   8. Create audit log with full calculation breakdown
   *   9. Publish settlement:completed event via Redis
   */
  async onAuctionEnded(auctionId: string): Promise<void> {
    logger.info({ auctionId }, 'Processing settlement for ended auction');

    // Step 1: Validate the auction is eligible for settlement
    const validation = await this.calculator.validateSettlement(auctionId, this.pool);
    if (!validation.valid) {
      logger.warn({ auctionId, reason: validation.reason }, 'Settlement validation failed');
      return;
    }

    // Step 1: Get full auction data
    const auctionResult = await this.pool.query<AuctionRow>(
      `SELECT id, prize_value, prize_token, prize_description, status,
              click_count, accumulated_discount, max_discount_pct, revenue, winner_id
       FROM auctions WHERE id = $1`,
      [auctionId],
    );

    if (auctionResult.rows.length === 0) {
      logger.error({ auctionId }, 'Auction not found');
      return;
    }

    const auction = auctionResult.rows[0];

    // Step 2: Get winner
    const winnerResult = await this.pool.query<WinnerRow>(
      'SELECT id, wallet_address FROM users WHERE id = $1',
      [auction.winner_id],
    );

    if (winnerResult.rows.length === 0) {
      logger.error({ auctionId, winnerId: auction.winner_id }, 'Winner not found');
      return;
    }

    const winner = winnerResult.rows[0];

    // Step 3: Calculate payout
    const breakdown: PrizeBreakdown = this.calculator.calculate(auction);

    // Step 4: Create payout record (status = PROCESSING)
    const payoutResult = await this.pool.query<PayoutRow>(
      `INSERT INTO payouts (auction_id, winner_id, gross_amount, net_amount, platform_fee, applied_discount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSING')
       RETURNING id, auction_id, winner_id, gross_amount, net_amount, platform_fee, applied_discount, tx_hash, status`,
      [
        auctionId,
        winner.id,
        breakdown.grossPrize,
        breakdown.winnerPayout,
        breakdown.platformFee,
        breakdown.appliedDiscount,
      ],
    );

    const payout = payoutResult.rows[0];
    logger.info({ payoutId: payout.id }, 'Payout record created');

    try {
      // Step 5: Execute on-chain transfer
      let txHash: string;

      if (auction.prize_token === 'BNB') {
        txHash = await this.executor.executePayoutBNB(
          winner.wallet_address,
          breakdown.winnerPayout.toString(),
        );
      } else {
        // Default: USDT payout
        txHash = await this.executor.executePayoutUSDT(
          winner.wallet_address,
          breakdown.winnerPayout.toString(),
        );
      }

      // Step 6: Update payout with txHash, status = COMPLETED
      await this.pool.query(
        `UPDATE payouts SET tx_hash = $1, status = 'COMPLETED', executed_at = NOW()
         WHERE id = $2`,
        [txHash, payout.id],
      );

      payout.tx_hash = txHash;
      payout.status = 'COMPLETED';

      // Step 7: Update auction status to SETTLED
      await this.pool.query(
        `UPDATE auctions SET status = 'SETTLED' WHERE id = $1`,
        [auctionId],
      );

      // Step 8: Create audit log
      await this.auditor.logSettlement(payout, auction, winner, breakdown);

      // Step 9: Publish settlement:completed event
      const settlementEvent = {
        auctionId,
        payoutId: payout.id,
        winnerId: winner.id,
        winnerWallet: winner.wallet_address,
        txHash,
        winnerPayout: breakdown.winnerPayout,
        prizeToken: auction.prize_token,
        settledAt: new Date().toISOString(),
      };

      await this.redis.publish(
        'settlement:completed',
        JSON.stringify(settlementEvent),
      );

      logger.info(
        { auctionId, payoutId: payout.id, txHash },
        'Settlement completed successfully',
      );
    } catch (error) {
      await this.handleFailedSettlement(payout.id, auctionId, error as Error, 1);
    }
  }

  /**
   * Handle a failed settlement attempt.
   *
   * - Update payout status to FAILED
   * - Log error details
   * - Log critical alert
   * - Schedule retry (max MAX_RETRY_ATTEMPTS)
   */
  async handleFailedSettlement(
    payoutId: string,
    auctionId: string,
    error: Error,
    attempt: number,
  ): Promise<void> {
    logger.error(
      { payoutId, auctionId, attempt, error: error.message },
      'Settlement failed',
    );

    // Update payout status to FAILED
    await this.pool.query(
      `UPDATE payouts SET status = 'FAILED' WHERE id = $1`,
      [payoutId],
    );

    // Audit the failure
    await this.auditor.logFailedSettlement(payoutId, auctionId, error, attempt);

    // Retry if under the max attempts
    if (attempt < config.MAX_RETRY_ATTEMPTS) {
      const nextAttempt = attempt + 1;
      const delayMs = config.RETRY_DELAY_MS * attempt; // Linear backoff

      logger.warn(
        { payoutId, auctionId, nextAttempt, delayMs },
        'Scheduling settlement retry',
      );

      await this.auditor.logRetry(payoutId, auctionId, nextAttempt, error.message);

      setTimeout(async () => {
        try {
          await this.retrySettlement(payoutId, auctionId, nextAttempt);
        } catch (retryError) {
          logger.error(
            { payoutId, auctionId, attempt: nextAttempt, error: (retryError as Error).message },
            'Settlement retry failed',
          );
        }
      }, delayMs);
    } else {
      logger.fatal(
        { payoutId, auctionId, attempts: attempt },
        'CRITICAL: Settlement exhausted all retry attempts. Manual intervention required.',
      );
    }
  }

  /**
   * Retry a failed settlement by re-executing the on-chain transfer.
   */
  private async retrySettlement(
    payoutId: string,
    auctionId: string,
    attempt: number,
  ): Promise<void> {
    logger.info({ payoutId, auctionId, attempt }, 'Retrying settlement');

    // Get payout record
    const payoutResult = await this.pool.query<PayoutRow>(
      `SELECT id, auction_id, winner_id, gross_amount, net_amount, platform_fee, applied_discount, tx_hash, status
       FROM payouts WHERE id = $1`,
      [payoutId],
    );

    if (payoutResult.rows.length === 0) {
      logger.error({ payoutId }, 'Payout not found for retry');
      return;
    }

    const payout = payoutResult.rows[0];

    // Get winner
    const winnerResult = await this.pool.query<WinnerRow>(
      'SELECT id, wallet_address FROM users WHERE id = $1',
      [payout.winner_id],
    );

    if (winnerResult.rows.length === 0) {
      logger.error({ winnerId: payout.winner_id }, 'Winner not found for retry');
      return;
    }

    const winner = winnerResult.rows[0];

    // Get auction to determine token type
    const auctionResult = await this.pool.query<AuctionRow>(
      'SELECT prize_token FROM auctions WHERE id = $1',
      [auctionId],
    );

    const prizeToken = auctionResult.rows[0]?.prize_token || 'USDT';

    // Update payout back to PROCESSING
    await this.pool.query(
      `UPDATE payouts SET status = 'PROCESSING' WHERE id = $1`,
      [payoutId],
    );

    try {
      let txHash: string;

      if (prizeToken === 'BNB') {
        txHash = await this.executor.executePayoutBNB(
          winner.wallet_address,
          Number(payout.net_amount).toString(),
        );
      } else {
        txHash = await this.executor.executePayoutUSDT(
          winner.wallet_address,
          Number(payout.net_amount).toString(),
        );
      }

      // Update payout as completed
      await this.pool.query(
        `UPDATE payouts SET tx_hash = $1, status = 'COMPLETED', executed_at = NOW()
         WHERE id = $2`,
        [txHash, payoutId],
      );

      // Update auction status to SETTLED
      await this.pool.query(
        `UPDATE auctions SET status = 'SETTLED' WHERE id = $1`,
        [auctionId],
      );

      // Publish settlement:completed
      const settlementEvent = {
        auctionId,
        payoutId,
        winnerId: winner.id,
        winnerWallet: winner.wallet_address,
        txHash,
        winnerPayout: Number(payout.net_amount),
        prizeToken,
        settledAt: new Date().toISOString(),
      };

      await this.redis.publish(
        'settlement:completed',
        JSON.stringify(settlementEvent),
      );

      logger.info(
        { payoutId, auctionId, txHash, attempt },
        'Settlement retry succeeded',
      );
    } catch (error) {
      await this.handleFailedSettlement(payoutId, auctionId, error as Error, attempt);
    }
  }
}
