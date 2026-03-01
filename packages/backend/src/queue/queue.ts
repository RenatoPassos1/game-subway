import { Queue } from 'bullmq';
import pino from 'pino';

const logger = pino({ name: 'notification-queue' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL for BullMQ connection
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
  };
}

const connection = parseRedisUrl(REDIS_URL);

export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

notificationQueue.on('error', (err) => {
  logger.error({ err: err.message }, 'Notification queue error');
});

export interface NotificationJobData {
  userId: string;
  channel: 'push' | 'telegram';
  eventType: string;
  title: string;
  message: string;
  url?: string;
  subscriptionId: string;
  destination: any;
}

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  const jobId = `${data.eventType}:${data.userId}:${data.channel}`;

  await notificationQueue.add('send-notification', data, {
    jobId,
    delay: 0,
  });

  logger.debug({ jobId, channel: data.channel, eventType: data.eventType }, 'Notification enqueued');
}

export async function closeQueue(): Promise<void> {
  await notificationQueue.close();
  logger.info('Notification queue closed');
}
