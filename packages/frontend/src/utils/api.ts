// Click Win API Client
// Fetch-based wrapper with JWT auth and typed endpoints

import type {
  AuthNonceResponse,
  AuthVerifyRequest,
  AuthVerifyResponse,
  AuctionState,
  ClickBalance,
  DepositAddress,
  ReferralStats,
  ReferralHistoryEntry,
} from '@click-win/shared/src/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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
  return request<DepositAddress>('/deposit/address');
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
  return request<ReferralStats>('/referral/stats');
}

export async function getReferralHistory(
  page = 1,
  limit = 20
): Promise<{ data: ReferralHistoryEntry[]; total: number; page: number; pages: number }> {
  return request(`/referral/history?page=${page}&limit=${limit}`);
}

// ========== User Endpoints ==========

export async function acceptTerms(): Promise<void> {
  return request<void>('/user/terms', { method: 'POST' });
}

export async function getUserProfile(): Promise<AuthVerifyResponse['user']> {
  return request<AuthVerifyResponse['user']>('/user/profile');
}

// ========== Export ==========

export { ApiRequestError };
export type { ApiError };
