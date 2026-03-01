import pino from 'pino';
import { query } from '../db/client.js';
import {
  INSERT_NOTIFICATION_LOG,
  MARK_SUB_INACTIVE,
  FIND_SUB_BY_TELEGRAM_CHAT,
} from '../db/queries.js';

const logger = pino({ name: 'telegram-service' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API = TELEGRAM_BOT_TOKEN
  ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
  : '';

export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_BOT_TOKEN;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

async function telegramApi(method: string, body: Record<string, any>): Promise<TelegramResponse> {
  if (!TELEGRAM_API) {
    throw new Error('Telegram bot token not configured');
  }

  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json() as Promise<TelegramResponse>;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: { parse_mode?: string; disable_web_page_preview?: boolean },
): Promise<TelegramResponse> {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode || 'HTML',
    disable_web_page_preview: options?.disable_web_page_preview ?? false,
  });
}

export async function sendTelegramNotification(
  subscriptionId: string,
  userId: string,
  chatId: string,
  message: string,
  eventType: string,
  url?: string,
): Promise<boolean> {
  try {
    const fullText = url ? `${message}\n\n🔗 <a href="${url}">Open Click Win</a>` : message;

    const result = await sendTelegramMessage(chatId, fullText);

    if (!result.ok) {
      // Bot was blocked by user
      if (result.error_code === 403) {
        logger.info({ subscriptionId, chatId }, 'User blocked telegram bot, marking inactive');
        await query(MARK_SUB_INACTIVE, [subscriptionId]);
      }

      await query(INSERT_NOTIFICATION_LOG, [
        userId, 'telegram', eventType, JSON.stringify({ chatId, message }),
        'failed', result.description || 'Telegram API error',
      ]);

      logger.error({ chatId, error: result.description }, 'Telegram notification failed');
      return false;
    }

    await query(INSERT_NOTIFICATION_LOG, [
      userId, 'telegram', eventType, JSON.stringify({ chatId, message }), 'sent', null,
    ]);

    logger.debug({ userId, chatId, eventType }, 'Telegram notification sent');
    return true;
  } catch (err: any) {
    await query(INSERT_NOTIFICATION_LOG, [
      userId, 'telegram', eventType, JSON.stringify({ chatId, message }),
      'failed', err.message || 'Unknown error',
    ]);

    logger.error({ err: err.message, chatId }, 'Telegram notification error');
    return false;
  }
}

export async function setWebhook(publicBaseUrl: string): Promise<TelegramResponse> {
  const webhookUrl = `${publicBaseUrl}/telegram/webhook`;
  logger.info({ webhookUrl }, 'Setting Telegram webhook');
  return telegramApi('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message'],
  });
}

export async function getWebhookInfo(): Promise<TelegramResponse> {
  return telegramApi('getWebhookInfo', {});
}
