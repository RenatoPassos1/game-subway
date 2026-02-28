import { Pool } from 'pg';
import Redis from 'ioredis';
import pino from 'pino';
import { RpcClient } from './rpc';
import { config } from './config';
import { EventEmitter, BalanceUpdatedPayload, DepositConfirmedPayload } from './events';
import { calculateReferralBonus, creditBonusToReferrer } from './referral';
import { DetectedDeposit } from './scanner';
import { REDIS_KEYS } from '../../../shared/src/constants';
import type { DepositStatus } from '../../../shared/src/types';

const logger = pino({ name: 'processor', level: config.logLevel });

// Polling interval for confirmation tracking
const CONFIRMATION_POLL_MS = 5_000;

/**
 * DepositProcessor handles detected deposits:
 * - Inserts them as PENDING
 * - Tracks confirmations
 * - Credits clicks on confirmation
 * - Triggers referral bonuses
 */
export class DepositProcessor {
  private rpc: RpcClient;
  private pg: Pool;
  private redis: Redis;
  private events: EventEmitter;
  private pendingConfirmations: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private running = true;

  constructor(
    rpc: RpcClient,
    pg: Pool,
    redis: Redis,
    events: EventEmitter
  ) {
    this.rpc = rpc;
    this.pg = pg;
    this.redis = redis;
    this.events = events;
  }

  /**
   * Process a batch of detected deposits from the scanner.
   */
  async processDetectedDeposits(deposits: DetectedDeposit[]): Promise<void> {
    for (const deposit of deposits) {
      try {
        await this.processDetectedDeposit(
          deposit.txHash,
          deposit.from,
          deposit.to,
          deposit.amount,
          deposit.token,
          deposit.blockNumber
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          { txHash: deposit.txHash, error: message },
          'Failed to process detected deposit'
        );
      }
    }
  }

  /**
   * Process a single detected deposit.
   */
  async processDetectedDeposit(
    txHash: string,
    from: string,
    to: string,
    amount: string,
    token: 'BNB' | 'USDT',
    blockNumber: number
  ): Promise<void> {
    // 1. Check if deposit already exists (idempotency by tx_hash)
    const existing = await this.pg.query(
      'SELECT id FROM deposits WHERE tx_hash = $1',
      [txHash]
    );
    if (existing.rows.length > 0) {
      logger.debug({ txHash }, 'Deposit already recorded, skipping');
      return;
    }

    // 2. Look up the user who owns this deposit address
    const addressResult = await this.pg.query<{ user_id: string }>(
      'SELECT user_id FROM deposit_addresses WHERE address = $1',
      [to.toLowerCase()]
    );
    if (addressResult.rows.length === 0) {
      logger.warn({ txHash, to }, 'Deposit to unknown address, ignoring');
      return;
    }
    const userId = addressResult.rows[0].user_id;

    // 3. Check minimum deposit amount
    const amountNum = parseFloat(amount);
    if (amountNum < config.minDepositAmount) {
      logger.info(
        { txHash, amount, minRequired: config.minDepositAmount },
        'Deposit below minimum, recording but not crediting'
      );
    }

    // 4. Insert deposit with PENDING status
    const insertResult = await this.pg.query<{ id: string }>(
      `INSERT INTO deposits (
        user_id, tx_hash, token, amount, confirmations, status,
        deposit_address, clicks_credited, is_first_deposit, detected_at
      ) VALUES ($1, $2, $3, $4, 0, 'PENDING', $5, 0, false, NOW())
      RETURNING id`,
      [userId, txHash, token, amountNum, to.toLowerCase()]
    );
    const depositId = insertResult.rows[0].id;

    logger.info(
      { depositId, txHash, userId, amount, token, blockNumber },
      'Deposit recorded as PENDING'
    );

    // 5. Start confirmation tracking
    this.trackConfirmations(depositId, txHash, blockNumber, userId, amountNum, token);
  }

