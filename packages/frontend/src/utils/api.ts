// Click Win API Client
// Fetch-based wrapper with JWT auth and typed endpoints

import type {
  AuthNonceResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
  Auction,
  AuctionState,
  ClickBalance,
  DepositAddress,
  ReferralStats,
  ReferralHistoryEntry,
} from '@click-win/shared/src/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

let authToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('clickwin_token') : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  // Fallback: re-read from localStorage in case module variable was lost
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clickwin_token');
    if (stored) authToken = stored;
    return stored;
  }
  return null;
}

interface ApiError {
  status: number;
  message: string;
  code?: string;
}

class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = error.status;
    this.code = error.code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Always fallback to localStorage if module-level token is missing.
  // This prevents 401 errors caused by React effect ordering race
  // conditions on page refresh / client-side navigation.
  const token = authToken ?? (() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('clickwin_token');
    if (stored) authToken = stored; // re-sync module variable
    return stored;
  })();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: { message?: string; code?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Response body is not JSON
    }

    throw new ApiRequestError({
      status: response.status,
      message: errorBody.message ?? `Request failed with status ${response.status}`,
      code: errorBody.code,
    });
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ========== Auth Endpoints ==========

export async function getNonce(address: string): Promise<AuthNonceResponse> {
  return request<AuthNonceResponse>(`/auth/nonce?address=${encodeURIComponent(address)}`);
}

export async function verifyAuth(body: AuthVerifyRequest): Promise<AuthVerifyResponse> {
  return request<AuthVerifyResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ========== Balance Endpoints ==========

export async function getBalance(): Promise<ClickBalance> {
  return request<ClickBalance>('/user/balance');
}

// ========== Deposit Endpoints ==========

export async function getDepositAddress(): Promise<DepositAddress> {
  return request<DepositAddress>('/user/deposit-address');
}

// ========== Auction Endpoints ==========

export async function getActiveAuction(): Promise<AuctionState | null> {
  try {
    return await request<AuctionState>('/auction/active');
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

// ========== Referral Endpoints ==========

export async function getReferralStats(): Promise<ReferralStats> {
  return request<ReferralStats>('/user/referral/stats');
}

export async function getReferralHistory(
  page = 1,
  limit = 20
): Promise<{ data: ReferralHistoryEntry[]; total: number; page: number; pages: number }> {
  return request(`/user/referral/history?page=${page}&limit=${limit}`);
}

// ========== User Endpoints ==========

export async function acceptTerms(): Promise<void> {
  return request<void>('/user/terms', { method: 'POST' });
}

export async function getUserProfile(): Promise<AuthVerifyResponse['user']> {
  return request<AuthVerifyResponse['user']>('/user/profile');
}

// ========== Ads Types ==========

export interface ActiveAd {
  campaign_id: string;
  title: string;
  description: string;
  image_url: string;
  click_url: string;
  slot_type: 'carousel' | 'side_card';
  advertiser_name: string;
  is_token_promo: boolean;
  token_name?: string;
  token_exchanges?: string[];
}

// ========== Ads Endpoints ==========

export async function getActiveAds(): Promise<{ carousel: ActiveAd[]; side_cards: ActiveAd[] }> {
  return request<{ carousel: ActiveAd[]; side_cards: ActiveAd[] }>('/ads/active');
}

export async function recordAdImpression(campaignId: string): Promise<void> {
  return request<void>('/ads/impression', { method: 'POST', body: JSON.stringify({ campaign_id: campaignId }) });
}

export async function recordAdClick(campaignId: string): Promise<{ ok: boolean; click_url: string | null }> {
  return request<{ ok: boolean; click_url: string | null }>('/ads/click', {
    method: 'POST',
    body: JSON.stringify({ campaign_id: campaignId }),
  });
}

// ========== Auction Enhanced Endpoints ==========

export async function getUpcomingAuctions(): Promise<Auction[]> {
  try {
    const res = await request<{ auctions: Auction[] }>('/auction/upcoming');
    return res.auctions;
  } catch { return []; }
}

export async function getPastAuctions(page = 1, limit = 10): Promise<{ data: Auction[]; page: number; limit: number }> {
  return request(`/auction/past?page=${page}&limit=${limit}`);
}

// ========== Admin Endpoints ==========

export async function checkAdminWallet(wallet: string): Promise<{ is_admin: boolean; role: string | null }> {
  return request('/admin/verify-wallet', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: wallet }),
  });
}

