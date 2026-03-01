import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import crypto from 'crypto';
import { query } from '../db/client.js';
import {
  CREATE_TELEGRAM_LINK_TOKEN,
  GET_TELEGRAM_LINK_TOKEN,
  MARK_TELEGRAM_TOKEN_USED,
  UPSERT_NOTIFICATION_SUB,
  DEACTIVATE_NOTIFICATION_SUB,
  FIND_SUB_BY_TELEGRAM_CHAT,
} from '../db/queries.js';
import {
  sendTelegramMessage,
  setWebhook,
  getWebhookInfo,
  isTelegramConfigured,
} from '../services/telegramService.js';

const logger = pino({ name: 'telegram-routes' });

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function telegramRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /telegram/link-token (auth required)
  fastify.post('/telegram/link-token', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!isTelegramConfigured()) {
      return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE', message: 'Telegram bot not configured.' });
    }

    const user = request.user as AuthUser;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(CREATE_TELEGRAM_LINK_TOKEN, [token, user.userId, expiresAt.toISOString()]);

    const startUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;

    logger.info({ userId: user.userId }, 'Telegram link token generated');
    return { startUrl, expiresIn: 600 };
  });

  // POST /telegram/webhook (public - called by Telegram)
  fastify.post('/telegram/webhook', async (request, reply) => {
    const update = request.body as any;

    if (!update?.message?.text) {
      return reply.status(200).send({ ok: true });
    }

    const chatId = String(update.message.chat.id);
    const text = update.message.text.trim();
    const firstName = update.message.from?.first_name || 'there';

    // Handle /start <token>
    if (text.startsWith('/start ')) {
      const token = text.split(' ')[1];
      if (!token) {
        await sendTelegramMessage(chatId, 'Invalid link token. Please generate a new one from Click Win.');
        return reply.status(200).send({ ok: true });
      }

      const tokenResult = await query(GET_TELEGRAM_LINK_TOKEN, [token]);
      if (tokenResult.rows.length === 0) {
        await sendTelegramMessage(chatId, 'This link has expired or was already used. Please generate a new one from Click Win.');
        return reply.status(200).send({ ok: true });
      }

      const linkToken = tokenResult.rows[0];

      // Mark token as used
      await query(MARK_TELEGRAM_TOKEN_USED, [token]);

      // Create/update subscription
      const defaultPrefs = {
        events: ['auction_scheduled', 'starts_60', 'starts_30', 'starts_5', 'live_now'],
      };

      await query(UPSERT_NOTIFICATION_SUB, [
        linkToken.user_id,
        'telegram',
        JSON.stringify({ chat_id: chatId }),
        JSON.stringify(defaultPrefs),
      ]);

      await sendTelegramMessage(
        chatId,
        `Welcome to Click Win Alerts, ${firstName}! 🎯\n\nYour Telegram is now linked to your wallet. You will receive auction alerts here.\n\nCommands:\n/status - Check your subscription\n/stop - Disable alerts\n/help - Show help`,
      );

      logger.info({ chatId, userId: linkToken.user_id }, 'Telegram account linked');
      return reply.status(200).send({ ok: true });
    }

    // Handle /start without token
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        `Welcome to Click Win Alerts! 🎯\n\nTo link your account, visit clickwin.fun and generate a Telegram link from the Alerts settings.`,
      );
      return reply.status(200).send({ ok: true });
    }

    // Handle /stop
    if (text === '/stop') {
      const sub = await query(FIND_SUB_BY_TELEGRAM_CHAT, [chatId]);
      if (sub.rows.length > 0) {
        await query(DEACTIVATE_NOTIFICATION_SUB, [sub.rows[0].user_id, 'telegram']);
        await sendTelegramMessage(chatId, 'Alerts disabled. You can re-enable them anytime from Click Win.');
        logger.info({ chatId }, 'Telegram alerts disabled');
      } else {
        await sendTelegramMessage(chatId, 'No active subscription found for this chat.');
      }
      return reply.status(200).send({ ok: true });
    }

    // Handle /status
    if (text === '/status') {
      const sub = await query(FIND_SUB_BY_TELEGRAM_CHAT, [chatId]);
      if (sub.rows.length > 0 && sub.rows[0].is_active) {
        const prefs = sub.rows[0].preferences || {};
        const events = prefs.events || [];
        await sendTelegramMessage(
          chatId,
          `<b>Status:</b> Active\n<b>Events:</b> ${events.join(', ') || 'all'}`,
        );
      } else {
        await sendTelegramMessage(chatId, 'No active subscription. Link your account from Click Win.');
      }
      return reply.status(200).send({ ok: true });
    }

    // Handle /help
    if (text === '/help') {
      await sendTelegramMessage(
        chatId,
        `<b>Click Win Alerts Bot</b>\n\n/start - Link your account\n/status - Check subscription status\n/stop - Disable alerts\n/help - Show this help\n\nVisit <a href="https://clickwin.fun">clickwin.fun</a> to manage your alerts.`,
      );
      return reply.status(200).send({ ok: true });
    }

    // Unknown command
    await sendTelegramMessage(chatId, 'Unknown command. Use /help to see available commands.');
    return reply.status(200).send({ ok: true });
  });

  // POST /telegram/set-webhook (admin only)
  fastify.post('/telegram/set-webhook', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    if (apiKey !== ADMIN_API_KEY) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin access required.' });
    }

    if (!PUBLIC_BASE_URL) {
      return reply.status(400).send({ error: 'CONFIG_ERROR', message: 'PUBLIC_BASE_URL not configured.' });
    }

    const result = await setWebhook(PUBLIC_BASE_URL);
    logger.info({ result }, 'Telegram webhook set');
    return result;
  });

  // GET /telegram/webhook-info (admin only)
  fastify.get('/telegram/webhook-info', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    if (apiKey !== ADMIN_API_KEY) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin access required.' });
    }

    const result = await getWebhookInfo();
    return result;
  });
}
