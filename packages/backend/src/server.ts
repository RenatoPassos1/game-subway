import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import pino from 'pino';

import { redis, redisSub, closeRedis } from './redis/client';
import { loadScripts } from './redis/scripts';
import { closePool } from './db/client';
import { runMigrations } from './db/migrate';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { auctionRoutes } from './routes/auction.routes';
import { referralRoutes } from './routes/referral.routes';
import { adsRoutes } from './routes/ads.routes';
import { advertiserRoutes } from './routes/advertiser.routes';
import { cryptoRoutes } from './routes/crypto.routes';
import { adminRoutes } from './routes/admin.routes';
import { pushRoutes } from './routes/push.routes';
import { telegramRoutes } from './routes/telegram.routes';
import { alertsRoutes } from './routes/alerts.routes';
import { startNotificationWorker, stopNotificationWorker } from './queue/worker';
import { closeQueue } from './queue/queue';
import { startScheduler, stopScheduler } from './services/scheduler';
import {
  registerWebSocket,
  getConnectionCount,
  broadcastReferralBonus,
  broadcastBalanceUpdate,
} from './ws/handler';
import { startTimerManager, stopTimerManager } from './ws/timer';
import { getRateLimitOptions } from './middleware/rate-limit';
import type { WsReferralBonusPayload, WsBalancePayload } from '../../../shared/src/types';

const logger = pino({ name: 'server' });

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
  });

  // ============ Register Plugins ============

  // CORS
  await fastify.register(cors, {
    origin: NODE_ENV === 'production'
      ? CORS_ORIGIN.split(',').map((o) => o.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Rate Limiting
  await fastify.register(rateLimit, getRateLimitOptions());

  // JWT
  await fastify.register(jwt, {
    secret: JWT_SECRET,
  });

  // WebSocket
  await fastify.register(websocket, {
    options: {
      maxPayload: 4096, // 4KB max message size
    },
  });

  // ============ Health Check (instant – no blocking I/O) ============
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redis.status === 'ready' ? 'connected' : 'pending',
    },
    connections: { websocket: getConnectionCount() },
  }));

  // ============ Register Routes ============
  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(auctionRoutes);
  await fastify.register(referralRoutes);
  await fastify.register(adsRoutes);
  await fastify.register(advertiserRoutes);
  await fastify.register(cryptoRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(pushRoutes);
  await fastify.register(telegramRoutes);
  await fastify.register(alertsRoutes);

  // ============ Register WebSocket ============
  await registerWebSocket(fastify);

  return fastify;
}

// Channel names must match the watcher's events.ts CHANNELS
const REDIS_CHANNELS = {
  BALANCE_UPDATED: 'balance:updated',
  REFERRAL_BONUS: 'referral:bonus',
} as const;

/**
 * Watcher event envelope:
 * { type: string, payload: T, timestamp: number }
 */
interface EventMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

/** Payload shape emitted by watcher for referral:bonus */
interface WatcherReferralPayload {
  referrerId: string;
  referredId: string;
  referredWallet: string;
  clicksEarned: number;
  depositId: string;
}

/** Payload shape emitted by watcher for balance:updated */
interface WatcherBalancePayload {
  userId: string;
  clicks: number;
  totalPurchased: number;
  depositId: string;
}

function setupRedisPubSub(): void {
  // Message handler for all subscribed channels
  redisSub.on('message', (channel: string, raw: string) => {
    try {
      const message: EventMessage = JSON.parse(raw);

      switch (channel) {
        case REDIS_CHANNELS.REFERRAL_BONUS: {
          const wp = message.payload as WatcherReferralPayload;
          // Transform watcher payload → WS payload for frontend
          const wsPayload: WsReferralBonusPayload = {
            referredUser: wp.referredWallet,
            clicksEarned: wp.clicksEarned,
            depositId: wp.depositId,
          };
          broadcastReferralBonus(wp.referrerId, wsPayload);

          // Also update referrer's balance via WS so UI refreshes immediately
          // We read the new balance from Redis to get the accurate total
          redis.get(`user:${wp.referrerId}:clicks`).then((clicksStr) => {
            const clicks = parseInt(clicksStr ?? '0', 10);
            broadcastBalanceUpdate(wp.referrerId, {
              clicks,
              totalPurchased: clicks, // best-effort; real total is in PG
            } as WsBalancePayload);
          }).catch((err) => {
            logger.warn({ err, referrerId: wp.referrerId }, 'Failed to fetch balance for referrer broadcast');
          });

          logger.info(
            { referrerId: wp.referrerId, clicksEarned: wp.clicksEarned, depositId: wp.depositId },
            'Referral bonus broadcast sent via WS'
          );
          break;
        }

        case REDIS_CHANNELS.BALANCE_UPDATED: {
          const bp = message.payload as WatcherBalancePayload;
          const wsPayload: WsBalancePayload = {
            clicks: bp.clicks,
            totalPurchased: bp.totalPurchased,
          };
          broadcastBalanceUpdate(bp.userId, wsPayload);
          logger.debug(
            { userId: bp.userId, clicks: bp.clicks },
            'Balance update broadcast sent via WS'
          );
          break;
        }

        default:
          logger.warn({ channel }, 'Received message on unhandled channel');
      }
    } catch (err) {
      logger.error({ err, channel }, 'Failed to process Redis pub/sub message');
    }
  });

  // Subscribe to channels
  redisSub.subscribe(
    REDIS_CHANNELS.REFERRAL_BONUS,
    REDIS_CHANNELS.BALANCE_UPDATED,
    (err, count) => {
      if (err) {
        logger.error({ err }, 'Failed to subscribe to Redis channels');
      } else {
        logger.info({ count }, 'Subscribed to Redis pub/sub channels');
      }
    }
  );
}

async function connectRedisAndLoadScripts(): Promise<void> {
  logger.info('Connecting to Redis...');
  await redis.connect();
  await redisSub.connect();
  logger.info('Redis connected, loading Lua scripts...');
  await loadScripts();

  // Wire up Redis pub/sub → WebSocket broadcast
  setupRedisPubSub();
  logger.info('Redis pub/sub → WebSocket bridge active');
}

async function start(): Promise<void> {
  let fastify: Awaited<ReturnType<typeof buildServer>> | null = null;

  try {
    // Run pending database migrations before anything else
    await runMigrations().catch((err) => {
      logger.warn({ err }, 'Auto-migration failed (non-fatal, server will start anyway)');
    });

    // Build and start server FIRST (so healthcheck port is open)
    fastify = await buildServer();
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server listening on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${NODE_ENV}`);

    // Connect Redis in background, then start timer manager + notification system
    connectRedisAndLoadScripts()
      .then(() => {
        startTimerManager();
        logger.info('Auction timer manager started');

        // Start notification worker and scheduler
        startNotificationWorker();
        startScheduler();
        logger.info('Notification system started (worker + scheduler)');
      })
      .catch((err) => {
        logger.warn({ err }, 'Redis initial connection deferred, timer manager not started');
      });

    logger.info(`WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // ============ Graceful Shutdown ============
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Graceful shutdown initiated');

    // Stop timer manager
    stopTimerManager();

    // Stop notification system
    stopScheduler();
    await stopNotificationWorker();
    await closeQueue();

    // Close HTTP/WS server
    if (fastify) {
      await fastify.close().catch((err) => {
        logger.error({ err }, 'Error closing Fastify');
      });
    }

    // Close Redis connections
    await closeRedis().catch((err) => {
      logger.error({ err }, 'Error closing Redis');
    });

    // Close PG pool
    await closePool().catch((err) => {
      logger.error({ err }, 'Error closing PG pool');
    });

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

start();
