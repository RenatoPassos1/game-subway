-- ============================================================
-- Migration 003: Create click_balances table
-- Click Win Platform - User click inventory
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS click_balances (
    user_id          UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    available_clicks INTEGER NOT NULL DEFAULT 0
                     CHECK (available_clicks >= 0),
    total_purchased  INTEGER NOT NULL DEFAULT 0
                     CHECK (total_purchased >= 0),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE click_balances IS 'Current click balance per user (1:1 with users)';
COMMENT ON COLUMN click_balances.available_clicks IS 'Clicks available to spend in auctions';
COMMENT ON COLUMN click_balances.total_purchased IS 'Lifetime total clicks purchased (includes referral bonuses)';

COMMIT;
