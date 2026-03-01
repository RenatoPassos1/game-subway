// ============================================================
// Click Win - Parameterized SQL Queries
// ============================================================

// ============ Users ============

export const FIND_USER_BY_ADDRESS = `
  SELECT * FROM users WHERE wallet_address = $1
`;

export const FIND_USER_BY_ID = `
  SELECT * FROM users WHERE id = $1
`;

export const FIND_USER_BY_REFERRAL_CODE = `
  SELECT * FROM users WHERE referral_code = $1
`;

export const CREATE_USER = `
  INSERT INTO users (wallet_address, referral_code, referred_by, referral_bonus_pending)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

export const UPDATE_USER_NONCE = `
  UPDATE users SET nonce = $2, updated_at = NOW() WHERE id = $1
`;

export const ACCEPT_TERMS = `
  UPDATE users SET terms_accepted_at = NOW(), updated_at = NOW() WHERE id = $1
`;

// ============ Click Balances ============

export const GET_CLICK_BALANCE = `
  SELECT * FROM click_balances WHERE user_id = $1
`;

export const UPSERT_CLICK_BALANCE = `
  INSERT INTO click_balances (user_id, available_clicks, total_purchased)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id) DO UPDATE
  SET available_clicks = click_balances.available_clicks + $2,
      total_purchased = click_balances.total_purchased + $3,
      updated_at = NOW()
  RETURNING *
`;

export const DEDUCT_CLICKS = `
  UPDATE click_balances
  SET available_clicks = available_clicks - $2, updated_at = NOW()
  WHERE user_id = $1 AND available_clicks >= $2
  RETURNING *
`;

export const SET_CLICK_BALANCE = `
  INSERT INTO click_balances (user_id, available_clicks, total_purchased)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id) DO UPDATE
  SET available_clicks = $2,
      total_purchased = $3,
      updated_at = NOW()
  RETURNING *
`;

// ============ Deposit Addresses ============

export const GET_DEPOSIT_ADDRESS_BY_USER = `
  SELECT * FROM deposit_addresses WHERE user_id = $1
`;

export const GET_DEPOSIT_ADDRESS_BY_ADDRESS = `
  SELECT * FROM deposit_addresses WHERE address = $1
`;

export const CREATE_DEPOSIT_ADDRESS = `
  INSERT INTO deposit_addresses (user_id, address, derivation_index)
  VALUES ($1, $2, $3)
  RETURNING *
`;

export const GET_NEXT_DERIVATION_INDEX = `
  SELECT nextval('deposit_address_index_seq') AS next_index
`;

// ============ Auctions ============

export const GET_ACTIVE_AUCTION = `
  SELECT * FROM auctions
  WHERE status IN ('ACTIVE', 'CLOSING')
  ORDER BY created_at DESC
  LIMIT 1
`;

export const GET_AUCTION_BY_ID = `
  SELECT * FROM auctions WHERE id = $1
