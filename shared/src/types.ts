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
