import { ethers } from 'ethers';
import pino from 'pino';
import { query } from '../db/client';
import {
  FIND_USER_BY_ADDRESS,
  FIND_USER_BY_ID,
  GET_CLICK_BALANCE,
  GET_DEPOSIT_ADDRESS_BY_USER,
  CREATE_DEPOSIT_ADDRESS,
  GET_NEXT_DERIVATION_INDEX,
  SET_CLICK_BALANCE,
} from '../db/queries';
import { redis } from '../redis/client';
import { BNB_DERIVATION_PATH } from '../../../../shared/src/constants';
import type { User, ClickBalance, DepositAddress } from '../../../../shared/src/types';

const logger = pino({ name: 'user-service' });

export async function findByAddress(address: string): Promise<User | null> {
  const { rows } = await query<User>(FIND_USER_BY_ADDRESS, [address]);
  return rows[0] || null;
}

export async function findById(id: string): Promise<User | null> {
  const { rows } = await query<User>(FIND_USER_BY_ID, [id]);
  return rows[0] || null;
}

export async function getClickBalance(
  userId: string,
): Promise<{ availableClicks: number; totalPurchased: number }> {
  // Try Redis first
  const redisKey = `user:${userId}:clicks`;
  const cachedClicks = await redis.get(redisKey);

  if (cachedClicks !== null) {
    // Get total purchased from PG (Redis only tracks available)
    const { rows } = await query<ClickBalance>(GET_CLICK_BALANCE, [userId]);
    const totalPurchased = rows.length > 0 ? rows[0].total_purchased : 0;
    return {
      availableClicks: parseInt(cachedClicks, 10),
      totalPurchased,
    };
  }

  // Fallback to PG
  const { rows } = await query<ClickBalance>(GET_CLICK_BALANCE, [userId]);
  if (rows.length === 0) {
    return { availableClicks: 0, totalPurchased: 0 };
  }

  const balance = rows[0];

  // Cache in Redis
  await redis.set(redisKey, balance.available_clicks.toString());

  return {
    availableClicks: balance.available_clicks,
    totalPurchased: balance.total_purchased,
  };
}

export async function syncClickBalanceToPG(
  userId: string,
  availableClicks: number,
  totalPurchased: number,
): Promise<void> {
  await query(SET_CLICK_BALANCE, [userId, availableClicks, totalPurchased]);
}

export async function getDepositAddress(userId: string): Promise<DepositAddress | null> {
  const { rows } = await query<DepositAddress>(GET_DEPOSIT_ADDRESS_BY_USER, [userId]);
  return rows[0] || null;
}

export async function generateDepositAddress(userId: string): Promise<DepositAddress> {
  const HD_XPUB = process.env.HD_XPUB;
  if (!HD_XPUB) {
    throw new Error('HD_XPUB not configured');
  }

  // Check if already exists
  const existing = await getDepositAddress(userId);
  if (existing) return existing;

  // Get next derivation index
  const { rows: indexRows } = await query<{ next_index: string }>(GET_NEXT_DERIVATION_INDEX);
  const derivationIndex = parseInt(indexRows[0].next_index, 10);

  // Derive address from xpub
  const hdNode = ethers.HDNodeWallet.fromExtendedKey(HD_XPUB);
  const derivedPath = `${derivationIndex}`;
  const childNode = hdNode.deriveChild(derivationIndex);
  const address = childNode.address;

  // Store in PG
  const { rows } = await query<DepositAddress>(CREATE_DEPOSIT_ADDRESS, [
    userId,
    address,
    derivationIndex,
  ]);

  logger.info({ userId, address, derivationIndex }, 'Deposit address generated');

  return rows[0];
}
