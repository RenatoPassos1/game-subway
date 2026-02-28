import 'dotenv/config';
import pino from 'pino';

const logger = pino({ name: 'settlement-config' });

// ============ Required Environment Variables ============

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.fatal(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// ============ Configuration ============

export const config = {
  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Redis
  REDIS_URL: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

  // BNB Chain RPC
  BNB_RPC_URL: optionalEnv('BNB_RPC_URL', 'https://bsc-dataseed1.binance.org'),

  // Hot wallet private key (settlement service ONLY)
  HOT_WALLET_KEY: requireEnv('HOT_WALLET_KEY'),

  // USDT BEP-20 contract address on BSC
  USDT_CONTRACT: optionalEnv(
    'USDT_CONTRACT',
    '0x55d398326f99059fF775485246999027B3197955',
  ),

  // Platform fee percentage (0 = no fee, 0.05 = 5%)
  PLATFORM_FEE_PCT: parseFloat(optionalEnv('PLATFORM_FEE_PCT', '0')),

  // Settlement retry configuration
  MAX_RETRY_ATTEMPTS: parseInt(optionalEnv('MAX_RETRY_ATTEMPTS', '3'), 10),
  RETRY_DELAY_MS: parseInt(optionalEnv('RETRY_DELAY_MS', '10000'), 10),

  // Node environment
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
} as const;

// Validate numeric values
if (config.PLATFORM_FEE_PCT < 0 || config.PLATFORM_FEE_PCT > 1) {
  logger.fatal('PLATFORM_FEE_PCT must be between 0 and 1');
  process.exit(1);
}

if (config.MAX_RETRY_ATTEMPTS < 1 || config.MAX_RETRY_ATTEMPTS > 10) {
  logger.fatal('MAX_RETRY_ATTEMPTS must be between 1 and 10');
  process.exit(1);
}

logger.info(
  {
    bnbRpc: config.BNB_RPC_URL,
    usdtContract: config.USDT_CONTRACT,
    platformFeePct: config.PLATFORM_FEE_PCT,
    maxRetries: config.MAX_RETRY_ATTEMPTS,
    env: config.NODE_ENV,
  },
  'Settlement configuration loaded',
);
