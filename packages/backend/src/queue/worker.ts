import { Worker } from 'bullmq';
import pino from 'pino';
import { sendPushNotification } from '../services/pushService.js';
import { sendTelegramNotification } from '../services/telegramService.js';
import type { NotificationJobData } from './queue.js';

const logger = pino({ name: 'notification-worker' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
  };
}

let worker: Worker | null = null;

export function startNotificationWorker(): void {
  const connection = parseRedisUrl(REDIS_URL);

  worker = new Worker(
    'notifications',
    async (job) => {
      const data = job.data as NotificationJobData;
      logger.info({ jobId: job.id, channel: data.channel, eventType: data.eventType }, 'Processing notification');

      if (data.channel === 'push') {
        const success = await sendPushNotification(
          data.subscriptionId,
          data.userId,
          data.destination,
          {
            title: data.title,
            body: data.message,
            url: data.url,
            icon: '/favicon.svg',
          },
          data.eventType,
        );
        if (!success) throw new Error('Push send failed');
      } else if (data.channel === 'telegram') {
        const chatId = data.destination?.chat_id;
        if (!chatId) throw new Error('No chat_id in destination');

        const text = `<b>${data.title}</b>\n\n${data.message}`;
        const success = await sendTelegramNotification(
          data.subscriptionId,
          data.userId,
          String(chatId),
          text,
          data.eventType,
          data.url,
        );
        if (!success) throw new Error('Telegram send failed');
      } else {
        logger.warn({ channel: data.channel }, 'Unknown notification channel');
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 30,
        duration: 1000,
      },
    },
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job?.id }, 'Notification job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Notification job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err: err.message }, 'Notification worker error');
  });

  logger.info('Notification worker started');
}

export async function stopNotificationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Notification worker stopped');
  }
}