`;

export const CREATE_AUCTION = `
  INSERT INTO auctions (
    prize_value, prize_token, prize_description, status,
    min_revenue_multiplier, max_discount_pct, discount_per_click,
    timer_duration
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *
`;

export const UPDATE_AUCTION_STATUS = `
  UPDATE auctions SET status = $2 WHERE id = $1 RETURNING *
`;

export const START_AUCTION = `
  UPDATE auctions SET status = 'ACTIVE', started_at = NOW() WHERE id = $1 RETURNING *
`;

export const END_AUCTION = `
  UPDATE auctions
  SET status = 'ENDED',
      ended_at = NOW(),
      winner_id = $2,
      final_discount = $3,
      click_count = $4,
      accumulated_discount = $5,
      revenue = $6
  WHERE id = $1
  RETURNING *
`;

export const GET_PENDING_AUCTIONS = `
  SELECT * FROM auctions WHERE status = 'PENDING' ORDER BY created_at ASC
`;

// ============ Click Ledger ============

export const INSERT_CLICK = `
  INSERT INTO click_ledger (user_id, auction_id, click_number, discount_applied)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

export const GET_AUCTION_CLICKS = `
  SELECT cl.*, u.wallet_address
  FROM click_ledger cl
  JOIN users u ON u.id = cl.user_id
  WHERE cl.auction_id = $1
  ORDER BY cl.click_number DESC
  LIMIT $2 OFFSET $3
`;

export const COUNT_AUCTION_CLICKS = `
  SELECT COUNT(*) as total FROM click_ledger WHERE auction_id = $1
`;

// ============ Deposits ============

export const CREATE_DEPOSIT = `
  INSERT INTO deposits (
    user_id, tx_hash, token, amount, confirmations, status,
    deposit_address, clicks_credited, is_first_deposit, detected_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING *
`;

export const UPDATE_DEPOSIT_STATUS = `
  UPDATE deposits SET status = $2, confirmations = $3, confirmed_at = CASE WHEN $2 = 'CONFIRMED' THEN NOW() ELSE confirmed_at END
  WHERE id = $1 RETURNING *
`;

export const CREDIT_DEPOSIT = `
  UPDATE deposits SET status = 'CREDITED', clicks_credited = $2
  WHERE id = $1 RETURNING *
`;

export const GET_DEPOSIT_BY_TX = `
  SELECT * FROM deposits WHERE tx_hash = $1
`;

export const GET_USER_DEPOSITS = `
  SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
`;

export const COUNT_USER_DEPOSITS = `
  SELECT COUNT(*) as total FROM deposits WHERE user_id = $1
`;

export const GET_FIRST_DEPOSIT = `
  SELECT * FROM deposits WHERE user_id = $1 AND is_first_deposit = true LIMIT 1
`;

// ============ Referral Rewards ============

export const CREATE_REFERRAL_REWARD = `
  INSERT INTO referral_rewards (referrer_id, referred_id, deposit_id, clicks_earned, status)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *
`;

export const GET_REFERRAL_STATS = `
  SELECT
    u.referral_code,
    COUNT(DISTINCT rr.referred_id) AS total_referred,
    COALESCE(SUM(CASE WHEN rr.status = 'CREDITED' THEN rr.clicks_earned ELSE 0 END), 0) AS total_clicks_earned,
    COALESCE(SUM(CASE WHEN rr.status = 'PENDING' THEN rr.clicks_earned ELSE 0 END), 0) AS pending_bonuses
  FROM users u
  LEFT JOIN referral_rewards rr ON rr.referrer_id = u.id
  WHERE u.id = $1
  GROUP BY u.referral_code
`;

export const GET_REFERRAL_HISTORY = `
  SELECT
    rr.id,
    u2.wallet_address AS referred_wallet,
    rr.clicks_earned,
    d.amount AS deposit_amount,
    d.token AS deposit_token,
    rr.created_at
  FROM referral_rewards rr
  JOIN users u2 ON u2.id = rr.referred_id
  JOIN deposits d ON d.id = rr.deposit_id
  WHERE rr.referrer_id = $1
  ORDER BY rr.created_at DESC
  LIMIT $2 OFFSET $3
`;

export const COUNT_REFERRAL_REWARDS = `
  SELECT COUNT(*) as total FROM referral_rewards WHERE referrer_id = $1
`;

// ============ Payouts ============

export const CREATE_PAYOUT = `
  INSERT INTO payouts (auction_id, winner_id, gross_amount, net_amount, platform_fee, applied_discount)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`;

export const UPDATE_PAYOUT_STATUS = `
  UPDATE payouts SET status = $2, tx_hash = $3, executed_at = CASE WHEN $2 = 'COMPLETED' THEN NOW() ELSE executed_at END
  WHERE id = $1 RETURNING *
`;

// ============ Audit ============

export const INSERT_AUDIT_LOG = `
  INSERT INTO audit_logs (event_type, actor, payload, ip_address)
  VALUES ($1, $2, $3, $4)
`;

// ============ Admins ============

export const FIND_ADMIN_BY_WALLET = `
  SELECT * FROM admins
  WHERE LOWER(wallet_address) = LOWER($1) AND is_active = true
`;

export const IS_ADMIN = `
  SELECT id, role FROM admins
  WHERE LOWER(wallet_address) = LOWER($1) AND is_active = true
  LIMIT 1
`;

// ============ Advertisers ============

export const FIND_ADVERTISER_BY_USER = `
  SELECT * FROM advertisers WHERE user_id = $1
`;

export const FIND_ADVERTISER_BY_WALLET = `
  SELECT * FROM advertisers
  WHERE LOWER(wallet_address) = LOWER($1)
`;

export const CREATE_ADVERTISER = `
  INSERT INTO advertisers (user_id, wallet_address, display_name, email, whatsapp, telegram, website, social_links)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *
`;

export const UPDATE_ADVERTISER = `
  UPDATE advertisers
  SET display_name = COALESCE($2, display_name),
      email = COALESCE($3, email),
      whatsapp = COALESCE($4, whatsapp),
      telegram = COALESCE($5, telegram),
      website = COALESCE($6, website),
      social_links = COALESCE($7, social_links),
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const LIST_ADVERTISERS = `
  SELECT a.*, u.wallet_address AS user_wallet
  FROM advertisers a
  JOIN users u ON u.id = a.user_id
  ORDER BY a.created_at DESC
  LIMIT $1 OFFSET $2
`;

export const VERIFY_ADVERTISER = `
  UPDATE advertisers SET is_verified = $2, updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

// ============ Ad Slot Types ============

export const GET_AD_SLOT_TYPES = `
  SELECT * FROM ad_slot_types WHERE is_active = true ORDER BY price_usdt ASC
`;

export const GET_AD_SLOT_BY_SLUG = `
  SELECT * FROM ad_slot_types WHERE slug = $1 AND is_active = true
`;

// ============ Ad Campaigns ============

export const CREATE_AD_CAMPAIGN = `
  INSERT INTO ad_campaigns (
    advertiser_id, slot_type_id, title, description, image_url, click_url,
    is_token_promo, token_address, token_name, token_exchanges, price_usdt, status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING_PAYMENT')
  RETURNING *
`;

export const UPDATE_CAMPAIGN_STATUS = `
  UPDATE ad_campaigns SET status = $2, updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const GET_CAMPAIGN_BY_ID = `
  SELECT c.*, ast.slug AS slot_type_slug, ast.label AS slot_type_label,
         ast.duration_days, adv.display_name AS advertiser_name
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  JOIN advertisers adv ON adv.id = c.advertiser_id
  WHERE c.id = $1
`;

export const GET_CAMPAIGNS_BY_ADVERTISER = `
  SELECT c.*, ast.slug AS slot_type_slug, ast.label AS slot_type_label
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  WHERE c.advertiser_id = $1
  ORDER BY c.created_at DESC
  LIMIT $2 OFFSET $3
`;

export const GET_LIVE_CAMPAIGNS_BY_SLOT = `
  SELECT c.*, ast.slug AS slot_type_slug,
         adv.display_name AS advertiser_name
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  JOIN advertisers adv ON adv.id = c.advertiser_id
  WHERE ast.slug = $1 AND c.status = 'LIVE'
  ORDER BY c.queue_position ASC
`;

export const GET_NEXT_QUEUE_POSITION = `
  SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
  FROM ad_campaigns
  WHERE slot_type_id = $1 AND status IN ('APPROVED', 'SCHEDULED', 'LIVE')
`;

export const GET_SCHEDULED_CAMPAIGNS = `
  SELECT c.*, ast.slug AS slot_type_slug, ast.duration_days
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  WHERE c.status = 'SCHEDULED'
    AND c.scheduled_start <= NOW()
  ORDER BY c.queue_position ASC
`;

export const GET_NEXT_AVAILABLE_DATE = `
  SELECT COALESCE(
    MAX(c.scheduled_end),
    NOW()
  ) AS next_date
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  WHERE ast.slug = $1
    AND c.status IN ('APPROVED', 'SCHEDULED', 'LIVE')
`;

export const LIST_ALL_CAMPAIGNS = `
  SELECT c.*, ast.slug AS slot_type_slug, ast.label AS slot_type_label,
         adv.display_name AS advertiser_name
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  JOIN advertisers adv ON adv.id = c.advertiser_id
  WHERE ($1::text IS NULL OR c.status = $1)
    AND ($2::text IS NULL OR ast.slug = $2)
  ORDER BY c.created_at DESC
  LIMIT $3 OFFSET $4
`;

export const UPDATE_CAMPAIGN_SCHEDULE = `
  UPDATE ad_campaigns
  SET queue_position = $2,
      scheduled_start = $3,
      scheduled_end = $4,
      status = 'SCHEDULED',
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const UPDATE_CAMPAIGN_IMPRESSIONS = `
  UPDATE ad_campaigns
  SET impressions = impressions + $2,
      clicks = clicks + $3,
      updated_at = NOW()
  WHERE id = $1
`;

export const UPDATE_CAMPAIGN_CONTENT = `
  UPDATE ad_campaigns
  SET title = COALESCE($2, title),
      description = COALESCE($3, description),
      image_url = COALESCE($4, image_url),
      click_url = COALESCE($5, click_url),
      is_token_promo = COALESCE($6, is_token_promo),
      token_address = COALESCE($7, token_address),
      token_name = COALESCE($8, token_name),
      token_exchanges = COALESCE($9, token_exchanges),
      status = CASE WHEN status = 'PAID' THEN 'PENDING_REVIEW' ELSE status END,
      updated_at = NOW()
  WHERE id = $1 AND status IN ('PENDING_PAYMENT', 'PAID')
  RETURNING *
`;

export const CAMPAIGN_GO_LIVE = `
  UPDATE ad_campaigns
  SET status = 'LIVE',
      actual_start = NOW(),
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const CAMPAIGN_REJECT = `
  UPDATE ad_campaigns
  SET status = 'REJECTED',
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const COUNT_QUEUE_LENGTH = `
  SELECT COUNT(*) AS queue_length
  FROM ad_campaigns c
  JOIN ad_slot_types ast ON ast.id = c.slot_type_id
  WHERE ast.slug = $1
    AND c.status IN ('APPROVED', 'SCHEDULED', 'LIVE')
`;

// ============ Ad Crypto Orders ============

export const CREATE_AD_CRYPTO_ORDER = `
  INSERT INTO ad_crypto_orders (
    campaign_id, advertiser_id, token, amount_usdt, amount_token,
    bnb_price_usdt, receiver_wallet, status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
  RETURNING *
`;

export const UPDATE_AD_ORDER_STATUS = `
  UPDATE ad_crypto_orders
  SET status = $2,
      confirmations = COALESCE($3, confirmations),
      verified_amount = COALESCE($4, verified_amount),
      verified_from = COALESCE($5, verified_from),
      confirmed_at = CASE WHEN $2 = 'CONFIRMED' THEN NOW() ELSE confirmed_at END,
      updated_at = NOW()
  WHERE id = $1
  RETURNING *
`;

export const UPDATE_AD_ORDER_TX_HASH = `
  UPDATE ad_crypto_orders
  SET tx_hash = $2,
      status = 'SUBMITTED',
      submitted_at = NOW(),
      updated_at = NOW()
  WHERE id = $1 AND status = 'PENDING'
  RETURNING *
`;

export const GET_AD_ORDER_BY_ID = `
  SELECT o.*, c.title AS campaign_title, c.status AS campaign_status
  FROM ad_crypto_orders o
  JOIN ad_campaigns c ON c.id = o.campaign_id
  WHERE o.id = $1
`;

export const GET_PENDING_AD_ORDERS = `
  SELECT * FROM ad_crypto_orders
  WHERE status IN ('PENDING', 'SUBMITTED', 'CONFIRMING')
  ORDER BY created_at ASC
`;

export const GET_AD_ORDER_BY_TX_HASH = `
  SELECT * FROM ad_crypto_orders WHERE tx_hash = $1
`;

export const GET_AD_ORDERS_BY_CAMPAIGN = `
  SELECT * FROM ad_crypto_orders
  WHERE campaign_id = $1
  ORDER BY created_at DESC
`;

export const GET_AD_ORDERS_BY_ADVERTISER = `
  SELECT o.*, c.title AS campaign_title
  FROM ad_crypto_orders o
  JOIN ad_campaigns c ON c.id = o.campaign_id
  WHERE o.advertiser_id = $1
  ORDER BY o.created_at DESC
  LIMIT $2 OFFSET $3
`;

export const LIST_ALL_AD_ORDERS = `
  SELECT o.*, c.title AS campaign_title, adv.display_name AS advertiser_name
  FROM ad_crypto_orders o
  JOIN ad_campaigns c ON c.id = o.campaign_id
  JOIN advertisers adv ON adv.id = o.advertiser_id
  ORDER BY o.created_at DESC
  LIMIT $1 OFFSET $2
`;

export const INSERT_AD_PAYMENT_LOG = `
  INSERT INTO ad_payment_log (order_id, campaign_id, event, details)
  VALUES ($1, $2, $3, $4)
`;

// ============ Auctions (enhanced) ============

export const CREATE_AUCTION_ENHANCED = `
  INSERT INTO auctions (
    prize_value, prize_token, prize_description, status,
    min_revenue_multiplier, max_discount_pct, discount_per_click,
    timer_duration, image_url, scheduled_start, is_main, display_order,
    sponsor_image_url, sponsor_link
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
`;

export const GET_UPCOMING_AUCTIONS = `
  SELECT * FROM auctions
  WHERE status = 'PENDING' AND scheduled_start IS NOT NULL
  ORDER BY display_order ASC, scheduled_start ASC
  LIMIT $1
`;

export const GET_PAST_AUCTIONS = `
  SELECT a.*, u.wallet_address AS winner_wallet
  FROM auctions a
  LEFT JOIN users u ON u.id = a.winner_id
  WHERE a.status IN ('ENDED', 'SETTLED')
  ORDER BY a.ended_at DESC
  LIMIT $1 OFFSET $2
`;

export const UPDATE_AUCTION_PAYMENT_TX = `
  UPDATE auctions SET payment_tx_hash = $2
  WHERE id = $1
  RETURNING *
`;

export const SET_MAIN_AUCTION = `
  UPDATE auctions SET is_main = false WHERE is_main = true;
  UPDATE auctions SET is_main = true WHERE id = $1 RETURNING *
`;

export const CLEAR_MAIN_AUCTION = `
  UPDATE auctions SET is_main = false WHERE is_main = true
`;

export const SET_MAIN_AUCTION_BY_ID = `
  UPDATE auctions SET is_main = true, updated_at = NOW() WHERE id = $1 RETURNING *
`;

export const GET_MAIN_AUCTION = `
  SELECT * FROM auctions
  WHERE is_main = true AND status IN ('PENDING', 'ACTIVE', 'CLOSING')
  LIMIT 1
`;

// ============ Notification Subscriptions ============

export const UPSERT_NOTIFICATION_SUB = `
  INSERT INTO notification_subscriptions (user_id, channel, destination, preferences)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id, channel) DO UPDATE
  SET destination = EXCLUDED.destination,
      preferences = EXCLUDED.preferences,
      is_active = true,
      updated_at = NOW()
  RETURNING *
`;

export const DEACTIVATE_NOTIFICATION_SUB = `
  UPDATE notification_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE user_id = $1 AND channel = $2
  RETURNING *
`;

export const GET_NOTIFICATION_SUBS_BY_USER = `
  SELECT * FROM notification_subscriptions
  WHERE user_id = $1 AND is_active = true
`;

export const GET_ALL_ACTIVE_SUBS_BY_CHANNEL = `
  SELECT ns.*, u.wallet_address
  FROM notification_subscriptions ns
  JOIN users u ON u.id = ns.user_id
  WHERE ns.channel = $1 AND ns.is_active = true
`;

export const GET_SUB_BY_USER_CHANNEL = `
  SELECT * FROM notification_subscriptions
  WHERE user_id = $1 AND channel = $2
`;

export const MARK_SUB_INACTIVE = `
  UPDATE notification_subscriptions
  SET is_active = false, updated_at = NOW()
  WHERE id = $1
`;

export const UPDATE_SUB_PREFERENCES = `
  UPDATE notification_subscriptions
  SET preferences = $2, updated_at = NOW()
  WHERE user_id = $1 AND channel = $3 AND is_active = true
  RETURNING *
`;

// ============ Telegram Link Tokens ============

export const CREATE_TELEGRAM_LINK_TOKEN = `
  INSERT INTO telegram_link_tokens (token, user_id, expires_at)
  VALUES ($1, $2, $3)
  RETURNING *
`;

export const GET_TELEGRAM_LINK_TOKEN = `
  SELECT * FROM telegram_link_tokens
  WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
`;

export const MARK_TELEGRAM_TOKEN_USED = `
  UPDATE telegram_link_tokens
  SET used_at = NOW()
  WHERE token = $1
`;

export const FIND_SUB_BY_TELEGRAM_CHAT = `
  SELECT * FROM notification_subscriptions
  WHERE channel = 'telegram' AND destination->>'chat_id' = $1 AND is_active = true
`;

// ============ Notification Logs ============

export const INSERT_NOTIFICATION_LOG = `
  INSERT INTO notification_logs (user_id, channel, event_type, payload, status, error_text)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`;

export const GET_NOTIFICATION_LOGS = `
  SELECT * FROM notification_logs
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`;

// ============ Auctions (for scheduler) ============

export const GET_SCHEDULED_AUCTIONS_STARTING_BETWEEN = `
  SELECT * FROM auctions
  WHERE status = 'PENDING'
    AND scheduled_start IS NOT NULL
    AND scheduled_start BETWEEN $1 AND $2
  ORDER BY scheduled_start ASC
`;

export const GET_AUCTIONS_GOING_LIVE = `
  SELECT * FROM auctions
  WHERE status = 'ACTIVE'
    AND started_at IS NOT NULL
    AND started_at BETWEEN $1 AND $2
`;
