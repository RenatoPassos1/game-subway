import pino from 'pino';
import { redis, redisSub } from '../redis/client';
import { endAuction, getAuctionState } from '../services/auction.service';
import { findById } from '../services/user.service';
import { broadcastAuctionEnded, broadcastToAuction } from './handler';
import { REDIS_KEYS, WS_EVENTS, AUCTION_STATES } from '../../../../shared/src/constants';
import type { WsAuctionEndedPayload } from '../../../../shared/src/types';

const logger = pino({ name: 'auction-timer' });

const POLL_INTERVAL_MS = 1000; // 1 second polling interval
let pollTimer: NodeJS.Timeout | null = null;
let isShuttingDown = false;

// ============ Keyspace Notification Approach ============
// Redis keyspace notifications fire when a key expires.
// We use this to detect when an auction timer expires.

export async function startTimerManager(): Promise<void> {
  // Try to enable keyspace notifications
  try {
    await redis.config('SET', 'notify-keyspace-events', 'Ex');
    logger.info('Redis keyspace notifications enabled');
  } catch (err) {
    logger.warn({ err }, 'Could not enable keyspace notifications, falling back to polling');
  }

  // Subscribe to expired key events
  try {
    await redisSub.subscribe('__keyevent@0__:expired');
    logger.info('Subscribed to Redis key expiration events');

    redisSub.on('message', async (channel: string, key: string) => {
      if (isShuttingDown) return;

      // Check if this is an auction timer key
      const match = key.match(/^auction:([^:]+):timer$/);
      if (!match) return;

      const auctionId = match[1];
      logger.info({ auctionId }, 'Auction timer expired via keyspace notification');

      await handleTimerExpiry(auctionId);
    });
  } catch (err) {
    logger.warn({ err }, 'Keyspace notification subscription failed, using polling only');
  }

  // Also start polling as a safety net
  startPolling();
}

function startPolling(): void {
  if (pollTimer) return;

  pollTimer = setInterval(async () => {
    if (isShuttingDown) return;
    await checkActiveAuctionTimers();
  }, POLL_INTERVAL_MS);

  logger.info(`Auction timer polling started (${POLL_INTERVAL_MS}ms interval)`);
}

async function checkActiveAuctionTimers(): Promise<void> {
  try {
    // Find all auction state keys
    const keys = await redis.keys('auction:*:state');

    for (const key of keys) {
      const status = await redis.hget(key, 'status');
      if (status !== AUCTION_STATES.ACTIVE && status !== AUCTION_STATES.CLOSING) {
        continue;
      }

      const auctionId = key.split(':')[1];
      const timerKey = REDIS_KEYS.auctionTimer(auctionId);

      // Check if timer key still exists
      const exists = await redis.exists(timerKey);
      if (exists === 0) {
        // Timer expired, the keyspace notification might have been missed
        logger.info({ auctionId }, 'Auction timer expired detected by polling');
        await handleTimerExpiry(auctionId);
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error checking auction timers');
  }
}

async function handleTimerExpiry(auctionId: string): Promise<void> {
  try {
    const stateKey = REDIS_KEYS.auctionState(auctionId);
    const status = await redis.hget(stateKey, 'status');

    // Only process if CLOSING (revenue threshold met)
    // If ACTIVE, the timer just means the countdown reset window.
    // The auction only truly ends when CLOSING + timer expires.
    if (status === AUCTION_STATES.CLOSING) {
      const result = await endAuction(auctionId);
      if (!result) {
        logger.warn({ auctionId }, 'Failed to end auction on timer expiry');
        return;
      }

      let winnerWallet = 'unknown';
      if (result.winnerId) {
        const winner = await findById(result.winnerId);
        if (winner) {
          winnerWallet = winner.wallet_address;
        }
      }

      const prizeValue = result.auction.prize_value;
      const discount = result.finalDiscount;
      const netPrize = prizeValue * (1 - discount);

      const endedPayload: WsAuctionEndedPayload = {
        auctionId,
        winnerId: result.winnerId || '',
        winnerWallet,
        finalDiscount: discount,
        netPrize,
      };

      broadcastAuctionEnded(endedPayload);

      logger.info({
        auctionId,
        winnerId: result.winnerId,
        finalDiscount: discount,
        netPrize,
      }, 'Auction ended and broadcast');
    } else if (status === AUCTION_STATES.ACTIVE) {
      // Active auction with no clicks in time window
      // Check if we should end without a winner or just keep going
      // For now: if the auction is ACTIVE (not CLOSING), the timer expiring
      // means nobody clicked within the time window, but the auction stays active
      // until explicitly ended or transitioned to CLOSING.
      //
      // However, if there was at least one click (lastClickUserId exists),
      // we end it even without reaching revenue threshold.
      const lastClicker = await redis.hget(stateKey, 'lastClickUserId');
      if (lastClicker) {
        // Someone clicked, timer ran out → end auction
        const result = await endAuction(auctionId);
        if (result && result.winnerId) {
          const winner = await findById(result.winnerId);
          const winnerWallet = winner?.wallet_address || 'unknown';
          const prizeValue = result.auction.prize_value;
          const discount = result.finalDiscount;
          const netPrize = prizeValue * (1 - discount);

          broadcastAuctionEnded({
            auctionId,
            winnerId: result.winnerId,
            winnerWallet,
            finalDiscount: discount,
            netPrize,
          });

          logger.info({ auctionId, winnerId: result.winnerId }, 'Active auction ended on timer');
        }
      } else {
        // No clicks yet, just refresh the timer
        const timerDuration = await redis.hget(stateKey, 'timerDuration');
        const timerKey = REDIS_KEYS.auctionTimer(auctionId);
        const ttlSec = Math.ceil(parseInt(timerDuration || '30000', 10) / 1000);
        await redis.set(timerKey, Date.now().toString(), 'EX', ttlSec);
      }
    }
  } catch (err) {
    logger.error({ err, auctionId }, 'Error handling timer expiry');
  }
}

export function stopTimerManager(): void {
  isShuttingDown = true;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  logger.info('Auction timer manager stopped');
}
