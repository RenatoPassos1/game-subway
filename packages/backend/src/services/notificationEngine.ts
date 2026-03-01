import pino from 'pino';
import { query } from '../db/client.js';
import { GET_ALL_ACTIVE_SUBS_BY_CHANNEL } from '../db/queries.js';
import { enqueueNotification } from '../queue/queue.js';

const logger = pino({ name: 'notification-engine' });

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://clickwin.fun';

export interface AuctionEvent {
  eventType: string;
  auctionId: string;
  title: string;
  message: string;
  url?: string;
  filters?: {
    prizeToken?: string;
    prizeValueUsd?: number;
  };
}

export async function broadcastAuctionEvent(event: AuctionEvent): Promise<number> {
  let enqueued = 0;

  for (const channel of ['push', 'telegram'] as const) {
    try {
      const result = await query(GET_ALL_ACTIVE_SUBS_BY_CHANNEL, [channel]);
      const subs = result.rows;

      for (const sub of subs) {
        // Check if user subscribed to this event type
        const prefs = sub.preferences || {};
        const events: string[] = prefs.events || [];

        if (events.length > 0 && !events.includes(event.eventType)) {
          continue;
        }

        // Check prize filters
        if (event.filters && prefs.filters) {
          const f = prefs.filters;
          if (f.prizeTypes?.length > 0 && event.filters.prizeToken && !f.prizeTypes.includes(event.filters.prizeToken)) {
            continue;
          }
          if (f.minPrizeUsd && event.filters.prizeValueUsd && event.filters.prizeValueUsd < f.minPrizeUsd) {
            continue;
          }
        }

        await enqueueNotification({
          userId: sub.user_id,
          channel,
          eventType: event.eventType,
          title: event.title,
          message: event.message,
          url: event.url || PUBLIC_BASE_URL,
          subscriptionId: sub.id,
          destination: sub.destination,
        });

        enqueued++;
      }
    } catch (err: any) {
      logger.error({ err: err.message, channel, eventType: event.eventType }, 'Failed to broadcast to channel');
    }
  }

  logger.info({ eventType: event.eventType, enqueued }, 'Auction event broadcast complete');
  return enqueued;
}

export async function sendTestNotification(
  userId: string,
  channel: 'push' | 'telegram',
  title: string,
  message: string,
  url?: string,
): Promise<boolean> {
  const subResult = await query(
    `SELECT * FROM notification_subscriptions WHERE user_id = $1 AND channel = $2 AND is_active = true`,
    [userId, channel],
  );

  if (subResult.rows.length === 0) {
    logger.warn({ userId, channel }, 'No active subscription for test notification');
    return false;
  }

  const sub = subResult.rows[0];

  await enqueueNotification({
    userId,
    channel,
    eventType: 'test',
    title,
    message,
    url: url || PUBLIC_BASE_URL,
    subscriptionId: sub.id,
    destination: sub.destination,
  });

  return true;
}
