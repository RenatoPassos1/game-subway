// ============================================================
// BNB Price Feed
// Returns BNB price in USDT with Redis caching (60s TTL).
// Primary: CoinGecko  |  Fallback: Binance API
// ============================================================

import pino from 'pino';
import { redis } from '../redis/client';
import { BNB_PRICE_CACHE_TTL } from '../../../../shared/src/constants';

const logger = pino({ name: 'bnb-price' });

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';
const BINANCE_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT';
const CACHE_KEY = 'bnb:price:usdt';

/**
 * Get the current BNB price in USDT.
 * Checks Redis cache first (60s TTL), then CoinGecko, then Binance as fallback.
 */
export async function getBnbPrice(): Promise<number> {
  // 1. Try Redis cache
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const price = parseFloat(cached);
      if (!isNaN(price) && price > 0) {
        logger.debug({ price, source: 'cache' }, 'BNB price from cache');
        return price;
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Redis cache read failed for BNB price');
  }

  // 2. Try CoinGecko
  let price: number | null = null;
  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json() as any;
      const p = data?.binancecoin?.usd;
      if (typeof p === 'number' && p > 0) {
        price = p;
        logger.debug({ price, source: 'coingecko' }, 'BNB price from CoinGecko');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'CoinGecko API failed, trying Binance fallback');
  }

  // 3. Fallback: Binance
  if (!price) {
    try {
      const res = await fetch(BINANCE_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json() as any;
        const p = parseFloat(data?.price);
        if (!isNaN(p) && p > 0) {
          price = p;
          logger.debug({ price, source: 'binance' }, 'BNB price from Binance');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Binance API fallback also failed');
    }
  }

  if (!price) {
    throw new Error('Failed to fetch BNB price from all sources');
  }

  // 4. Cache in Redis
  try {
    await redis.set(CACHE_KEY, price.toString(), 'EX', BNB_PRICE_CACHE_TTL);
  } catch (err) {
    logger.warn({ err }, 'Failed to cache BNB price in Redis');
  }

  return price;
}
