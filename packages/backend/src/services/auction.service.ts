import pino from 'pino';
import { query, getClient } from '../db/client';
import { redis } from '../redis/client';
import { execProcessClick, type ProcessClickResult } from '../redis/scripts';
import {
  GET_ACTIVE_AUCTION,
  GET_AUCTION_BY_ID,
  CREATE_AUCTION,
  END_AUCTION,
  START_AUCTION,
  INSERT_CLICK,
  GET_AUCTION_CLICKS,
  COUNT_AUCTION_CLICKS,
} from '../db/queries';
import { REDIS_KEYS, PRICE_PER_CLICK, AUCTION_STATES } from '../../../../shared/src/constants';
import type { Auction, AuctionState, LastClick } from '../../../../shared/src/types';

const logger = pino({ name: 'auction-service' });

// ============ Get Active Auction ============
export async function getActiveAuction(): Promise<Auction | null> {
  // Try Redis first for active auction ID
  const keys = await redis.keys('auction:*:state');
  for (const key of keys) {
    const status = await redis.hget(key, 'status');
    if (status === AUCTION_STATES.ACTIVE || status === AUCTION_STATES.CLOSING) {
      const auctionId = key.split(':')[1];
      const state = await getAuctionStateFromRedis(auctionId);
      if (state) {
        // Also get the PG record for full data
        const { rows } = await query<Auction>(GET_AUCTION_BY_ID, [auctionId]);
        return rows[0] || null;
      }
    }
  }

  // Fallback to PG
  const { rows } = await query<Auction>(GET_ACTIVE_AUCTION);
  return rows[0] || null;
}

// ============ Get Auction State ============
export async function getAuctionState(auctionId: string): Promise<AuctionState | null> {
  // Try Redis
  const state = await getAuctionStateFromRedis(auctionId);
  if (state) return state;

  // Fallback to PG
  const { rows } = await query<Auction>(GET_AUCTION_BY_ID, [auctionId]);
  if (rows.length === 0) return null;

  return auctionToState(rows[0]);
}

async function getAuctionStateFromRedis(auctionId: string): Promise<AuctionState | null> {
  const stateKey = REDIS_KEYS.auctionState(auctionId);
  const data = await redis.hgetall(stateKey);

  if (!data || !data.status) return null;

  // Get timer remaining
  const timerKey = REDIS_KEYS.auctionTimer(auctionId);
  const timerTtl = await redis.pttl(timerKey);
  const timerRemaining = timerTtl > 0 ? timerTtl : 0;

  let lastClick: LastClick | null = null;
  if (data.lastClickUserId) {
    lastClick = {
      userId: data.lastClickUserId,
      walletAddress: data.lastClickWallet,
      timestamp: parseInt(data.lastClickTimestamp, 10),
      clickNumber: parseInt(data.lastClickNumber, 10),
    };
  }

  return {
    id: auctionId,
    status: data.status as AuctionState['status'],
    prizeValue: parseFloat(data.prizeValue),
    prizeToken: data.prizeToken,
    prizeDescription: data.prizeDescription || '',
    clickCount: parseInt(data.clickCount || '0', 10),
    accumulatedDiscount: parseFloat(data.accumulatedDiscount || '0'),
    revenue: parseFloat(data.revenue || '0'),
    timerRemaining,
    timerDuration: parseInt(data.timerDuration || '30000', 10),
    lastClick,
    discountPerClick: parseFloat(data.discountPerClick || '0.0001'),
    maxDiscountPct: parseFloat(data.maxDiscountPct || '0.5'),
    sponsorImageUrl: data.sponsorImageUrl || null,
    sponsorLink: data.sponsorLink || null,
  };
}

function auctionToState(auction: Auction): AuctionState {
  return {
    id: auction.id,
    status: auction.status,
    prizeValue: auction.prize_value,
    prizeToken: auction.prize_token,
    prizeDescription: auction.prize_description,
    clickCount: auction.click_count,
    accumulatedDiscount: auction.accumulated_discount,
    revenue: auction.revenue,
    timerRemaining: 0,
    timerDuration: auction.timer_duration,
    lastClick: null,
    discountPerClick: auction.discount_per_click,
    maxDiscountPct: auction.max_discount_pct,
    sponsorImageUrl: auction.sponsor_image_url || null,
    sponsorLink: auction.sponsor_link || null,
  };
}

