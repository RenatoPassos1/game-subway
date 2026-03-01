import webpush from 'web-push';
import pino from 'pino';
import { query } from '../db/client.js';
import { MARK_SUB_INACTIVE, INSERT_NOTIFICATION_LOG } from '../db/queries.js';

const logger = pino({ name: 'push-service' });

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@clickwin.fun';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  logger.info('VAPID configured');
} else {
  logger.warn('VAPID keys not configured - push notifications disabled');
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscriptionId: string,
  userId: string,
  destination: PushSubscriptionData,
  payload: PushPayload,
  eventType: string,
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: destination.endpoint,
      keys: destination.keys,
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      { TTL: 3600 },
    );

    await query(INSERT_NOTIFICATION_LOG, [
      userId, 'push', eventType, JSON.stringify(payload), 'sent', null,
    ]);

    logger.debug({ userId, eventType }, 'Push notification sent');
    return true;
  } catch (err: any) {
    const statusCode = err.statusCode;

    // 410 Gone or 404 = subscription expired
    if (statusCode === 410 || statusCode === 404) {
      logger.info({ subscriptionId, userId }, 'Push subscription expired, marking inactive');
      await query(MARK_SUB_INACTIVE, [subscriptionId]);
    }

    await query(INSERT_NOTIFICATION_LOG, [
      userId, 'push', eventType, JSON.stringify(payload), 'failed', err.message || 'Unknown error',
    ]);

    logger.error({ err: err.message, statusCode, userId }, 'Push notification failed');
    return false;
  }
}
