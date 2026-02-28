import 'dotenv/config';
import {
  MIN_CONFIRMATIONS,
  PRICE_PER_CLICK,
  MIN_DEPOSIT_AMOUNT,
  REFERRAL_BONUS_PCT,
  USDT_CONTRACT_BSC,
  BNB_CHAIN_ID,
  BNB_DERIVATION_PATH,
} from '../../../shared/src/constants';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: ${raw}`);
  }
  return parsed;
}

function optionalFloat(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, got: ${raw}`);
  }
  return parsed;
}

export interface WatcherConfig {
  // Database
  pgHost: string;
  pgPort: number;
  pgDatabase: string;
  pgUser: string;
  pgPassword: string;

  // Redis
  redisUrl: string;

  // RPC
  bnbRpcUrl: string;
  alchemyApiKey: string;
  alchemyRpcUrl: string;
  chainId: number;

  // Contracts
  usdtContract: string;

  // Scanner
  pollIntervalMs: number;
  startBlock: number;
  batchSize: number;

  // Deposits
  minConfirmations: number;
  pricePerClick: number;
  minDepositAmount: number;

  // Referral
  referralBonusPct: number;

  // HD Wallet
  xpub: string;
  derivationPath: string;

  // Reconciliation
  reconciliationIntervalMs: number;
  reconciliationBlockRange: number;

  // Health
  healthCheckIntervalMs: number;

  // Logging
  logLevel: string;

  // Service
  serviceName: string;
}

export function loadConfig(): WatcherConfig {
  return {
    // Database
    pgHost: optionalEnv('PG_HOST', 'localhost'),
    pgPort: optionalInt('PG_PORT', 5432),
    pgDatabase: optionalEnv('PG_DATABASE', 'clickwin'),
    pgUser: optionalEnv('PG_USER', 'clickwin'),
    pgPassword: optionalEnv('PG_PASSWORD', 'clickwin_dev_password'),

    // Redis
    redisUrl: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

    // RPC
    bnbRpcUrl: optionalEnv('BNB_RPC_URL', 'https://bsc-dataseed1.binance.org'),
    alchemyApiKey: optionalEnv('ALCHEMY_API_KEY', ''),
    alchemyRpcUrl: optionalEnv(
      'ALCHEMY_RPC_URL',
      'https://bnb-mainnet.g.alchemy.com/v2'
    ),
    chainId: BNB_CHAIN_ID,

    // Contracts
    usdtContract: optionalEnv('USDT_CONTRACT', USDT_CONTRACT_BSC),

    // Scanner
    pollIntervalMs: optionalInt('POLL_INTERVAL_MS', 3000),
    startBlock: optionalInt('START_BLOCK', 0),
    batchSize: optionalInt('BATCH_SIZE', 5),

    // Deposits
    minConfirmations: optionalInt('MIN_CONFIRMATIONS', MIN_CONFIRMATIONS),
    pricePerClick: optionalFloat('PRICE_PER_CLICK', PRICE_PER_CLICK),
    minDepositAmount: optionalFloat('MIN_DEPOSIT_AMOUNT', MIN_DEPOSIT_AMOUNT),

    // Referral
    referralBonusPct: optionalFloat('REFERRAL_BONUS_PCT', REFERRAL_BONUS_PCT),

    // HD Wallet
    xpub: optionalEnv('XPUB', ''),
    derivationPath: BNB_DERIVATION_PATH,

    // Reconciliation
    reconciliationIntervalMs: optionalInt('RECONCILIATION_INTERVAL_MS', 600_000),
    reconciliationBlockRange: optionalInt('RECONCILIATION_BLOCK_RANGE', 200),

    // Health
    healthCheckIntervalMs: optionalInt('HEALTH_CHECK_INTERVAL_MS', 30_000),

    // Logging
    logLevel: optionalEnv('LOG_LEVEL', 'info'),

    // Service
    serviceName: 'click-win-watcher',
  };
}

export const config = loadConfig();