export async function getAdminDashboard(): Promise<{
  total_revenue: number;
  active_campaigns: number;
  pending_reviews: number;
}> {
  return request('/admin/dashboard');
}

export async function getAdminCampaigns(opts?: {
  status?: string;
  slot_type?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; page: number; limit: number }> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.slot_type) params.set('slot_type', opts.slot_type);
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));
  return request(`/admin/campaigns?${params.toString()}`);
}

export async function approveCampaign(id: string): Promise<{ campaign: any }> {
  return request(`/admin/campaigns/${id}/approve`, { method: 'POST' });
}

export async function rejectCampaign(id: string, reason?: string): Promise<{ campaign: any }> {
  return request(`/admin/campaigns/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function goLiveCampaign(id: string): Promise<{ campaign: any }> {
  return request(`/admin/campaigns/${id}/go-live`, { method: 'POST' });
}

export async function getAdminAdvertisers(page = 1, limit = 20): Promise<{ data: any[]; page: number; limit: number }> {
  return request(`/admin/advertisers?page=${page}&limit=${limit}`);
}

export async function verifyAdvertiser(id: string, verified: boolean): Promise<{ advertiser: any }> {
  return request(`/admin/advertisers/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verified }),
  });
}

export async function getAdminOrders(page = 1, limit = 20): Promise<{ data: any[]; page: number; limit: number }> {
  return request(`/admin/orders?page=${page}&limit=${limit}`);
}

export async function createAdminAuction(data: {
  prizeValue: number;
  prizeToken?: string;
  prizeDescription?: string;
  imageUrl?: string;
  scheduledStart?: string;
  isMain?: boolean;
}): Promise<{ auction: Auction }> {
  return request('/admin/auction/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function promoteAuction(id: string): Promise<{ auction: Auction }> {
  return request(`/admin/auction/${id}/promote`, { method: 'POST' });
}

// ========== Advertiser Endpoints ==========

export async function registerAdvertiser(data: {
  display_name: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  social_links?: Record<string, string>;
}): Promise<{ advertiser: any }> {
  return request('/advertiser/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdvertiserProfile(): Promise<{ advertiser: any } | null> {
  try {
    return await request('/advertiser/me');
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export async function updateAdvertiserProfile(data: {
  display_name?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  social_links?: Record<string, string>;
}): Promise<{ advertiser: any }> {
  return request('/advertiser/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createAdCampaign(data: {
  slot_type_slug: string;
  title: string;
  description?: string;
  image_url?: string;
  click_url?: string;
  is_token_promo?: boolean;
  token_address?: string;
  token_name?: string;
  token_exchanges?: string[];
}): Promise<{ campaign: any }> {
  return request('/advertiser/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdvertiserCampaigns(page = 1, limit = 20): Promise<{ data: any[]; page: number; limit: number }> {
  return request(`/advertiser/campaigns?page=${page}&limit=${limit}`);
}

export async function updateAdCampaign(id: string, data: {
  title?: string;
  description?: string;
  image_url?: string;
  click_url?: string;
  is_token_promo?: boolean;
  token_address?: string;
  token_name?: string;
  token_exchanges?: string[];
}): Promise<{ campaign: any }> {
  return request(`/advertiser/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdvertiserOrders(page = 1, limit = 20): Promise<{ data: any[]; page: number; limit: number }> {
  return request(`/advertiser/orders?page=${page}&limit=${limit}`);
}

export async function getAdAvailability(): Promise<{ availability: any[] }> {
  return request('/advertiser/availability');
}

// ========== Crypto Payment Endpoints ==========

export async function getBnbPrice(): Promise<{ price_usdt: number }> {
  return request('/crypto/bnb-price');
}

export async function createAdPaymentOrder(data: {
  campaign_id: string;
  token: 'BNB' | 'USDT';
}): Promise<{
  order: {
    id: string;
    token: string;
    amount_usdt: number;
    amount_token: number;
    bnb_price_usdt: number | null;
    receiver_wallet: string;
    expires_at: string;
  };
}> {
  return request('/crypto/ad/create-order', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitPaymentHash(data: {
  order_id: string;
  tx_hash: string;
}): Promise<{ status: string; message: string }> {
  return request('/crypto/ad/submit-hash', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPaymentOrderStatus(orderId: string): Promise<{ order: any }> {
  return request(`/crypto/ad/verify/${orderId}`);
}

// ========== Export ==========

export { ApiRequestError };
export type { ApiError };
