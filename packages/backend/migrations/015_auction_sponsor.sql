-- 015_auction_sponsor.sql
-- Add sponsor fields and payment transaction hash to auctions

ALTER TABLE auctions ADD COLUMN IF NOT EXISTS sponsor_image_url TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS sponsor_link TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS payment_tx_hash TEXT;
