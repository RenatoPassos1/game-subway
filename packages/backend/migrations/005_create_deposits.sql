-- ============================================================
-- Migration 005: Create deposits table
-- Click Win Platform - On-chain deposit tracking (BNB/USDT on BSC)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS deposits (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tx_hash          VARCHAR(66)   NOT NULL,
    token            VARCHAR(10)   NOT NULL
                     CHECK (token IN ('BNB', 'USDT')),
    amount           DECIMAL(18,8) NOT NULL,
    confirmations    INTEGER       NOT NULL DEFAULT 0,
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN (
                         'PENDING',    -- Detected on-chain, awaiting confirmations
                         'CONFIRMED',  -- Reached MIN_CONFIRMATIONS threshold
                         'CREDITED',   -- Clicks credited to user balance
                         'FAILED'      -- Transaction reverted or invalid
                     )),
    deposit_address  VARCHAR(42)   NOT NULL,
    clicks_credited  INTEGER       NOT NULL DEFAULT 0,
    is_first_deposit BOOLEAN       NOT NULL DEFAULT false,
    detected_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    confirmed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Business constraints
    CONSTRAINT chk_deposit_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_confirmations_non_negative CHECK (confirmations >= 0),
    CONSTRAINT chk_clicks_credited_non_negative CHECK (clicks_credited >= 0)
);

-- Transaction hash uniqueness (prevent double-credit)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_tx_hash
    ON deposits (tx_hash);

-- User deposit history filtered by status
CREATE INDEX IF NOT EXISTS idx_deposits_user_status
    ON deposits (user_id, status);

-- Watcher service scans by deposit address for incoming tx matching
CREATE INDEX IF NOT EXISTS idx_deposits_deposit_address
    ON deposits (deposit_address)
    WHERE status = 'PENDING';

-- Pending deposits query for confirmation polling
CREATE INDEX IF NOT EXISTS idx_deposits_pending
    ON deposits (status, detected_at)
    WHERE status = 'PENDING';

COMMENT ON TABLE deposits IS 'On-chain deposit records from BNB Chain (BNB and USDT)';
COMMENT ON COLUMN deposits.tx_hash IS 'BNB Chain transaction hash (0x-prefixed, 66 chars)';
COMMENT ON COLUMN deposits.deposit_address IS 'HD-derived deposit address that received the funds';
COMMENT ON COLUMN deposits.is_first_deposit IS 'True if this was the user first-ever deposit (triggers referral bonus)';
COMMENT ON COLUMN deposits.clicks_credited IS 'Number of clicks credited from this deposit';

COMMIT;
