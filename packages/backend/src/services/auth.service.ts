import crypto from 'node:crypto';
import { ethers } from 'ethers';
import pino from 'pino';
import { query, getClient } from '../db/client';
import {
  FIND_USER_BY_ADDRESS,
  CREATE_USER,
  FIND_USER_BY_REFERRAL_CODE,
  GET_CLICK_BALANCE,
} from '../db/queries';
import { redis } from '../redis/client';
import {
  REFERRAL_CODE_LENGTH,
  REFERRAL_CODE_CHARS,
  NONCE_TTL,
} from '../../../../shared/src/constants';
import type { User } from '../../../../shared/src/types';

const logger = pino({ name: 'auth-service' });

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export function validateAddress(address: string): boolean {
  return EVM_ADDRESS_REGEX.test(address);
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeNonce(address: string, nonce: string): Promise<void> {
  const key = `nonce:${address.toLowerCase()}`;
  await redis.set(key, nonce, 'EX', NONCE_TTL);
}

export async function getNonce(address: string): Promise<string | null> {
  const key = `nonce:${address.toLowerCase()}`;
  return redis.get(key);
}

export async function deleteNonce(address: string): Promise<void> {
  const key = `nonce:${address.toLowerCase()}`;
  await redis.del(key);
}

export function verifySignature(
  address: string,
  signature: string,
  nonce: string,
): boolean {
  try {
    const message = `Click Win Authentication\n\nNonce: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (err) {
    logger.warn({ err, address }, 'Signature verification failed');
    return false;
  }
}

export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    const idx = crypto.randomInt(0, REFERRAL_CODE_CHARS.length);
    code += REFERRAL_CODE_CHARS[idx];
  }
  return code;
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const { rows } = await query(FIND_USER_BY_REFERRAL_CODE, [code]);
    if (rows.length === 0) return code;
  }
  // Fallback: use more entropy
  return crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 6);
}

export async function createOrFindUser(
  address: string,
  referralCode?: string,
): Promise<{ user: User; isNew: boolean; clickBalance: number }> {
  const normalizedAddress = ethers.getAddress(address); // checksum

  // Check if user already exists
  const { rows: existing } = await query<User>(FIND_USER_BY_ADDRESS, [normalizedAddress]);
  if (existing.length > 0) {
    const user = existing[0];
    const { rows: balanceRows } = await query(GET_CLICK_BALANCE, [user.id]);
    const clickBalance = balanceRows.length > 0 ? balanceRows[0].available_clicks : 0;
    return { user, isNew: false, clickBalance };
  }

  // New user creation with transaction
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const newReferralCode = await generateUniqueReferralCode();
    let referredBy: string | null = null;
    let bonusPending = false;

    if (referralCode) {
      const { rows: referrerRows } = await client.query<User>(
        FIND_USER_BY_REFERRAL_CODE,
        [referralCode.toUpperCase()],
      );
      if (referrerRows.length > 0) {
        const referrer = referrerRows[0];
        // Prevent self-referral (shouldn't happen with new user, but safety check)
        if (referrer.wallet_address.toLowerCase() !== normalizedAddress.toLowerCase()) {
          referredBy = referrer.id;
          bonusPending = true;
        }
      }
    }

    const { rows: newUsers } = await client.query<User>(CREATE_USER, [
      normalizedAddress,
      newReferralCode,
      referredBy,
      bonusPending,
    ]);
    const user = newUsers[0];

    // Initialize click balance
    await client.query(
      'INSERT INTO click_balances (user_id, available_clicks, total_purchased) VALUES ($1, 0, 0)',
      [user.id],
    );

    await client.query('COMMIT');

    logger.info({ userId: user.id, address: normalizedAddress, referredBy }, 'New user created');

    return { user, isNew: true, clickBalance: 0 };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
