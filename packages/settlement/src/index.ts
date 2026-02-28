import pino from 'pino';
import Redis from 'ioredis';
import pg from 'pg';
import { config } from './config.js';
import { SettlementProcessor } from './processor.js';

const logger = pino({ name: 'settlement' });

// ============ Connections ============

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 10) {
      logger.error('Redis: max reconnection attempts reached');
      return null;
    }
    return Math.min(times * 200, 5000);
  },
  lazyConnect: false,
});

// Dedicated subscriber connection (Redis Pub/Sub requires separate connection)
const redisSub = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 10) return null;
    return Math.min(times * 200, 5000);
  },
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis publisher connected'));
redis.on('error', (err: Error) => logger.error({ err }, 'Redis publisher error'));

redisSub.on('connect', () => logger.info('Redis subscriber connected'));
redisSub.on('error', (err: Error) => logger.error({ err }, 'Redis subscriber error'));

// ============ Settlement Processor ============

const processor = new SettlementProcessor(pool, redis);

// ============ Subscribe to auction:ended events ============

async function startSubscriber(): Promise<void> {
  await redisSub.subscribe('auction:ended');
  logger.info('Subscribed to auction:ended channel');

  redisSub.on('message', async (channel: string, message: string) => {
    if (channel !== 'auction:ended') return;

    try {
      const data = JSON.parse(message) as { auctionId: string };

      if (!data.auctionId) {
        logger.warn({ message }, 'Received auction:ended event without auctionId');
        return;
      }

      logger.info({ auctionId: data.auctionId }, 'Received auction:ended event');
      await processor.onAuctionEnded(data.auctionId);
    } catch (err) {
      logger.error({ err, message }, 'Error processing auction:ended event');
    }
  });
}

// ============ Health Check Logging ============

const HEALTH_INTERVAL_MS = 60_000; // Log health every 60 seconds
let healthTimer: ReturnType<typeof setInterval>;

function startHealthCheck(): void {
  healthTimer = setInterval(async () => {
    try {
      // Verify PG connection
      await pool.query('SELECT 1');
      // Verify Redis connection
      await redis.ping();

      logger.info(
        {
          pgPool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
          },
          uptime: process.uptime(),
          memory: process.memoryUsage().rss,
        },
        'Settlement service health OK',
      );
    } catch (err) {
      logger.error({ err }, 'Settlement service health check FAILED');
    }
  }, HEALTH_INTERVAL_MS);
}

// ============ Graceful Shutdown ============

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Shutting down settlement service');

  clearInterval(healthTimer);

  try {
    await redisSub.unsubscribe('auction:ended');
    await redisSub.quit().catch(() => {});
    await redis.quit().catch(() => {});
    await pool.end();
    logger.info('All connections closed');
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

// ============ Start ============

async function main(): Promise<void> {
  logger.info('Starting Click Win Settlement Service');

  // Verify database connectivity
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info({ dbTime: result.rows[0].now }, 'PostgreSQL connected');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to PostgreSQL');
    process.exit(1);
  }

  // Start Redis subscriber
  await startSubscriber();

  // Start health check
  startHealthCheck();

  logger.info('Settlement service is running and listening for auction:ended events');
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start settlement service');
  process.exit(1);
});