  /**
   * Track confirmations for a deposit until it reaches MIN_CONFIRMATIONS.
   */
  private trackConfirmations(
    depositId: string,
    txHash: string,
    depositBlockNumber: number,
    userId: string,
    amount: number,
    token: 'BNB' | 'USDT'
  ): void {
    const check = async () => {
      if (!this.running) return;

      try {
        const currentBlock = await this.rpc.getBlockNumber();
        const confirmations = currentBlock - depositBlockNumber;

        // Update confirmations in PG
        await this.pg.query(
          'UPDATE deposits SET confirmations = $1 WHERE id = $2',
          [confirmations, depositId]
        );

        if (confirmations >= config.minConfirmations) {
          // Deposit confirmed - process it
          logger.info(
            { depositId, txHash, confirmations },
            'Deposit reached required confirmations'
          );
          this.pendingConfirmations.delete(depositId);
          await this.onDepositConfirmed(depositId, userId, txHash, amount, token);
        } else {
          logger.debug(
            { depositId, txHash, confirmations, required: config.minConfirmations },
            'Waiting for more confirmations'
          );
          // Schedule next check
          if (this.running) {
            const timer = setTimeout(check, CONFIRMATION_POLL_MS);
            this.pendingConfirmations.set(depositId, timer);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          { depositId, txHash, error: message },
          'Error tracking confirmations'
        );
        // Retry after a longer delay on error
        if (this.running) {
          const timer = setTimeout(check, CONFIRMATION_POLL_MS * 3);
          this.pendingConfirmations.set(depositId, timer);
        }
      }
    };

    // Start the first check
    const timer = setTimeout(check, CONFIRMATION_POLL_MS);
    this.pendingConfirmations.set(depositId, timer);
  }

  /**
   * Called when a deposit reaches enough confirmations.
   */
  private async onDepositConfirmed(
    depositId: string,
    userId: string,
    txHash: string,
    amount: number,
    token: 'BNB' | 'USDT'
  ): Promise<void> {
    try {
      // 1. Update deposit status to CONFIRMED
      await this.pg.query(
        `UPDATE deposits SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = $1`,
        [depositId]
      );

      // 2. Calculate clicks
      const clicks = Math.floor(amount / config.pricePerClick);

      if (clicks <= 0) {
        logger.info(
          { depositId, amount, pricePerClick: config.pricePerClick },
          'Deposit too small for any clicks, marking as CREDITED with 0'
        );
        await this.pg.query(
          `UPDATE deposits SET status = 'CREDITED', clicks_credited = 0 WHERE id = $1`,
          [depositId]
        );
        return;
      }

      // 3. Credit clicks to user
      await this.creditClicks(userId, clicks, depositId);

      // 4. Update deposit status to CREDITED
      await this.pg.query(
        `UPDATE deposits SET status = 'CREDITED', clicks_credited = $1 WHERE id = $2`,
        [clicks, depositId]
      );

      // 5. Emit deposit:confirmed event
      const confirmPayload: DepositConfirmedPayload = {
        depositId,
        userId,
        txHash,
        amount,
        token,
        clicksCredited: clicks,
      };
      await this.events.emitDepositConfirmed(confirmPayload);

      // 6. Check referral bonus eligibility
      await this.checkReferralBonus(userId, depositId, clicks);

      logger.info(
        { depositId, userId, clicks, amount, token },
        'Deposit fully processed and credited'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        { depositId, userId, error: message },
        'Failed to process confirmed deposit'
      );

      // Mark as FAILED so reconciliation can pick it up
      await this.pg.query(
        `UPDATE deposits SET status = 'FAILED' WHERE id = $1`,
        [depositId]
      ).catch(() => {});
    }
  }

  /**
   * Credit clicks to a user's balance in both Redis and PostgreSQL.
   */
  private async creditClicks(
    userId: string,
    clicks: number,
    depositId: string
  ): Promise<void> {
    // 1. Redis INCRBY for real-time balance
    const redisKey = REDIS_KEYS.userClicks(userId);
    await this.redis.incrby(redisKey, clicks);

    // 2. PostgreSQL upsert click_balances
    await this.pg.query(
      `INSERT INTO click_balances (user_id, available_clicks, total_purchased)
       VALUES ($1, $2, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET
         available_clicks = click_balances.available_clicks + $2,
         total_purchased = click_balances.total_purchased + $2`,
      [userId, clicks]
    );

    // 3. Insert audit log
    await this.pg.query(
      `INSERT INTO audit_logs (event_type, actor, payload, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        'CLICKS_CREDITED',
        'watcher',
        JSON.stringify({ userId, clicks, depositId }),
        '0.0.0.0',
      ]
    );

    // 4. Get updated balance for event
    const balanceResult = await this.pg.query<{
      available_clicks: number;
      total_purchased: number;
    }>(
      'SELECT available_clicks, total_purchased FROM click_balances WHERE user_id = $1',
      [userId]
    );

    const balance = balanceResult.rows[0];
    if (balance) {
      const payload: BalanceUpdatedPayload = {
        userId,
        clicks: balance.available_clicks,
        totalPurchased: balance.total_purchased,
        depositId,
      };
      await this.events.emitBalanceUpdated(payload);
    }

    logger.info({ userId, clicks, depositId }, 'Clicks credited to user');
  }

  /**
   * Check if the user is eligible for a referral bonus and credit it.
   */
  private async checkReferralBonus(
    userId: string,
    depositId: string,
    clicksCredited: number
  ): Promise<void> {
    try {
      // 1. Query user: is referral_bonus_pending = true and do they have a referrer?
      const userResult = await this.pg.query<{
        referral_bonus_pending: boolean;
        referred_by: string | null;
      }>(
        'SELECT referral_bonus_pending, referred_by FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        logger.warn({ userId }, 'User not found for referral check');
        return;
      }

      const user = userResult.rows[0];
      if (!user.referral_bonus_pending || !user.referred_by) {
        logger.debug(
          { userId, pending: user.referral_bonus_pending, referredBy: user.referred_by },
          'User not eligible for referral bonus'
        );
        return;
      }

      // 2. Check if this is their first deposit
      const depositCountResult = await this.pg.query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM deposits
         WHERE user_id = $1 AND status IN ('CONFIRMED', 'CREDITED') AND id != $2`,
        [userId, depositId]
      );
      const priorDeposits = parseInt(depositCountResult.rows[0].cnt, 10);

      if (priorDeposits > 0) {
        logger.debug(
          { userId, priorDeposits },
          'Not first deposit, skipping referral bonus'
        );
        // Clear the pending flag since this is not a first deposit
        await this.pg.query(
          'UPDATE users SET referral_bonus_pending = false WHERE id = $1',
          [userId]
        );
        return;
      }

      // 3. Calculate bonus
      const bonusClicks = calculateReferralBonus(clicksCredited);
      if (bonusClicks <= 0) {
        logger.debug(
          { userId, clicksCredited, bonusClicks },
          'Bonus rounds to 0 clicks, skipping'
        );
        return;
      }

      // 4. Mark deposit as first deposit
      await this.pg.query(
        'UPDATE deposits SET is_first_deposit = true WHERE id = $1',
        [depositId]
      );

      // 5. Credit bonus to referrer
      const referrerId = user.referred_by;
      await creditBonusToReferrer(
        this.pg,
        this.redis,
        this.events,
        referrerId,
        userId,
        depositId,
        bonusClicks
      );

      logger.info(
        { referrerId, userId, depositId, bonusClicks },
        'Referral bonus processed'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        { userId, depositId, error: message },
        'Error checking referral bonus (non-fatal)'
      );
      // Don't throw: referral bonus failure should not block deposit crediting
    }
  }

