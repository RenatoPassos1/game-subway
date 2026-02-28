-- ============================================================
-- Migration 010: Create utility functions and triggers
-- Click Win Platform - Auto-update timestamps & referral codes
-- ============================================================

BEGIN;

-- ============================================================
-- Function: update_updated_at_column()
-- Automatically sets updated_at to NOW() on row update.
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column()
    IS 'Trigger function: auto-sets updated_at = NOW() on UPDATE';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to auctions table
DROP TRIGGER IF EXISTS trg_auctions_updated_at ON auctions;
CREATE TRIGGER trg_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to click_balances table
DROP TRIGGER IF EXISTS trg_click_balances_updated_at ON click_balances;
CREATE TRIGGER trg_click_balances_updated_at
    BEFORE UPDATE ON click_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Function: generate_referral_code()
-- Generates a unique 6-character uppercase alphanumeric code.
-- Uses a loop to guarantee uniqueness against existing codes.
-- ============================================================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars  TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code   TEXT := '';
    i      INTEGER;
    exists BOOLEAN;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..6 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;

        -- Check uniqueness
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;

        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_referral_code()
    IS 'Generates a unique 6-char uppercase alphanumeric referral code';

-- ============================================================
-- Function: credit_clicks()
-- Atomically credits clicks to a user balance.
-- Used by deposit processing and referral bonus flows.
-- ============================================================

CREATE OR REPLACE FUNCTION credit_clicks(
    p_user_id UUID,
    p_clicks  INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    INSERT INTO click_balances (user_id, available_clicks, total_purchased, updated_at)
    VALUES (p_user_id, p_clicks, p_clicks, NOW())
    ON CONFLICT (user_id) DO UPDATE
        SET available_clicks = click_balances.available_clicks + p_clicks,
            total_purchased  = click_balances.total_purchased + p_clicks,
            updated_at       = NOW()
    RETURNING available_clicks INTO new_balance;

    RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION credit_clicks(UUID, INTEGER)
    IS 'Atomically credit clicks to user balance (upsert pattern)';

-- ============================================================
-- Function: record_audit_event()
-- Helper to insert audit log entries with consistent format.
-- ============================================================

CREATE OR REPLACE FUNCTION record_audit_event(
    p_event_type VARCHAR(50),
    p_actor      VARCHAR(100),
    p_payload    JSONB DEFAULT '{}',
    p_ip_address INET  DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (event_type, actor, payload, ip_address)
    VALUES (p_event_type, p_actor, p_payload, p_ip_address)
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_audit_event(VARCHAR, VARCHAR, JSONB, INET)
    IS 'Insert an audit log entry and return its ID';

COMMIT;
