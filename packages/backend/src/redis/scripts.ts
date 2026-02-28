import { redis } from './client';
import pino from 'pino';

const logger = pino({ name: 'redis-scripts' });

// ============================================================
// Lua Script: processClick
// Atomically processes a click in an auction
// KEYS[1] = user clicks key         (user:{userId}:clicks)
// KEYS[2] = auction state hash      (auction:{auctionId}:state)
// KEYS[3] = auction timer key       (auction:{auctionId}:timer)
// KEYS[4] = click rate limit key    (rate:{userId}:{auctionId})
// ARGV[1] = userId
// ARGV[2] = walletAddress
// ARGV[3] = discountPerClick
// ARGV[4] = maxDiscountPct
// ARGV[5] = prizeValue
// ARGV[6] = minRevenueMultiplier
// ARGV[7] = timerDuration (ms)
// ARGV[8] = clickCostClicks (1)
// ARGV[9] = currentTimestamp (ms)
// ARGV[10] = rateLimitMs (500)
// ARGV[11] = pricePerClick (USDT per click)
//
// Returns: [success, clickCount, accDiscount, revenue, timerRemaining, status]
//   success = 1 on success, negative error codes otherwise
//   -1 = insufficient clicks
//   -2 = auction not active/closing
//   -3 = rate limited
// ============================================================
const PROCESS_CLICK_LUA = `
local userClicksKey = KEYS[1]
local auctionStateKey = KEYS[2]
local auctionTimerKey = KEYS[3]
local rateLimitKey = KEYS[4]

local userId = ARGV[1]
local walletAddress = ARGV[2]
local discountPerClick = tonumber(ARGV[3])
local maxDiscountPct = tonumber(ARGV[4])
local prizeValue = tonumber(ARGV[5])
local minRevenueMultiplier = tonumber(ARGV[6])
local timerDurationMs = tonumber(ARGV[7])
local clickCost = tonumber(ARGV[8])
local currentTs = tonumber(ARGV[9])
local rateLimitMs = tonumber(ARGV[10])
local pricePerClick = tonumber(ARGV[11])

-- Rate limit check
local lastClickTs = redis.call('GET', rateLimitKey)
if lastClickTs and (currentTs - tonumber(lastClickTs)) < rateLimitMs then
  return {-3, 0, 0, 0, 0, "RATE_LIMITED"}
end

-- Check auction status
local status = redis.call('HGET', auctionStateKey, 'status')
if status ~= 'ACTIVE' and status ~= 'CLOSING' then
  return {-2, 0, 0, 0, 0, status or "NONE"}
end

-- Check user has enough clicks
local availableClicks = tonumber(redis.call('GET', userClicksKey) or '0')
if availableClicks < clickCost then
  return {-1, 0, 0, 0, 0, "INSUFFICIENT"}
end

-- Deduct user clicks
redis.call('DECRBY', userClicksKey, clickCost)

-- Increment click count
local newClickCount = redis.call('HINCRBY', auctionStateKey, 'clickCount', 1)

-- Calculate and apply discount (capped at maxDiscountPct)
local currentDiscount = tonumber(redis.call('HGET', auctionStateKey, 'accumulatedDiscount') or '0')
local newDiscount = currentDiscount + discountPerClick
if newDiscount > maxDiscountPct then
  newDiscount = maxDiscountPct
end
redis.call('HSET', auctionStateKey, 'accumulatedDiscount', tostring(newDiscount))

-- Add revenue
local newRevenue = tonumber(redis.call('HINCRBYFLOAT', auctionStateKey, 'revenue', pricePerClick))

-- Update last click info
redis.call('HSET', auctionStateKey,
  'lastClickUserId', userId,
  'lastClickWallet', walletAddress,
  'lastClickTimestamp', tostring(currentTs),
  'lastClickNumber', tostring(newClickCount)
)

-- Set rate limit
redis.call('SET', rateLimitKey, tostring(currentTs), 'PX', rateLimitMs)

-- Reset/set timer
local timerTtlSec = math.ceil(timerDurationMs / 1000)
redis.call('SET', auctionTimerKey, tostring(currentTs), 'EX', timerTtlSec)

-- Check if revenue threshold met -> transition to CLOSING
local newStatus = status
if status == 'ACTIVE' and newRevenue >= (prizeValue * minRevenueMultiplier) then
  redis.call('HSET', auctionStateKey, 'status', 'CLOSING')
  newStatus = 'CLOSING'
end

-- Calculate timer remaining
local timerRemaining = timerDurationMs

return {1, newClickCount, tostring(newDiscount), tostring(newRevenue), timerRemaining, newStatus}
`;