// ============ Process Click ============
export interface ClickResult {
  success: boolean;
  errorCode?: string;
  auctionState?: AuctionState;
}

export async function processClick(
  userId: string,
  walletAddress: string,
  auctionId: string,
): Promise<ClickResult> {
  // Get auction config from Redis
  const stateKey = REDIS_KEYS.auctionState(auctionId);
  const auctionData = await redis.hgetall(stateKey);

  if (!auctionData || !auctionData.status) {
    return { success: false, errorCode: 'AUCTION_NOT_FOUND' };
  }

  const discountPerClick = parseFloat(auctionData.discountPerClick || '0.0001');
  const maxDiscountPct = parseFloat(auctionData.maxDiscountPct || '0.5');
  const prizeValue = parseFloat(auctionData.prizeValue);
  const minRevenueMultiplier = parseFloat(auctionData.minRevenueMultiplier || '1.2');
  const timerDuration = parseInt(auctionData.timerDuration || '30000', 10);

  const result = await execProcessClick(
    userId,
    walletAddress,
    auctionId,
    discountPerClick,
    maxDiscountPct,
    prizeValue,
    minRevenueMultiplier,
    timerDuration,
    PRICE_PER_CLICK,
  );

  if (!result.success) {
    let errorCode = 'CLICK_FAILED';
    switch (result.errorCode) {
      case -1: errorCode = 'INSUFFICIENT_CLICKS'; break;
      case -2: errorCode = 'AUCTION_NOT_ACTIVE'; break;
      case -3: errorCode = 'RATE_LIMITED'; break;
    }
    return { success: false, errorCode };
  }

  // Record click in PG (async, non-blocking)
  const clickDiscount = discountPerClick;
  query(INSERT_CLICK, [userId, auctionId, result.clickCount, clickDiscount]).catch((err) => {
    logger.error({ err, userId, auctionId }, 'Failed to persist click to PG');
  });

  // Build updated auction state
  const timerKey = REDIS_KEYS.auctionTimer(auctionId);
  const timerTtl = await redis.pttl(timerKey);

  const auctionState: AuctionState = {
    id: auctionId,
    status: result.status as AuctionState['status'],
    prizeValue,
    prizeToken: auctionData.prizeToken,
    prizeDescription: auctionData.prizeDescription || '',
    clickCount: result.clickCount,
    accumulatedDiscount: result.accumulatedDiscount,
    revenue: result.revenue,
    timerRemaining: timerTtl > 0 ? timerTtl : timerDuration,
    timerDuration,
    lastClick: {
      userId,
      walletAddress,
      timestamp: Date.now(),
      clickNumber: result.clickCount,
    },
    discountPerClick,
    maxDiscountPct,
    sponsorImageUrl: auctionData.sponsorImageUrl || null,
    sponsorLink: auctionData.sponsorLink || null,
  };

  return { success: true, auctionState };
}

// ============ Create Auction ============
export interface CreateAuctionParams {
  prizeValue: number;
  prizeToken?: string;
  prizeDescription?: string;
  minRevenueMultiplier?: number;
  maxDiscountPct?: number;
  discountPerClick?: number;
  timerDuration?: number;
  autoStart?: boolean;
}

export async function createAuction(params: CreateAuctionParams): Promise<Auction> {
  const {
    prizeValue,
    prizeToken = 'USDT',
    prizeDescription = '',
    minRevenueMultiplier = 1.2,
    maxDiscountPct = 0.5,
    discountPerClick = 0.0001,
    timerDuration = 30000,
    autoStart = false,
  } = params;

  const status = autoStart ? 'ACTIVE' : 'PENDING';

  const { rows } = await query<Auction>(CREATE_AUCTION, [
    prizeValue,
    prizeToken,
    prizeDescription,
    status,
    minRevenueMultiplier,
    maxDiscountPct,
    discountPerClick,
    timerDuration,
  ]);

  const auction = rows[0];

  if (autoStart) {
    await query(START_AUCTION, [auction.id]);
    auction.status = 'ACTIVE';
    auction.started_at = new Date().toISOString();
  }

  // Initialize Redis state
  await initializeAuctionRedis(auction);

  logger.info({
    auctionId: auction.id,
    prizeValue,
    status,
  }, 'Auction created');

  return auction;
}

