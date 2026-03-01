// Click Win Shared Types

import { AUCTION_STATES } from './constants';

// ============ User ============
export interface User {
  id: string;
  wallet_address: string;
  nonce: string;
  referral_code: string;
  referred_by: string | null;
  referral_bonus_pending: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Auction ============
export type AuctionStatus = typeof AUCTION_STATES[keyof typeof AUCTION_STATES];

export interface Auction {
  id: string;
  prize_value: number;
  prize_token: string;
  prize_description: string;
  status: AuctionStatus;
  min_revenue_multiplier: number;
  max_discount_pct: number;
  discount_per_click: number;
  timer_duration: number;
  click_count: number;
  accumulated_discount: number;
  revenue: number;
  winner_id: string | null;
  final_discount: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface AuctionState {
  id: string;
  status: AuctionStatus;
  prizeValue: number;
  prizeToken: string;
  prizeDescription: string;
  clickCount: number;
  accumulatedDiscount: number;
  revenue: number;
  timerRemaining: number;
  timerDuration: number;
  lastClick: LastClick | null;
  discountPerClick: number;
  maxDiscountPct: number;
}

export interface LastClick {
  userId: string;
  walletAddress: string;
  timestamp: number;
  clickNumber: number;
}

// ============ Click ============
export interface ClickEvent {
  auctionId: string;
  userId: string;
  timestamp: number;
}

export interface ClickLedgerEntry {
  id: string;
  user_id: string;
  auction_id: string;
  click_number: number;
  discount_applied: number;
  timestamp: string;
}

// ============ Deposit ============
export type DepositStatus = 'PENDING' | 'CONFIRMED' | 'CREDITED' | 'FAILED';

export interface Deposit {
  id: string;
  user_id: string;
  tx_hash: string;
  token: 'BNB' | 'USDT';
  amount: number;
  confirmations: number;
  status: DepositStatus;
  deposit_address: string;
  clicks_credited: number;
  is_first_deposit: boolean;
  detected_at: string;
  confirmed_at: string | null;
  created_at: string;
}

// ============ Referral ============
export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  deposit_id: string;
  clicks_earned: number;
  status: 'CREDITED' | 'PENDING';
  created_at: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  totalClicksEarned: number;
  pendingBonuses: number;
}

export interface ReferralHistoryEntry {
  id: string;
  referredWallet: string;
  clicksEarned: number;
  depositAmount: number;
  depositToken: string;
  createdAt: string;
}

// ============ Payout ============
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payout {
  id: string;
  auction_id: string;
  winner_id: string;
  gross_amount: number;
  net_amount: number;
  platform_fee: number;
  applied_discount: number;
  tx_hash: string | null;
  status: PayoutStatus;
  executed_at: string | null;
  created_at: string;
}

// ============ Auth ============
export interface AuthNonceResponse {
  nonce: string;
}

export interface AuthVerifyRequest {
  address: string;
  signature: string;
  nonce: string;
  referralCode?: string;
}

export interface AuthVerifyResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
    referralCode: string;
    clickBalance: number;
  };
}

// ============ WebSocket ============
export interface WsClickPayload {
  auctionId: string;
  userId: string;
  timestamp: number;
}

export interface WsAuctionStatePayload extends AuctionState {}

export interface WsAuctionClickPayload {
  userId: string;
  walletAddress: string;
  discount: number;
  timer: number;
  clickCount: number;
}

export interface WsAuctionEndedPayload {
  auctionId: string;
  winnerId: string;
  winnerWallet: string;
  finalDiscount: number;
  netPrize: number;
}

export interface WsBalancePayload {
  clicks: number;
  totalPurchased: number;
}

export interface WsReferralBonusPayload {
  referredUser: string;
  clicksEarned: number;
  depositId: string;
}

export interface WsErrorPayload {
  code: string;
  message: string;
}

// ============ Deposit Address ============
export interface DepositAddress {
  id: string;
  user_id: string;
  address: string;
  derivation_index: number;
  created_at: string;
}

// ============ Audit ============
export interface AuditLog {
  id: string;
  event_type: string;
  actor: string;
  payload: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

// ============ Click Balance ============
export interface ClickBalance {
  user_id: string;
  available_clicks: number;
  total_purchased: number;
}

// ============ Admin ============
export interface Admin {
  id: string;
  wallet_address: string;
  role: 'FOUNDER' | 'ADMIN' | 'MODERATOR';
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Advertiser ============
export interface Advertiser {
  id: string;
  user_id: string;
  wallet_address: string;
  display_name: string;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  website: string | null;
  social_links: Record<string, string>;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Ad Slot Type ============
export interface AdSlotType {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  price_usdt: number;
  duration_days: number;
  max_concurrent: number;
  is_active: boolean;
  created_at: string;
}

// ============ Ad Campaign ============
export type AdCampaignStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface AdCampaign {
  id: string;
  advertiser_id: string;
  slot_type_id: string;
  status: AdCampaignStatus;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string | null;
  is_token_promo: boolean;
  token_address: string | null;
  token_name: string | null;
  token_exchanges: string[];
  queue_position: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  price_usdt: number;
  price_bnb: number | null;
  paid_token: 'BNB' | 'USDT' | null;
  paid_amount: number | null;
  payment_tx_hash: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

/** Public-facing campaign data (no sensitive fields) */
export interface AdCampaignPublic {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string | null;
  slot_type: string;
  status: AdCampaignStatus;
  is_token_promo: boolean;
  token_name: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  impressions: number;
  clicks: number;
}

/** Active ad returned by /ads/active */
export interface ActiveAd {
  campaign_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  click_url: string | null;
  slot_type: string;
  advertiser_name: string;
  is_token_promo: boolean;
  token_name: string | null;
  token_exchanges: string[];
}

/** Slot availability info */
export interface AdAvailability {
  next_available_date: string | null;
  slot_type: string;
  current_queue_length: number;
}

// ============ Ad Crypto Order ============
export type AdOrderStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface AdCryptoOrder {
  id: string;
  campaign_id: string;
  advertiser_id: string;
  token: 'BNB' | 'USDT';
  amount_usdt: number;
  amount_token: number;
  bnb_price_usdt: number | null;
  receiver_wallet: string;
  tx_hash: string | null;
  confirmations: number;
  status: AdOrderStatus;
  verified_amount: number | null;
  verified_from: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  expires_at: string;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============ Ad Payment Log ============
export interface AdPaymentLog {
  id: string;
  order_id: string;
  campaign_id: string;
  event: string;
  details: Record<string, unknown>;
  created_at: string;
}

// ============ BNB Quote ============
export interface BnbQuote {
  price_usdt: number;
  amount_bnb: number;
  expires_at: number;
}