// ============================================================
// Lua Script: creditReferralBonus
// Atomically credits referral bonus clicks to the referrer
// KEYS[1] = referrer clicks key   (user:{referrerId}:clicks)
// ARGV[1] = clicksToCredit
//
// Returns: new balance
// ============================================================
const CREDIT_REFERRAL_BONUS_LUA = `
local referrerClicksKey = KEYS[1]
local clicksToCredit = tonumber(ARGV[1])

local newBalance = redis.call('INCRBY', referrerClicksKey, clicksToCredit)
return newBalance
`;

// Script SHA cache
let processClickSHA: string | null = null;
let creditReferralBonusSHA: string | null = null;

export async function loadScripts(): Promise<void> {
  try {
    processClickSHA = await redis.script('LOAD', PROCESS_CLICK_LUA) as string;
    creditReferralBonusSHA = await redis.script('LOAD', CREDIT_REFERRAL_BONUS_LUA) as string;
    logger.info('Redis Lua scripts loaded successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to load Redis Lua scripts');
    throw err;
  }
}

export interface ProcessClickResult {
  success: boolean;
  errorCode?: number;
  errorStatus?: string;
  clickCount: number;
  accumulatedDiscount: number;
  revenue: number;
  timerRemaining: number;
  status: string;
}

export async function execProcessClick(
  userId: string,
  walletAddress: string,
  auctionId: string,
  discountPerClick: number,
  maxDiscountPct: number,
  prizeValue: number,
  minRevenueMultiplier: number,
  timerDurationMs: number,
  pricePerClick: number,
): Promise<ProcessClickResult> {
  const userClicksKey = `user:${userId}:clicks`;
  const auctionStateKey = `auction:${auctionId}:state`;
  const auctionTimerKey = `auction:${auctionId}:timer`;
  const rateLimitKey = `rate:${userId}:${auctionId}`;

  const result = await redis.evalsha(
    processClickSHA!,
    4,
    userClicksKey,
    auctionStateKey,
    auctionTimerKey,
    rateLimitKey,
    userId,
    walletAddress,
    discountPerClick.toString(),
    maxDiscountPct.toString(),
    prizeValue.toString(),
    minRevenueMultiplier.toString(),
    timerDurationMs.toString(),
    '1', // clickCost
    Date.now().toString(),
    '500', // rateLimitMs
    pricePerClick.toString(),
  ) as [number, number, string, string, number, string];

  const [successCode, clickCount, accDiscount, revenue, timerRemaining, status] = result;

  if (successCode < 0) {
    return {
      success: false,
      errorCode: successCode,
      errorStatus: status,
      clickCount: 0,
      accumulatedDiscount: 0,
      revenue: 0,
      timerRemaining: 0,
      status,
    };
  }

  return {
    success: true,
    clickCount,
    accumulatedDiscount: parseFloat(accDiscount),
    revenue: parseFloat(revenue),
    timerRemaining,
    status,
  };
}

export async function execCreditReferralBonus(
  referrerId: string,
  clicksToCredit: number,
): Promise<number> {
  const referrerClicksKey = `user:${referrerId}:clicks`;

  const newBalance = await redis.evalsha(
    creditReferralBonusSHA!,
    1,
    referrerClicksKey,
    clicksToCredit.toString(),
  ) as number;

  return newBalance;
}