async function initializeAuctionRedis(auction: Auction): Promise<void> {
  const stateKey = REDIS_KEYS.auctionState(auction.id);

  const redisState: Record<string, string> = {
    status: auction.status,
    prizeValue: auction.prize_value.toString(),
    prizeToken: auction.prize_token,
    prizeDescription: auction.prize_description,
    minRevenueMultiplier: auction.min_revenue_multiplier.toString(),
    maxDiscountPct: auction.max_discount_pct.toString(),
    discountPerClick: auction.discount_per_click.toString(),
    timerDuration: auction.timer_duration.toString(),
    clickCount: '0',
    accumulatedDiscount: '0',
    revenue: '0',
  };

  if (auction.sponsor_image_url) redisState.sponsorImageUrl = auction.sponsor_image_url;
  if (auction.sponsor_link) redisState.sponsorLink = auction.sponsor_link;

  await redis.hmset(stateKey, redisState);

  // Set initial timer if auction is active
  if (auction.status === 'ACTIVE') {
    const timerKey = REDIS_KEYS.auctionTimer(auction.id);
    const timerTtlSec = Math.ceil(auction.timer_duration / 1000);
    await redis.set(timerKey, Date.now().toString(), 'EX', timerTtlSec);
  }
}

// ============ End Auction ============
export async function endAuction(
  auctionId: string,
): Promise<{ winnerId: string | null; finalDiscount: number; auction: Auction } | null> {
  const stateKey = REDIS_KEYS.auctionState(auctionId);
  const data = await redis.hgetall(stateKey);

  if (!data || !data.status) {
    logger.warn({ auctionId }, 'Cannot end auction: no Redis state');
    return null;
  }

  // Only end if CLOSING
  if (data.status !== AUCTION_STATES.CLOSING) {
    // Also allow ending ACTIVE auctions (timer expired before revenue threshold)
    if (data.status !== AUCTION_STATES.ACTIVE) {
      logger.warn({ auctionId, status: data.status }, 'Cannot end auction: invalid status');
      return null;
    }
  }

  const lastClickUserId = data.lastClickUserId || null;
  const finalDiscount = parseFloat(data.accumulatedDiscount || '0');
  const clickCount = parseInt(data.clickCount || '0', 10);
  const revenue = parseFloat(data.revenue || '0');

  // Update PG
  const { rows } = await query<Auction>(END_AUCTION, [
    auctionId,
    lastClickUserId,
    finalDiscount,
    clickCount,
    finalDiscount, // accumulated_discount
    revenue,
  ]);

  if (rows.length === 0) {
    logger.error({ auctionId }, 'Failed to end auction in PG');
    return null;
  }

  // Update Redis status
  await redis.hset(stateKey, 'status', AUCTION_STATES.ENDED);

  // Clean up timer
  const timerKey = REDIS_KEYS.auctionTimer(auctionId);
  await redis.del(timerKey);

  logger.info({
    auctionId,
    winnerId: lastClickUserId,
    finalDiscount,
    clickCount,
    revenue,
  }, 'Auction ended');

  return {
    winnerId: lastClickUserId,
    finalDiscount,
    auction: rows[0],
  };
}

// ============ Get Auction Click History ============
export async function getAuctionClickHistory(
  auctionId: string,
  limit: number,
  offset: number,
): Promise<{ data: any[]; total: number }> {
  const [clicksResult, countResult] = await Promise.all([
    query(GET_AUCTION_CLICKS, [auctionId, limit, offset]),
    query(COUNT_AUCTION_CLICKS, [auctionId]),
  ]);

  return {
    data: clicksResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}
