// Click Win Platform Constants

// Referral System
export const REFERRAL_BONUS_PCT = 0.20; // 20% of first purchase clicks
export const REFERRAL_CODE_LENGTH = 6;
export const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Auction
export const DEFAULT_TIMER_DURATION = 30_000; // 30 seconds in ms
export const MIN_REVENUE_MULTIPLIER = 1.2; // revenue >= prize * 1.2
export const MAX_DISCOUNT_PCT = 0.50; // 50% max discount
export const CLICK_RATE_LIMIT_MS = 500; // 1 click per 500ms

// Deposits
export const MIN_CONFIRMATIONS = 15;
export const PRICE_PER_CLICK = 0.05; // USDT per click
export const MIN_DEPOSIT_AMOUNT = 1; // 1 USDT minimum

// BNB Chain
export const BNB_CHAIN_ID = 56;
export const USDT_CONTRACT_BSC = '0x55d398326f99059fF775485246999027B3197955';
export const BNB_DERIVATION_PATH = "m/44'/60'/0'/0";

// JWT
export const JWT_EXPIRY = '7d';
export const NONCE_TTL = 300; // 5 minutes in seconds

// Rate Limits
export const API_RATE_LIMIT = 100; // requests per minute per IP
export const WS_MAX_MSG_PER_SEC = 10;
export const REFERRAL_VALIDATION_RATE = 10; // per minute per IP

// WebSocket Events
export const WS_EVENTS = {
  // Client -> Server
  CLICK: 'click',
  SUBSCRIBE: 'subscribe',
  // Server -> Client
  AUCTION_STATE: 'auction:state',
  AUCTION_CLICK: 'auction:click',
  AUCTION_ENDED: 'auction:ended',
  BALANCE_UPDATED: 'balance:updated',
  REFERRAL_BONUS: 'referral:bonus',
  ERROR: 'error',
} as const;

// Auction States
export const AUCTION_STATES = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  CLOSING: 'CLOSING',
  ENDED: 'ENDED',
  SETTLED: 'SETTLED',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
} as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es', 'zh'] as const;
export const DEFAULT_LANGUAGE = 'en';

// Redis Key Patterns
export const REDIS_KEYS = {
  auctionState: (id: string) => `auction:${id}:state`,
  auctionLastClick: (id: string) => `auction:${id}:lastClick`,
  auctionTimer: (id: string) => `auction:${id}:timer`,
  userClicks: (id: string) => `user:${id}:clicks`,
  userSession: (id: string) => `user:${id}:session`,
  userReferralStats: (id: string) => `user:${id}:referral_stats`,
  rateLimit: (userId: string, auctionId: string) => `rate:${userId}:${auctionId}`,
  nonce: (address: string) => `nonce:${address}`,
} as const;

// ============ Advertising System ============

// Platform wallet that receives ad payments
export const PLATFORM_WALLET = '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48';

// Advertising slot type slugs
export const AD_SLOT_TYPES = {
  CAROUSEL: 'carousel',
  SIDE_CARD: 'side_card',
} as const;

// Ad campaign lifecycle states
export const AD_CAMPAIGN_STATES = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Ad crypto order states
export const AD_ORDER_STATES = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  CONFIRMING: 'CONFIRMING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
} as const;

// BNB price cache TTL in seconds
export const BNB_PRICE_CACHE_TTL = 60;

// Order expiry time in minutes
export const AD_ORDER_EXPIRY_MINUTES = 30;

// Minimum confirmations for ad payments
export const MIN_CONFIRMATIONS_AD = 15;
