import { Pool } from 'pg';
import Redis from 'ioredis';
import pino from 'pino';
import { config } from './config';
import { EventEmitter, ReferralBonusPayload } from './events';
import { REDIS_KEYS } from '../../../shared/src/constants';

const logger = pino({ name: 'referral', level: config.logLevel });

/**
 * Calculate the referral bonus clicks.
 */
export function calculateReferralBonus(
  clicksPurchased: number,
  bonusPct: number = config.referralBonusPct
): number {
  return Math.floor(clicksPurchased * bonusPct);
}

/**
 * Credit referral bonus to the referrer atomically.
 *
 * This performs:
 * 1. PG transaction: credit click_balances, insert referral_rewards, clear pending flag
 * 2. Redis: INCRBY user clicks, HINCRBY referral stats
 * 3. Emit referral:bonus event
 * 4. Insert audit log
 */
export async function creditBonusToReferrer(
  pg: Pool,
  redis: Redis,
  events: EventEmitter,
  referrerId: string,
  referredId: string,
  depositId: string,
  bonusClicks: number
): Promise<void> {
  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    // 1. Credit clicks to referrer's balance
    await client.query(
      `UPDATE click_balances
       SET available_clicks = available_clicks + $1,
           total_purchased = total_purchased + $1
       WHERE user_id = $2`,
      [bonusClicks, referrerId]
    );

    // If no row was updated, the referrer might not have a balance row yet
    const updateResult = await client.query(
      `INSERT INTO click_balances (user_id, available_clicks, total_purchased)
       VALUES ($1, $2, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET
         available_clicks = click_balances.available_clicks + $2,
         total_purchased = click_balances.total_purchased + $2`,
      [referrerId, bonusClicks]
    );

    // 2. Insert referral_rewards record
    await client.query(
      `INSERT INTO referral_rewards (referrer_id, referred_id, deposit_id, clicks_earned, status)
       VALUES ($1, $2, $3, $4, 'CREDITED')`,
      [referrerId, referredId, depositId, bonusClicks]
    );

    // 3. Clear the referral_bonus_pending flag on the referred user
    await client.query(
      `UPDATE users SET referral_bonus_pending = false WHERE id = $1`,
      [referredId]
    );

    // 4. Insert audit log
    await client.query(
      `INSERT INTO audit_logs (event_type, actor, payload, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        'REFERRAL_BONUS_CREDITED',
        'watcher',
        JSON.stringify({
          referrerId,
          referredId,
          depositId,
          bonusClicks,
        }),
        '0.0.0.0',
      ]
    );

    await client.query('COMMIT');

    // 5. Update Redis atomically
    const redisClicksKey = REDIS_KEYS.userClicks(referrerId);
    const redisStatsKey = REDIS_KEYS.userReferralStats(referrerId);

    await redis.incrby(redisClicksKey, bonusClicks);
    await redis.hincrby(redisStatsKey, 'totalClicksEarned', bonusClicks);
    await redis.hincrby(redisStatsKey, 'totalReferred', 1);

    // 6. Fetch referredUser wallet for the event payload
    const referredResult = await pg.query<{ wallet_address: string }>(
      'SELECT wallet_address FROM users WHERE id = $1',
      [referredId]
    );
    const referredWallet = referredResult.rows[0]?.wallet_address ?? '';

    // 7. Emit referral:bonus event via Redis pub/sub
    const bonusPayload: ReferralBonusPayload = {
      referrerId,
      referredId,
      referredWallet,
      clicksEarned: bonusClicks,
      depositId,
    };
    await events.emitReferralBonus(bonusPayload);

    logger.info(
      { referrerId, referredId, depositId, bonusClicks },
      'Referral bonus credited successfully'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { referrerId, referredId, depositId, bonusClicks, error: message },
      'Failed to credit referral bonus'
    );
    throw err;
  } finally {
    client.release();
  }
}
