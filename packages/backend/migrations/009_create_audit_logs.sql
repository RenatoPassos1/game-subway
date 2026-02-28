-- ============================================================
-- Migration 009: Create audit_logs table
-- Click Win Platform - Append-only audit trail
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(50) NOT NULL,
    actor       VARCHAR(100) NOT NULL,
    payload     JSONB       NOT NULL DEFAULT '{}',
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary query: filter by event type within a time range
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type_created
    ON audit_logs (event_type, created_at DESC);

-- Time-range scans for admin dashboard
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC);

-- Actor-based lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
    ON audit_logs (actor, created_at DESC);

-- GIN index for JSONB payload queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_payload
    ON audit_logs USING GIN (payload);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail for all significant platform events';
COMMENT ON COLUMN audit_logs.event_type IS 'Event category (e.g. USER_REGISTERED, DEPOSIT_CREDITED, AUCTION_ENDED)';
COMMENT ON COLUMN audit_logs.actor IS 'Who triggered the event (user UUID, system service name, or admin ID)';
COMMENT ON COLUMN audit_logs.payload IS 'Structured event data as JSON';

-- ============================================================
-- Make audit_logs append-only for the application role
-- The app role should only INSERT, never UPDATE or DELETE.
-- Run these after creating the application database role.
-- ============================================================

-- NOTE: Uncomment and adjust role name for your environment:
-- REVOKE UPDATE, DELETE ON audit_logs FROM clickwin_app;
-- GRANT SELECT, INSERT ON audit_logs TO clickwin_app;

COMMIT;
