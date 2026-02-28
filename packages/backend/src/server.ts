import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import pino from 'pino';

import { redis, redisSub, closeRedis } from './redis/client';
import { loadScripts } from './redis/scripts';
import { closePool } from './db/client';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { auctionRoutes } from './routes/auction.routes';
import { referralRoutes } from './routes/referral.routes';
import { registerWebSocket, getConnectionCount } from './ws/handler';
import { startTimerManager, stopTimerManager } from './ws/timer';
import { getRateLimitOptions } from './middleware/rate-limit';

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

  // ============ Register WebSocket ============
  await registerWebSocket(fastify);

  return fastify;
}

async function connectRedisAndLoadScripts(): Promise<void> {
  logger.info('Connecting to Redis...');
  await redis.connect();
  await redisSub.connect();
  logger.info('Redis connected, loading Lua scripts...');
  await loadScripts();
}

async function start(): Promise<void> {
  let fastify: Awaited<ReturnType<typeof buildServer>> | null = null;

  try {
    // Build and start server FIRST (so healthcheck port is open)
    fastify = await buildServer();
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server listening on http://${HOST}:${PORT}`);
    logger.info(`Environment: ${NODE_ENV}`);

    // Connect Redis in background, then start timer manager
    connectRedisAndLoadScripts()
      .then(() => {
        startTimerManager();
        logger.info('Auction timer manager started');
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