  /**
   * Resume tracking for deposits that are still PENDING or CONFIRMED on startup.
   * This handles the case where the watcher was restarted mid-confirmation.
   */
  async resumePendingDeposits(): Promise<void> {
    const result = await this.pg.query<{
      id: string;
      tx_hash: string;
      user_id: string;
      amount: number;
      token: 'BNB' | 'USDT';
    }>(
      `SELECT id, tx_hash, user_id, amount, token
       FROM deposits
       WHERE status IN ('PENDING', 'CONFIRMED')
       ORDER BY detected_at ASC`
    );

    if (result.rows.length === 0) {
      logger.info('No pending deposits to resume');
      return;
    }

    logger.info(
      { count: result.rows.length },
      'Resuming pending deposit confirmations'
    );

    for (const row of result.rows) {
      try {
        // Get the transaction receipt to find the block number
        const receipt = await this.rpc.getTransactionReceipt(row.tx_hash);
        if (!receipt) {
          logger.warn(
            { depositId: row.id, txHash: row.tx_hash },
            'Transaction receipt not found, marking as FAILED'
          );
          await this.pg.query(
            `UPDATE deposits SET status = 'FAILED' WHERE id = $1`,
            [row.id]
          );
          continue;
        }

        this.trackConfirmations(
          row.id,
          row.tx_hash,
          receipt.blockNumber,
          row.user_id,
          row.amount,
          row.token
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          { depositId: row.id, error: message },
          'Failed to resume deposit tracking'
        );
      }
    }
  }

  /**
   * Stop the processor and cancel all pending confirmation timers.
   */
  stop(): void {
    this.running = false;
    for (const [depositId, timer] of this.pendingConfirmations) {
      clearTimeout(timer);
      logger.debug({ depositId }, 'Cancelled confirmation timer');
    }
    this.pendingConfirmations.clear();
    logger.info('Deposit processor stopped');
  }

  /**
   * Get processor status.
   */
  getStatus(): { pendingConfirmations: number } {
    return {
      pendingConfirmations: this.pendingConfirmations.size,
    };
  }
}
