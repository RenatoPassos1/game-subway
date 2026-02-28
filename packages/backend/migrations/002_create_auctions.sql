-- ============================================================
-- Migration 002: Create auctions table
-- Click Win Platform - Penny auction instances
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS auctions (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_value           DECIMAL(18,8) NOT NULL,
    prize_token           VARCHAR(10)   NOT NULL DEFAULT 'USDT',
    prize_description     TEXT,
    status                VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN (
                              'PENDING',    -- Created, not yet started
                              'ACTIVE',     -- Accepting clicks
                              'CLOSING',    -- Revenue threshold met, timer running down
                              'ENDED',      -- Timer expired, winner determined
                              'SETTLED',    -- Prize paid out on-chain
                              'PAUSED',     -- Temporarily suspended by admin
                              'CANCELLED'   -- Cancelled, no winner
                          )),
    min_revenue_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.20,
    max_discount_pct      DECIMAL(4,2)  NOT NULL DEFAULT 0.50,
    discount_per_click    DECIMAL(18,8) NOT NULL,
    timer_duration        INTEGER       NOT NULL DEFAULT 30000,
    click_count           INTEGER       NOT NULL DEFAULT 0,
    accumulated_discount  DECIMAL(18,8) NOT NULL DEFAULT 0,
    revenue               DECIMAL(18,8) NOT NULL DEFAULT 0,
    winner_id             UUID          REFERENCES users(id) ON DELETE SET NULL,
    final_discount        DECIMAL(18,8),
    started_at            TIMESTAMPTZ,
    ended_at              TIMESTAMPTZ,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Business constraints
    CONSTRAINT chk_prize_value_positive CHECK (prize_value > 0),
    CONSTRAINT chk_discount_per_click_positive CHECK (discount_per_click > 0),
    CONSTRAINT chk_timer_duration_positive CHECK (timer_duration > 0),
    CONSTRAINT chk_click_count_non_negative CHECK (click_count >= 0),
    CONSTRAINT chk_accumulated_discount_non_negative CHECK (accumulated_discount >= 0),
    CONSTRAINT chk_revenue_non_negative CHECK (revenue >= 0),
    CONSTRAINT chk_max_discount_range CHECK (max_discount_pct > 0 AND max_discount_pct <= 1),
    CONSTRAINT chk_min_revenue_multiplier_range CHECK (min_revenue_multiplier >= 1)
);

-- Active/closing auctions are queried constantly by the app
CREATE INDEX IF NOT EXISTS idx_auctions_status
    ON auctions (status)
    WHERE status IN ('PENDING', 'ACTIVE', 'CLOSING');

-- For listing/sorting auctions by start time
CREATE INDEX IF NOT EXISTS idx_auctions_started_at
    ON auctions (started_at DESC)
    WHERE started_at IS NOT NULL;

-- Winner lookup
CREATE INDEX IF NOT EXISTS idx_auctions_winner_id
    ON auctions (winner_id)
    WHERE winner_id IS NOT NULL;

COMMENT ON TABLE auctions IS 'Penny auction instances with progressive discount model';
COMMENT ON COLUMN auctions.prize_value IS 'Prize value in prize_token denomination';
COMMENT ON COLUMN auctions.min_revenue_multiplier IS 'Minimum revenue/prize ratio before CLOSING state (e.g. 1.20 = 120%)';
COMMENT ON COLUMN auctions.max_discount_pct IS 'Maximum discount the winner can receive (e.g. 0.50 = 50%)';
COMMENT ON COLUMN auctions.discount_per_click IS 'Discount increment per click in prize_token';
COMMENT ON COLUMN auctions.timer_duration IS 'Countdown timer duration in milliseconds';
COMMENT ON COLUMN auctions.accumulated_discount IS 'Sum of all discount_per_click applied so far';
COMMENT ON COLUMN auctions.revenue IS 'Total USDT revenue from click purchases attributed to this auction';

COMMIT;
