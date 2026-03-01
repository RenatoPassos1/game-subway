-- ============================================================
-- Migration 012: Crypto Payment Orders for Advertising
-- Click Win Platform - On-chain payment verification for ad slots
-- ============================================================

BEGIN;

-- ============================================================
-- Table: ad_crypto_orders
-- Payment orders for advertising campaigns (BNB or USDT on BSC).
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_crypto_orders (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID          NOT NULL REFERENCES ad_campaigns(id) ON DELETE RESTRICT,
    advertiser_id   UUID          NOT NULL REFERENCES advertisers(id) ON DELETE RESTRICT,

    -- Payment details
    token           VARCHAR(10)   NOT NULL
                    CHECK (token IN ('BNB', 'USDT')),
    amount_usdt     DECIMAL(18,8) NOT NULL,
    amount_token    DECIMAL(18,8) NOT NULL,
    bnb_price_usdt  DECIMAL(18,8),
    receiver_wallet VARCHAR(42)   NOT NULL
                    DEFAULT '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48',

    -- Transaction tracking
    tx_hash         VARCHAR(66),
    confirmations   INTEGER       NOT NULL DEFAULT 0,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN (
                        'PENDING',       -- Awaiting payment from advertiser
                        'SUBMITTED',     -- TX hash submitted, awaiting confirmation
                        'CONFIRMING',    -- On-chain, counting confirmations
                        'CONFIRMED',     -- Payment confirmed on-chain
                        'FAILED',        -- Transaction failed or reverted
                        'EXPIRED',       -- Order expired (not paid in time)
                        'REFUNDED'       -- Payment refunded
                    )),

    -- Verification data from blockchain
    verified_amount DECIMAL(18,8),
    verified_from   VARCHAR(42),
    block_number    BIGINT,
    block_timestamp TIMESTAMPTZ,

    -- Timestamps
    expires_at      TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    submitted_at    TIMESTAMPTZ,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_order_amount_positive CHECK (amount_usdt > 0),
    CONSTRAINT chk_order_token_amount_positive CHECK (amount_token > 0),
    CONSTRAINT chk_order_confirmations_non_negative CHECK (confirmations >= 0)
);

-- TX hash uniqueness (prevent double-credit)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_orders_tx_hash
    ON ad_crypto_orders (tx_hash)
    WHERE tx_hash IS NOT NULL;

-- Campaign lookup
CREATE INDEX IF NOT EXISTS idx_ad_orders_campaign
    ON ad_crypto_orders (campaign_id);

-- Advertiser orders
CREATE INDEX IF NOT EXISTS idx_ad_orders_advertiser
    ON ad_crypto_orders (advertiser_id, status);

-- Pending orders for watcher/cron
CREATE INDEX IF NOT EXISTS idx_ad_orders_pending
    ON ad_crypto_orders (status, created_at)
    WHERE status IN ('PENDING', 'SUBMITTED', 'CONFIRMING');

-- Expired order cleanup
CREATE INDEX IF NOT EXISTS idx_ad_orders_expires
    ON ad_crypto_orders (expires_at)
    WHERE status = 'PENDING';

COMMENT ON TABLE ad_crypto_orders IS 'Crypto payment orders for advertising campaigns';
COMMENT ON COLUMN ad_crypto_orders.receiver_wallet IS 'Platform wallet that receives the payment';
COMMENT ON COLUMN ad_crypto_orders.bnb_price_usdt IS 'BNB/USDT exchange rate at order creation time';
COMMENT ON COLUMN ad_crypto_orders.expires_at IS 'Order expires if not paid within 30 minutes';

-- ============================================================
-- Table: ad_payment_log
-- Immutable log of all payment-related events for ads.
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_payment_log (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID          NOT NULL REFERENCES ad_crypto_orders(id) ON DELETE RESTRICT,
    campaign_id     UUID          NOT NULL REFERENCES ad_campaigns(id) ON DELETE RESTRICT,
    event           VARCHAR(50)   NOT NULL,
    details         JSONB         NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_log_order
    ON ad_payment_log (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_log_campaign
    ON ad_payment_log (campaign_id, created_at DESC);

COMMENT ON TABLE ad_payment_log IS 'Immutable payment event log for advertising orders';
COMMENT ON COLUMN ad_payment_log.event IS 'Event type: CREATED, SUBMITTED, CONFIRMING, CONFIRMED, FAILED, EXPIRED, REFUNDED';

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================

DROP TRIGGER IF EXISTS trg_ad_orders_updated_at ON ad_crypto_orders;
CREATE TRIGGER trg_ad_orders_updated_at
    BEFORE UPDATE ON ad_crypto_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
