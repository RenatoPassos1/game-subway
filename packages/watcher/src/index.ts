import { Pool } from 'pg';
import Redis from 'ioredis';
import pino from 'pino';
import { config } from './config';
import { RpcClient } from './rpc';
import { BlockScanner } from './scanner';
import { DepositProcessor } from './processor';
import { ReconciliationJob } from './reconciliation';
import { EventEmitter, CHANNELS, AddressNewPayload } from './events';
import { HdWallet, generateNewAddress } from './wallet';

const logger = pino({
  name: config.serviceName,
  level: config.logLevel,
});

// ── Globals ────────────────────────────────────────────────
let pg: Pool;
let redis: Redis;
let events: EventEmitter;
let rpc: RpcClient;
let scanner: BlockScanner;
let processor: DepositProcessor;
let reconciliation: ReconciliationJob;
let wallet: HdWallet | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let shuttingDown = false;

// ── Bootstrap ──────────────────────────────────────────────
async function main(): Promise<void> {
  logger.info('=== Click Win Watcher Service starting ===');

  // 1. PostgreSQL connection pool
  pg = new Pool({
    host: config.pgHost,
    port: config.pgPort,
    database: config.pgDatabase,
    user: config.pgUser,
    password: config.pgPassword,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pg.on('error', (err) => {
    logger.error({ error: err.message }, 'PostgreSQL pool error');
  });

  // Verify PG connectivity
  const pgClient = await pg.connect();
  await pgClient.query('SELECT 1');
  pgClient.release();
  logger.info('PostgreSQL connected');

  // 2. Redis connection (for direct operations like INCRBY)
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
  });
  await redis.connect();
  redis.on('error', (err) => {
    logger.error({ error: err.message }, 'Redis connection error');
  });
  logger.info('Redis connected');

  // 3. Event emitter (separate pub/sub connections)
  events = new EventEmitter(config.redisUrl);
  await events.connect();
  logger.info('Event emitter connected');

  // 4. RPC client
  rpc = new RpcClient();
  const blockNumber = await rpc.getBlockNumber();
  logger.info({ blockNumber }, 'RPC connected, latest block fetched');

  // 5. HD Wallet (optional: only if xpub is configured)
  if (config.xpub) {
    try {
      wallet = new HdWallet(config.xpub);
      logger.info('HD wallet initialized');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ error: msg }, 'Failed to initialize HD wallet (address generation disabled)');
    }
  } else {
    logger.warn('No XPUB configured; on-demand address generation disabled');
  }

  // 6. Block scanner
  scanner = new BlockScanner(rpc, pg, redis);

  // 7. Deposit processor
  processor = new DepositProcessor(rpc, pg, redis, events);

  // Wire scanner -> processor
  scanner.onDepositsDetected = (deposits) => {
    processor.processDetectedDeposits(deposits).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ error: msg }, 'Unhandled error in deposit processing');
    });
  };

  // 8. Subscribe to address:new events from the backend
  await events.subscribe<AddressNewPayload>(CHANNELS.ADDRESS_NEW, (payload) => {
    logger.info({ address: payload.address }, 'New deposit address received');
    scanner.addAddress(payload.address);
  });

  // 9. Resume any pending deposits from previous runs
  await processor.resumePendingDeposits();

  // 10. Start scanning
  await scanner.start();

  // 11. Reconciliation job
  reconciliation = new ReconciliationJob(rpc, pg);
  reconciliation.start();

  // 12. Health check interval
  healthTimer = setInterval(logHealth, config.healthCheckIntervalMs);
  logger.info(
    { healthCheckIntervalMs: config.healthCheckIntervalMs },
    'Health check started'
  );

  logger.info('=== Click Win Watcher Service fully started ===');
}

// ── Health Check ───────────────────────────────────────────
async function logHealth(): Promise<void> {
  try {
    const rpcHealthy = await rpc.healthCheck();
    const scannerStatus = scanner.getStatus();
    const processorStatus = processor.getStatus();
    const reconciliationStatus = reconciliation.getStatus();

    logger.info(
      {
        rpc: {
          healthy: rpcHealthy,
          usingFallback: rpc.isUsingFallback(),
          lastKnownBlock: rpc.getLastKnownBlock(),
        },
        scanner: scannerStatus,
        processor: processorStatus,
        reconciliation: reconciliationStatus,
      },
      'Health check'
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ error: msg }, 'Health check failed');
  }
}

// ── Graceful Shutdown ──────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Shutdown signal received, starting graceful shutdown');

  // 1. Stop health check
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }

  // 2. Stop reconciliation
  reconciliation?.stop();

  // 3. Stop scanner (persists last scanned block)
  await scanner?.stop();

  // 4. Stop processor (cancels pending confirmation timers)
  processor?.stop();

  // 5. Disconnect event emitter
  await events?.disconnect();

  // 6. Disconnect Redis
  redis?.disconnect();

  // 7. Close PG pool
  await pg?.end();

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.fatal({ error: err.message, stack: err.stack }, 'Uncaught exception');
  shutdown('uncaughtException').catch(() => process.exit(1));
});
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.fatal({ error: msg }, 'Unhandled rejection');
  shutdown('unhandledRejection').catch(() => process.exit(1));
});

// ── Start ──────────────────────────────────────────────────
main().catch((err) => {
  logger.fatal({ error: err.message, stack: err.stack }, 'Failed to start watcher');
  process.exit(1);
});
