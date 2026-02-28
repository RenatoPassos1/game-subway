-- ============================================================
-- Migration 008: Create deposit_addresses table
-- Click Win Platform - HD-derived deposit addresses per user
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS deposit_addresses (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    address          VARCHAR(42) NOT NULL,
    derivation_index INTEGER     NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each user gets exactly one deposit address
    CONSTRAINT uq_deposit_addresses_user
        UNIQUE (user_id),

    -- Each address is globally unique
    CONSTRAINT uq_deposit_addresses_address
        UNIQUE (address),

    -- Derivation index must be unique (sequential HD wallet index)
    CONSTRAINT uq_deposit_addresses_derivation_index
        UNIQUE (derivation_index),

    -- Business constraints
    CONSTRAINT chk_derivation_index_non_negative CHECK (derivation_index >= 0)
);

-- Fast lookup by address (watcher service incoming tx matching)
CREATE INDEX IF NOT EXISTS idx_deposit_addresses_address
    ON deposit_addresses (LOWER(address));

COMMENT ON TABLE deposit_addresses IS 'HD-derived BNB Chain deposit addresses (one per user)';
COMMENT ON COLUMN deposit_addresses.address IS 'BNB Chain address derived from master HD wallet';
COMMENT ON COLUMN deposit_addresses.derivation_index IS 'BIP-44 derivation path index (m/44''/60''/0''/0/index)';

COMMIT;
