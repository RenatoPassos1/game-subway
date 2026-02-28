-- ============================================================
-- process-click.lua
-- Atomic click processing for Click Win auctions.
--
-- Executes the full click pipeline in a single Redis EVAL:
--   1. Rate-limit check (1 click per 500ms per user per auction)
--   2. Validate user has available clicks
--   3. Validate auction is in ACTIVE or CLOSING state
--   4. Atomically: decrby user clicks, hincrby clickCount,
--      hincrbyfloat discount, hincrbyfloat revenue
--   5. Update lastClick hash, reset timer TTL
--   6. Check if revenue >= prize * multiplier -> set CLOSING
--   7. Return updated state for WebSocket broadcast
--
-- KEYS:
--   [1] = auction state hash       (auction:{id}:state)
--   [2] = user clicks key          (user:{id}:clicks)
--   [3] = auction last click hash  (auction:{id}:lastClick)
--   [4] = rate limit key           (rate:{userId}:{auctionId})
--
-- ARGV:
--   [1] = userId
--   [2] = discountPerClick (string-encoded decimal)
--   [3] = timerDuration (ms, integer)
--   [4] = minRevenueMultiplier (string-encoded decimal, e.g. "1.20")
--   [5] = prizeValue (string-encoded decimal)
--   [6] = walletAddress
--   [7] = timestamp (ms since epoch)
--   [8] = clickPrice (USDT per click, e.g. "0.20")
--   [9] = maxDiscountPct (e.g. "0.50")
--
-- RETURNS: JSON string with click result or error
-- ============================================================

local auctionKey   = KEYS[1]
local userClickKey = KEYS[2]
local lastClickKey = KEYS[3]
local rateLimitKey = KEYS[4]

local userId              = ARGV[1]
local discountPerClick    = ARGV[2]
local timerDuration       = tonumber(ARGV[3])
local minRevenueMultiplier = tonumber(ARGV[4])
local prizeValue          = tonumber(ARGV[5])
local walletAddress       = ARGV[6]
local timestamp           = ARGV[7]
local clickPrice          = ARGV[8]
local maxDiscountPct      = tonumber(ARGV[9])

-- ============================================================
-- Step 1: Rate limit check (500ms cooldown)
-- ============================================================
local rateLimited = redis.call('EXISTS', rateLimitKey)
if rateLimited == 1 then
    return cjson.encode({
        ok = false,
        error = 'RATE_LIMITED',
        message = 'Click too fast. Wait 500ms between clicks.'
    })
end

-- ============================================================
-- Step 2: Validate user has available clicks
-- ============================================================
local userClicks = tonumber(redis.call('GET', userClickKey) or '0')
if userClicks == nil or userClicks <= 0 then
    return cjson.encode({
        ok = false,
        error = 'NO_CLICKS',
        message = 'No clicks available. Purchase more clicks.'
    })
end

-- ============================================================
-- Step 3: Validate auction status
-- ============================================================
local status = redis.call('HGET', auctionKey, 'status')
if status ~= 'ACTIVE' and status ~= 'CLOSING' then
    return cjson.encode({
        ok = false,
        error = 'AUCTION_NOT_ACTIVE',
        message = 'Auction is not accepting clicks.',
        status = status or 'UNKNOWN'
    })
end

-- ============================================================
-- Step 4: Atomic state mutations
-- ============================================================

-- 4a. Deduct one click from user balance
local newClickBalance = redis.call('DECRBY', userClickKey, 1)

-- Safety: if somehow went negative, rollback
if newClickBalance < 0 then
    redis.call('INCRBY', userClickKey, 1)
    return cjson.encode({
        ok = false,
        error = 'NO_CLICKS',
        message = 'Race condition: clicks exhausted.'
    })
end

-- 4b. Increment auction click count
local newClickCount = redis.call('HINCRBY', auctionKey, 'clickCount', 1)

-- 4c. Accumulate discount (capped at maxDiscountPct * prizeValue)
local currentDiscount = tonumber(redis.call('HGET', auctionKey, 'accumulatedDiscount') or '0')
local maxDiscountValue = maxDiscountPct * prizeValue
local newDiscountRaw = currentDiscount + tonumber(discountPerClick)
local cappedDiscount = math.min(newDiscountRaw, maxDiscountValue)
local actualDiscountApplied = cappedDiscount - currentDiscount

redis.call('HSET', auctionKey, 'accumulatedDiscount', tostring(cappedDiscount))

-- 4d. Increment revenue (one click = one clickPrice in USDT)
local newRevenue = tonumber(redis.call('HINCRBYFLOAT', auctionKey, 'revenue', clickPrice))

-- ============================================================
-- Step 5: Set rate limit (500ms TTL) and update last click
-- ============================================================
redis.call('SET', rateLimitKey, '1', 'PX', 500)

redis.call('HMSET', lastClickKey,
    'userId', userId,
    'walletAddress', walletAddress,
    'timestamp', timestamp,
    'clickNumber', tostring(newClickCount)
)

-- ============================================================
-- Step 6: Reset auction timer
-- Compute timer TTL in milliseconds from timerDuration
-- ============================================================
local timerKey = string.gsub(auctionKey, ':state$', ':timer')
redis.call('SET', timerKey, timestamp, 'PX', timerDuration)

-- ============================================================
-- Step 7: Check revenue threshold -> transition to CLOSING
-- ============================================================
local newStatus = status
local minRevenue = prizeValue * minRevenueMultiplier

if status == 'ACTIVE' and newRevenue >= minRevenue then
    newStatus = 'CLOSING'
    redis.call('HSET', auctionKey, 'status', 'CLOSING')
end

-- ============================================================
-- Return click result for WebSocket broadcast
-- ============================================================
return cjson.encode({
    ok = true,
    auctionId = redis.call('HGET', auctionKey, 'id'),
    userId = userId,
    walletAddress = walletAddress,
    clickNumber = newClickCount,
    discountApplied = actualDiscountApplied,
    accumulatedDiscount = cappedDiscount,
    revenue = newRevenue,
    clickCount = newClickCount,
    status = newStatus,
    timerRemaining = timerDuration,
    userClicksRemaining = newClickBalance,
    timestamp = timestamp
})
