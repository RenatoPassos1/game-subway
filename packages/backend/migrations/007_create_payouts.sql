-- ============================================================
-- Migration 007: Create payouts table
-- Click Win Platform - Winner prize payout records
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS payouts (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id       UUID          NOT NULL REFERENCES auctions(id) ON DELETE RESTRICT,
    winner_id        UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    gross_amount     DECIMAL(18,8) NOT NULL,
    net_amount       DECIMAL(18,8) NOT NULL,
    platform_fee     DECIMAL(18,8) NOT NULL DEFAULT 0,
    applied_discount DECIMAL(4,2)  NOT NULL,
    tx_hash          VARCHAR(66),
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN (
                         'PENDING',     -- Awaiting settlement service
                         'PROCESSING',  -- On-chain transaction submitted
                         'COMPLETED',   -- Transaction confirmed on-chain
                         'FAILED'       -- Transaction failed, needs retry
                     )),
    executed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Business constraints
    CONSTRAINT chk_gross_amount_positive CHECK (gross_amount > 0),
    CONSTRAINT chk_net_amount_positive CHECK (net_amount > 0),
    CONSTRAINT chk_net_lte_gross CHECK (net_amount <= gross_amount),
    CONSTRAINT chk_platform_fee_non_negative CHECK (platform_fee >= 0),
    CONSTRAINT chk_applied_discount_range CHECK (applied_discount >= 0 AND applied_discount <= 1)
);

-- Settlement service queries by auction + status
CREATE INDEX IF NOT EXISTS idx_payouts_auction_status
    ON payouts (auction_id, status);

-- Pending payouts for settlement service polling
CREATE INDEX IF NOT EXISTS idx_payouts_pending
    ON payouts (status, created_at)
    WHERE status IN ('PENDING', 'PROCESSING');

-- Winner payout history
CREATE INDEX IF NOT EXISTS idx_payouts_winner
    ON payouts (winner_id, created_at DESC);

COMMENT ON TABLE payouts IS 'On-chain prize payout records for auction winners';
COMMENT ON COLUMN payouts.gross_amount IS 'Prize value before discount (= auction.prize_value)';
COMMENT ON COLUMN payouts.net_amount IS 'Actual payout after discount (gross * (1 - applied_discount))';
COMMENT ON COLUMN payouts.platform_fee IS 'Platform fee deducted (if any)';
COMMENT ON COLUMN payouts.applied_discount IS 'Discount percentage applied (0.00 to 1.00)';
COMMENT ON COLUMN payouts.tx_hash IS 'BNB Chain transaction hash of the payout transfer';

COMMIT;
