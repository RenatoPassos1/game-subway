import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import { query } from '../db/client.js';
import {
  GET_NOTIFICATION_SUBS_BY_USER,
  UPDATE_SUB_PREFERENCES,
  GET_NOTIFICATION_LOGS,
} from '../db/queries.js';
import { sendTestNotification } from '../services/notificationEngine.js';

const logger = pino({ name: 'alerts-routes' });

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function alertsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /alerts/me (auth required) - subscription status
  fastify.get('/alerts/me', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const user = request.user as AuthUser;
    const result = await query(GET_NOTIFICATION_SUBS_BY_USER, [user.userId]);

    const subscriptions: Record<string, any> = {
      push: null,
      telegram: null,
    };

    for (const sub of result.rows) {
      subscriptions[sub.channel] = {
        id: sub.id,
        is_active: sub.is_active,
        preferences: sub.preferences,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
      };
    }

    return { subscriptions };
  });

  // POST /alerts/preferences (auth required) - update preferences
  fastify.post<{
    Body: {
      channel: 'push' | 'telegram';
      preferences: { events?: string[]; filters?: Record<string, any> };
    };
  }>('/alerts/preferences', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const user = request.user as AuthUser;
    const { channel, preferences } = request.body;

    if (!channel || !['push', 'telegram'].includes(channel)) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'channel must be "push" or "telegram".' });
    }

    const result = await query(UPDATE_SUB_PREFERENCES, [
      user.userId,
      JSON.stringify(preferences),
      channel,
    ]);

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'No active subscription found for this channel.' });
    }

    return { subscription: result.rows[0] };
  });

  // GET /alerts/logs (auth required)
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/alerts/logs', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const user = request.user as AuthUser;
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(GET_NOTIFICATION_LOGS, [user.userId, limit, offset]);
    return { data: result.rows, page, limit };
  });

  // POST /alerts/test (admin only) - send test notification
  fastify.post<{
    Body: {
      userId: string;
      channel: 'push' | 'telegram';
      title?: string;
      message?: string;
      url?: string;
    };
  }>('/alerts/test', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];

    let isAdmin = false;
    if (apiKey === ADMIN_API_KEY) {
      isAdmin = true;
    } else {
      try {
        await request.jwtVerify();
        const user = request.user as AuthUser;
        const adminCheck = await query(
          `SELECT id FROM admins WHERE LOWER(wallet_address) = LOWER($1) AND is_active = true`,
          [user.walletAddress],
        );
        isAdmin = adminCheck.rows.length > 0;
      } catch {}
    }

    if (!isAdmin) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin access required.' });
    }

    const { userId, channel, title, message, url } = request.body;

    if (!userId || !channel) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'userId and channel are required.' });
    }

    const sent = await sendTestNotification(
      userId,
      channel,
      title || 'Test Notification',
      message || 'This is a test notification from Click Win.',
      url,
    );

    return { sent, userId, channel };
  });
}
