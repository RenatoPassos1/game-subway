-- ============================================================
-- credit-referral-bonus.lua
-- Atomic referral bonus crediting for Click Win.
--
-- Credits bonus clicks to the referrer when a referred user
-- makes their first deposit. Awards 20% of the deposit's
-- click value to the referrer.
--
-- KEYS:
--   [1] = referrer clicks key       (user:{referrerId}:clicks)
--   [2] = referrer referral stats   (user:{referrerId}:referral_stats)
--
-- ARGV:
--   [1] = bonusClicks (integer, number of bonus clicks to award)
--   [2] = referredUserId (for stats tracking)
--   [3] = depositId (for idempotency reference)
--
-- RETURNS: JSON string with referral bonus result
-- ============================================================

local referrerClicksKey = KEYS[1]
local referrerStatsKey  = KEYS[2]

local bonusClicks    = tonumber(ARGV[1])
local referredUserId = ARGV[2]
local depositId      = ARGV[3]

-- ============================================================
-- Validation
-- ============================================================
if bonusClicks == nil or bonusClicks <= 0 then
    return cjson.encode({
        ok = false,
        error = 'INVALID_BONUS',
        message = 'Bonus clicks must be a positive integer.'
    })
end

-- ============================================================
-- Step 1: Credit bonus clicks to referrer balance
-- ============================================================
local newBalance = redis.call('INCRBY', referrerClicksKey, bonusClicks)

-- ============================================================
-- Step 2: Update referral statistics
-- ============================================================
-- Increment total bonus clicks earned lifetime
redis.call('HINCRBY', referrerStatsKey, 'totalClicksEarned', bonusClicks)

-- Increment total referred users count
redis.call('HINCRBY', referrerStatsKey, 'totalReferred', 1)

-- Store the last referral event timestamp
redis.call('HSET', referrerStatsKey, 'lastReferralAt', tostring(redis.call('TIME')[1]))

-- ============================================================
-- Return result for WebSocket notification to referrer
-- ============================================================
return cjson.encode({
    ok = true,
    newBalance = newBalance,
    bonusClicks = bonusClicks,
    referredUserId = referredUserId,
    depositId = depositId,
    totalClicksEarned = tonumber(redis.call('HGET', referrerStatsKey, 'totalClicksEarned')),
    totalReferred = tonumber(redis.call('HGET', referrerStatsKey, 'totalReferred'))
})
