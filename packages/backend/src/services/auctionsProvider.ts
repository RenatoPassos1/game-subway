import pino from 'pino';
import { query } from '../db/client.js';

const logger = pino({ name: 'auctions-provider' });

export interface ScheduledAuction {
  id: string;
  prize_value: number;
  prize_token: string;
  prize_description: string;
  status: string;
  scheduled_start: string;
  image_url?: string;
  is_main: boolean;
}

export async function getAuctionsStartingBetween(
  from: Date,
  to: Date,
): Promise<ScheduledAuction[]> {
  try {
    const result = await query(
      `SELECT * FROM auctions
       WHERE status = 'PENDING'
         AND scheduled_start IS NOT NULL
         AND scheduled_start BETWEEN $1 AND $2
       ORDER BY scheduled_start ASC`,
      [from.toISOString(), to.toISOString()],
    );
    return result.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get scheduled auctions');
    return [];
  }
}

export async function getRecentlyStartedAuctions(
  since: Date,
): Promise<ScheduledAuction[]> {
  try {
    const result = await query(
      `SELECT * FROM auctions
       WHERE status = 'ACTIVE'
         AND started_at IS NOT NULL
         AND started_at >= $1
       ORDER BY started_at DESC`,
      [since.toISOString()],
    );
    return result.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get recently started auctions');
    return [];
  }
}

export async function getPendingAuctionsForDigest(): Promise<ScheduledAuction[]> {
  try {
    const result = await query(
      `SELECT * FROM auctions
       WHERE status = 'PENDING'
         AND scheduled_start IS NOT NULL
         AND scheduled_start > NOW()
       ORDER BY scheduled_start ASC
       LIMIT 10`,
    );
    return result.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to get digest auctions');
    return [];
  }
}
