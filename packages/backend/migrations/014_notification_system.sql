-- Migration 014: Notification system (Web Push + Telegram)

-- 1) Subscriptions for push and telegram channels
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel         TEXT            NOT NULL CHECK (channel IN ('push','telegram')),
    destination     JSONB           NOT NULL,
    preferences     JSONB           NOT NULL DEFAULT '{"events":["auction_scheduled","starts_60","starts_30","starts_5","live_now"]}'::jsonb,
    is_active       BOOLEAN         NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, channel)
);

-- 2) One-time tokens used to link a Telegram chat to a user account
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token           TEXT            PRIMARY KEY,
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ     NOT NULL,
    used_at         TIMESTAMPTZ     NULL
);

-- 3) Audit log for every notification attempt
CREATE TABLE IF NOT EXISTS notification_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            REFERENCES users(id) ON DELETE SET NULL,
    channel         TEXT            NOT NULL,
    event_type      TEXT            NOT NULL,
    payload         JSONB,
    status          TEXT            NOT NULL CHECK (status IN ('queued','sent','failed','skipped')),
    error_text      TEXT            NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notif_subs_user     ON notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_subs_channel  ON notification_subscriptions(channel, is_active);
CREATE INDEX IF NOT EXISTS idx_notif_logs_user     ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status   ON notification_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_expires ON telegram_link_tokens(expires_at);
