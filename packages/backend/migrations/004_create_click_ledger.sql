-- ============================================================
-- Migration 004: Create click_ledger table
-- Click Win Platform - Immutable record of every click in auctions
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS click_ledger (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    auction_id       UUID          NOT NULL REFERENCES auctions(id) ON DELETE RESTRICT,
    click_number     INTEGER       NOT NULL,
    discount_applied DECIMAL(18,8) NOT NULL,
    timestamp        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Each click number within an auction is unique (sequential)
    CONSTRAINT uq_click_ledger_auction_click
        UNIQUE (auction_id, click_number),

    -- Business constraints
    CONSTRAINT chk_click_number_positive CHECK (click_number > 0),
    CONSTRAINT chk_discount_applied_positive CHECK (discount_applied > 0)
);

-- Primary query pattern: get all clicks for an auction ordered by time
CREATE INDEX IF NOT EXISTS idx_click_ledger_auction_timestamp
    ON click_ledger (auction_id, timestamp);

-- User click history
CREATE INDEX IF NOT EXISTS idx_click_ledger_user_id
    ON click_ledger (user_id, timestamp DESC);

COMMENT ON TABLE click_ledger IS 'Append-only ledger of every click placed in auctions';
COMMENT ON COLUMN click_ledger.click_number IS 'Sequential click number within the auction (1-based)';
COMMENT ON COLUMN click_ledger.discount_applied IS 'Discount value applied by this specific click';

COMMIT;
