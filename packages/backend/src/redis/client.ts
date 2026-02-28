import Redis from 'ioredis';
import pino from 'pino';

const logger = pino({ name: 'redis' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 20) {
      logger.error('Redis: max reconnection attempts reached');
      return null; // stop retrying
    }
    const delay = Math.min(times * 500, 10000);
    logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  lazyConnect: true,
  enableReadyCheck: true,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Subscriber client for keyspace notifications
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 20) return null;
    return Math.min(times * 500, 10000);
  },
  lazyConnect: true,
});

redisSub.on('error', (err: Error) => {
  logger.error({ err }, 'Redis subscriber error');
});

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => {});
  await redisSub.quit().catch(() => {});
  logger.info('Redis connections closed');
}
