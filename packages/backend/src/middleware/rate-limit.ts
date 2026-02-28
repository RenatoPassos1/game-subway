import type { FastifyInstance } from 'fastify';
import { API_RATE_LIMIT, REFERRAL_VALIDATION_RATE } from '../../../../shared/src/constants';

export interface RateLimitConfig {
  max: number;
  timeWindow: string;
}

// Default rate limit configuration for the API
export const defaultRateLimitConfig: RateLimitConfig = {
  max: API_RATE_LIMIT, // 100 requests per minute
  timeWindow: '1 minute',
};

// Referral validation rate limit
export const referralRateLimitConfig: RateLimitConfig = {
  max: REFERRAL_VALIDATION_RATE, // 10 requests per minute
  timeWindow: '1 minute',
};

// Click rate limit per user per auction (enforced in Lua script, 500ms)
// This is tracked in Redis directly, not via fastify rate-limit plugin

export function getRateLimitOptions() {
  return {
    max: defaultRateLimitConfig.max,
    timeWindow: defaultRateLimitConfig.timeWindow,
    // Use IP + user combination if available
    keyGenerator: (request: any) => {
      const userId = request.user?.userId;
      if (userId) {
        return `${request.ip}:${userId}`;
      }
      return request.ip;
    },
    // Skip rate limiting for WebSocket upgrade requests
    allowList: (request: any) => {
      return request.url === '/ws';
    },
  };
}
