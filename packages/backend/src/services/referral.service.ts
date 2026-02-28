import pino from 'pino';
import { query, getClient } from '../db/client';
import { redis } from '../redis/client';
import { execCreditReferralBonus } from '../redis/scripts';
import {
  FIND_USER_BY_REFERRAL_CODE,
  GET_REFERRAL_STATS,
  GET_REFERRAL_HISTORY,
  COUNT_REFERRAL_REWARDS,
  CREATE_REFERRAL_REWARD,
  UPSERT_CLICK_BALANCE,
} from '../db/queries';
import { REFERRAL_BONUS_PCT } from '../../../../shared/src/constants';
import type { ReferralStats, ReferralHistoryEntry } from '../../../../shared/src/types';

const logger = pino({ name: 'referral-service' });

export async function validateReferralCode(code: string): Promise<boolean> {
  const normalized = code.toUpperCase().trim();
  if (normalized.length !== 6) return false;

  const { rows } = await query(FIND_USER_BY_REFERRAL_CODE, [normalized]);
  return rows.length > 0;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const { rows } = await query(GET_REFERRAL_STATS, [userId]);

  if (rows.length === 0) {
    return {
      referralCode: '',
      totalReferred: 0,
      totalClicksEarned: 0,
      pendingBonuses: 0,
    };
  }

  const row = rows[0];
  return {
    referralCode: row.referral_code,
    totalReferred: parseInt(row.total_referred, 10),
    totalClicksEarned: parseInt(row.total_clicks_earned, 10),
    pendingBonuses: parseInt(row.pending_bonuses, 10),
  };
}

export async function getReferralHistory(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ data: ReferralHistoryEntry[]; total: number }> {
  const [historyResult, countResult] = await Promise.all([
    query(GET_REFERRAL_HISTORY, [userId, limit, offset]),
    query(COUNT_REFERRAL_REWARDS, [userId]),
  ]);

  const data: ReferralHistoryEntry[] = historyResult.rows.map((row: any) => ({
    id: row.id,
    referredWallet: row.referred_wallet,
    clicksEarned: row.clicks_earned,
    depositAmount: parseFloat(row.deposit_amount),
    depositToken: row.deposit_token,
    createdAt: row.created_at,
  }));

  return {
    data,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

export async function creditReferralBonus(
  referrerId: string,
  referredId: string,
  depositId: string,
  clicksFromDeposit: number,
): Promise<{ clicksEarned: number; newBalance: number }> {
  const clicksEarned = Math.floor(clicksFromDeposit * REFERRAL_BONUS_PCT);
  if (clicksEarned <= 0) {
    return { clicksEarned: 0, newBalance: 0 };
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Record referral reward in PG
    await client.query(CREATE_REFERRAL_REWARD, [
      referrerId,
      referredId,
      depositId,
      clicksEarned,
      'CREDITED',
    ]);

    // Credit clicks in PG
    await client.query(UPSERT_CLICK_BALANCE, [
      referrerId,
      clicksEarned,
      0, // not a purchase, bonus clicks
    ]);

    await client.query('COMMIT');

    // Credit in Redis atomically
    const newBalance = await execCreditReferralBonus(referrerId, clicksEarned);

    logger.info({
      referrerId,
      referredId,
      depositId,
      clicksEarned,
      newBalance,
    }, 'Referral bonus credited');

    return { clicksEarned, newBalance };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, referrerId, referredId }, 'Failed to credit referral bonus');
    throw err;
  } finally {
    client.release();
  }
}
