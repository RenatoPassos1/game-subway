import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import { query } from '../db/client.js';
import {
  UPSERT_NOTIFICATION_SUB,
  DEACTIVATE_NOTIFICATION_SUB,
} from '../db/queries.js';
import { getVapidPublicKey } from '../services/pushService.js';

const logger = pino({ name: 'push-routes' });

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function pushRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /push/vapid-public-key (public)
  fastify.get('/push/vapid-public-key', async (_request, _reply) => {
    return { publicKey: getVapidPublicKey() };
  });

  // POST /push/subscribe (auth required)
  fastify.post<{
    Body: {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      preferences?: { events?: string[]; filters?: Record<string, any> };
    };
  }>('/push/subscribe', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const user = request.user as AuthUser;
    const { subscription, preferences } = request.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'Valid push subscription object required.' });
    }

    const defaultPrefs = {
      events: ['auction_scheduled', 'starts_60', 'starts_30', 'starts_5', 'live_now'],
      ...preferences,
    };

    const result = await query(UPSERT_NOTIFICATION_SUB, [
      user.userId,
      'push',
      JSON.stringify(subscription),
      JSON.stringify(defaultPrefs),
    ]);

    logger.info({ userId: user.userId }, 'Push subscription saved');
    return { subscription: result.rows[0] };
  });

  // POST /push/unsubscribe (auth required)
  fastify.post('/push/unsubscribe', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const user = request.user as AuthUser;
    await query(DEACTIVATE_NOTIFICATION_SUB, [user.userId, 'push']);

    logger.info({ userId: user.userId }, 'Push subscription deactivated');
    return { success: true };
  });
}
