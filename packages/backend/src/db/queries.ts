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
