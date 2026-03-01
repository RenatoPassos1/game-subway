-- ============================================================
-- Migration 011: Advertising System
-- Click Win Platform - Admin panel, advertisers, campaigns, ad slots
-- ============================================================

BEGIN;

-- ============================================================
-- Table: admins
-- Platform administrators with wallet-based access.
-- The FOUNDER role has unrestricted access.
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  VARCHAR(42)   NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'ADMIN'
                    CHECK (role IN ('FOUNDER', 'ADMIN', 'MODERATOR')),
    label           VARCHAR(100),
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_wallet
    ON admins (LOWER(wallet_address));

COMMENT ON TABLE admins IS 'Platform administrators identified by wallet address';
COMMENT ON COLUMN admins.role IS 'FOUNDER = full access, ADMIN = management, MODERATOR = limited';

-- Seed founder wallet
INSERT INTO admins (wallet_address, role, label)
VALUES ('0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48', 'FOUNDER', 'Platform Founder')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Table: advertisers
-- Advertisers register via wallet sign-in (no KYC required).
-- ============================================================

CREATE TABLE IF NOT EXISTS advertisers (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    wallet_address  VARCHAR(42)   NOT NULL,
    display_name    VARCHAR(100)  NOT NULL,
    email           VARCHAR(255),
    whatsapp        VARCHAR(30),
    telegram        VARCHAR(100),
    website         VARCHAR(500),
    social_links    JSONB         NOT NULL DEFAULT '{}',
    is_verified     BOOLEAN       NOT NULL DEFAULT false,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_advertisers_user
    ON advertisers (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_advertisers_wallet
    ON advertisers (LOWER(wallet_address));

COMMENT ON TABLE advertisers IS 'Registered advertisers (wallet-based, no KYC)';
COMMENT ON COLUMN advertisers.social_links IS 'JSON object with social media links (twitter, instagram, etc.)';

-- ============================================================
-- Table: ad_slot_types
-- Defines available advertising slot types and pricing.
-- carousel = 150 USDT (always 3 rotating), side_card = 100 USDT
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_slot_types (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(30)   NOT NULL,
    label           VARCHAR(100)  NOT NULL,
    description     TEXT,
    price_usdt      DECIMAL(18,8) NOT NULL,
    duration_days   INTEGER       NOT NULL DEFAULT 5,
    max_concurrent  INTEGER       NOT NULL DEFAULT 3,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_slot_price_positive CHECK (price_usdt > 0),
    CONSTRAINT chk_slot_duration_positive CHECK (duration_days > 0),
    CONSTRAINT chk_slot_max_concurrent_positive CHECK (max_concurrent > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_slot_types_slug
    ON ad_slot_types (slug);

COMMENT ON TABLE ad_slot_types IS 'Available advertising slot types with pricing';
COMMENT ON COLUMN ad_slot_types.max_concurrent IS 'Max number of ads running simultaneously in this slot type';

-- Seed slot types
INSERT INTO ad_slot_types (slug, label, description, price_usdt, duration_days, max_concurrent) VALUES
    ('carousel', 'Hero Carousel', 'Rotating banner in the hero section (always 3 ads rotating)', 150.00000000, 5, 3),
    ('side_card', 'Side Card', 'Card displayed beside the hero carousel', 100.00000000, 5, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Table: ad_campaigns
-- Each campaign represents a purchased ad slot booking.
-- Queue system: ordered by purchase date (queue_position).
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id   UUID          NOT NULL REFERENCES advertisers(id) ON DELETE RESTRICT,
    slot_type_id    UUID          NOT NULL REFERENCES ad_slot_types(id) ON DELETE RESTRICT,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING_PAYMENT'
                    CHECK (status IN (
                        'PENDING_PAYMENT',  -- Awaiting crypto payment
                        'PAID',             -- Payment confirmed, awaiting review
                        'APPROVED',         -- Admin approved, in queue
                        'SCHEDULED',        -- Has assigned start/end dates
                        'LIVE',             -- Currently being displayed
                        'COMPLETED',        -- Display period finished
                        'REJECTED',         -- Admin rejected
                        'CANCELLED',        -- Advertiser cancelled
                        'REFUNDED'          -- Payment refunded
                    )),

    -- Ad content
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    image_url       VARCHAR(1000),
    click_url       VARCHAR(1000),

    -- Token promotion fields (optional)
    is_token_promo  BOOLEAN       NOT NULL DEFAULT false,
    token_address   VARCHAR(42),
    token_name      VARCHAR(100),
    token_exchanges JSONB         NOT NULL DEFAULT '[]',

    -- Queue & scheduling
    queue_position  INTEGER,
    scheduled_start TIMESTAMPTZ,
    scheduled_end   TIMESTAMPTZ,
    actual_start    TIMESTAMPTZ,
    actual_end      TIMESTAMPTZ,

    -- Payment
    price_usdt      DECIMAL(18,8) NOT NULL,
    price_bnb       DECIMAL(18,8),
    paid_token      VARCHAR(10)
                    CHECK (paid_token IS NULL OR paid_token IN ('BNB', 'USDT')),
    paid_amount     DECIMAL(18,8),
    payment_tx_hash VARCHAR(66),

    -- Tracking
    impressions     BIGINT        NOT NULL DEFAULT 0,
    clicks          BIGINT        NOT NULL DEFAULT 0,

    -- Timestamps
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_campaign_price_positive CHECK (price_usdt > 0),
    CONSTRAINT chk_campaign_dates CHECK (
        scheduled_end IS NULL OR scheduled_start IS NULL OR scheduled_end > scheduled_start
    )
);

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser
    ON ad_campaigns (advertiser_id, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_slot_status
    ON ad_campaigns (slot_type_id, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_live
    ON ad_campaigns (slot_type_id, status, scheduled_start)
    WHERE status IN ('LIVE', 'SCHEDULED', 'APPROVED');

CREATE INDEX IF NOT EXISTS idx_campaigns_queue
    ON ad_campaigns (slot_type_id, queue_position)
    WHERE status IN ('APPROVED', 'SCHEDULED');

CREATE INDEX IF NOT EXISTS idx_campaigns_payment_tx
    ON ad_campaigns (payment_tx_hash)
    WHERE payment_tx_hash IS NOT NULL;

COMMENT ON TABLE ad_campaigns IS 'Advertising campaign bookings with queue ordering';
COMMENT ON COLUMN ad_campaigns.queue_position IS 'Position in queue (lower = earlier). Set on approval.';
COMMENT ON COLUMN ad_campaigns.token_exchanges IS 'JSON array of exchange names where token is listed';

-- ============================================================
-- Table: ad_impressions_daily
-- Aggregated daily impression/click stats per campaign.
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_impressions_daily (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID          NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date            DATE          NOT NULL,
    impressions     BIGINT        NOT NULL DEFAULT 0,
    clicks          BIGINT        NOT NULL DEFAULT 0,

    CONSTRAINT chk_impressions_non_negative CHECK (impressions >= 0),
    CONSTRAINT chk_clicks_non_negative CHECK (clicks >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_impressions_daily_campaign_date
    ON ad_impressions_daily (campaign_id, date);

COMMENT ON TABLE ad_impressions_daily IS 'Daily aggregated impression and click counts per campaign';

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_advertisers_updated_at ON advertisers;
CREATE TRIGGER trg_advertisers_updated_at
    BEFORE UPDATE ON advertisers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON ad_campaigns;
CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
