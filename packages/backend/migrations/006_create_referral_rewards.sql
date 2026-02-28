-- ============================================================
-- Migration 006: Create referral_rewards table
-- Click Win Platform - Referral bonus tracking (20% of first deposit clicks)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS referral_rewards (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    referred_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    deposit_id   UUID        NOT NULL REFERENCES deposits(id) ON DELETE RESTRICT,
    clicks_earned INTEGER    NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'CREDITED'
                 CHECK (status IN ('PENDING', 'CREDITED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One referral reward per deposit (prevent double-bonus)
    CONSTRAINT uq_referral_rewards_deposit
        UNIQUE (deposit_id),

    -- Referrer and referred must be different users
    CONSTRAINT chk_referral_not_self
        CHECK (referrer_id <> referred_id),

    -- Business constraints
    CONSTRAINT chk_clicks_earned_positive CHECK (clicks_earned > 0)
);

-- Referrer dashboard: list all bonuses earned
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer
    ON referral_rewards (referrer_id, created_at DESC);

-- Referred user lookup
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred
    ON referral_rewards (referred_id);

COMMENT ON TABLE referral_rewards IS 'Tracks referral bonus clicks awarded to referrers';
COMMENT ON COLUMN referral_rewards.clicks_earned IS 'Number of bonus clicks awarded (20% of referred user first deposit clicks)';
COMMENT ON COLUMN referral_rewards.deposit_id IS 'The first deposit that triggered this referral reward';

COMMIT;
