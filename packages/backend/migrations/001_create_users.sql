-- ============================================================
-- Migration 001: Create users table
-- Click Win Platform - User accounts linked to BNB wallets
-- ============================================================

BEGIN;

-- Enable UUID generation (required for gen_random_uuid on PG < 14)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Derivation index sequence for HD wallet deposit addresses
CREATE SEQUENCE IF NOT EXISTS deposit_address_index_seq START WITH 1;

CREATE TABLE IF NOT EXISTS users (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address        VARCHAR(42) NOT NULL,
    nonce                 VARCHAR(64),
    referral_code         VARCHAR(6)  NOT NULL,
    referred_by           UUID        REFERENCES users(id) ON DELETE SET NULL,
    referral_bonus_pending BOOLEAN    DEFAULT false,
    terms_accepted_at     TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet address must be unique (one account per wallet)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address
    ON users (LOWER(wallet_address));

-- Referral codes are unique 6-char alphanumeric
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code
    ON users (referral_code);

-- Fast lookup for referral tree queries
CREATE INDEX IF NOT EXISTS idx_users_referred_by
    ON users (referred_by)
    WHERE referred_by IS NOT NULL;

COMMENT ON TABLE users IS 'Platform users authenticated via BNB wallet signature';
COMMENT ON COLUMN users.wallet_address IS 'BNB Chain wallet address (0x-prefixed, 42 chars)';
COMMENT ON COLUMN users.nonce IS 'One-time nonce for SIWE signature verification';
COMMENT ON COLUMN users.referral_code IS 'Unique 6-char uppercase alphanumeric referral code';
COMMENT ON COLUMN users.referred_by IS 'User ID of the referrer (nullable)';
COMMENT ON COLUMN users.referral_bonus_pending IS 'True if user was referred but referrer bonus not yet granted';

COMMIT;
