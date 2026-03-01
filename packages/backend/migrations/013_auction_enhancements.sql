-- ============================================================
-- Migration 013: Auction Enhancements
-- Click Win Platform - Image support, scheduling, display order
-- ============================================================

BEGIN;

-- Add image URL for auction cards
ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);

-- Scheduled start time (for "upcoming auctions" feature)
ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;

-- Whether this is the main/featured auction
ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT false;

-- Display order for upcoming auctions list
ALTER TABLE auctions
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Index for upcoming auctions sorted by scheduled start
CREATE INDEX IF NOT EXISTS idx_auctions_upcoming
    ON auctions (scheduled_start)
    WHERE status = 'PENDING' AND scheduled_start IS NOT NULL;

-- Index for main auction lookup
CREATE INDEX IF NOT EXISTS idx_auctions_main
    ON auctions (is_main)
    WHERE is_main = true AND status IN ('PENDING', 'ACTIVE', 'CLOSING');

-- Index for display ordering
CREATE INDEX IF NOT EXISTS idx_auctions_display_order
    ON auctions (display_order, scheduled_start)
    WHERE status = 'PENDING';

COMMENT ON COLUMN auctions.image_url IS 'URL of the auction prize image';
COMMENT ON COLUMN auctions.scheduled_start IS 'When the auction is scheduled to start (for upcoming list)';
COMMENT ON COLUMN auctions.is_main IS 'True if this is the currently featured/main auction card';
COMMENT ON COLUMN auctions.display_order IS 'Sort order for upcoming auctions (lower = higher priority)';

COMMIT;
