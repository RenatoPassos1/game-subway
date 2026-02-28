import { ethers } from 'ethers';
import pino from 'pino';
import { Pool } from 'pg';
import { config } from './config';

const logger = pino({ name: 'wallet', level: config.logLevel });

/**
 * HD Wallet module for deterministic deposit address derivation.
 *
 * Uses ethers.js HDNodeWallet to derive BIP-44 compatible addresses
 * from an xpub at path m/44'/60'/0'/0/{index}.
 *
 * BNB Chain shares the Ethereum address format, so the same derivation works.
 */
export class HdWallet {
  private parentNode: ethers.HDNodeWallet;

  constructor(xpub: string) {
    if (!xpub) {
      throw new Error('XPUB is required for HD wallet derivation');
    }

    // ethers v6: fromExtendedKey works with xpub to create a read-only HD wallet
    this.parentNode = ethers.HDNodeWallet.fromExtendedKey(xpub) as ethers.HDNodeWallet;
    logger.info('HD wallet initialized from xpub');
  }

  /**
   * Derive a deposit address at a specific derivation index.
   * Path: m/44'/60'/0'/0/{index}
   *
   * Since the xpub already encodes the parent path, we derive child index directly.
   */
  deriveAddress(index: number): string {
    const child = this.parentNode.deriveChild(index);
    const address = child.address;
    logger.debug({ index, address }, 'Derived deposit address');
    return address;
  }
}

/**
 * Get the next derivation index by querying the max index from PG.
 */
export async function getNextDerivationIndex(pg: Pool): Promise<number> {
  const result = await pg.query<{ max_index: number | null }>(
    'SELECT MAX(derivation_index) AS max_index FROM deposit_addresses'
  );
  const maxIndex = result.rows[0]?.max_index;
  const nextIndex = maxIndex !== null && maxIndex !== undefined ? maxIndex + 1 : 0;
  logger.debug({ nextIndex }, 'Next derivation index');
  return nextIndex;
}

/**
 * Generate a new deposit address for a user, store it in PG, and return it.
 */
export async function generateNewAddress(
  pg: Pool,
  wallet: HdWallet,
  userId: string
): Promise<{ address: string; derivationIndex: number }> {
  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    // Get next index with a lock to prevent race conditions
    const lockResult = await client.query<{ max_index: number | null }>(
      'SELECT MAX(derivation_index) AS max_index FROM deposit_addresses FOR UPDATE'
    );
    const maxIndex = lockResult.rows[0]?.max_index;
    const derivationIndex =
      maxIndex !== null && maxIndex !== undefined ? maxIndex + 1 : 0;

    // Derive the address
    const address = wallet.deriveAddress(derivationIndex);

    // Insert into deposit_addresses
    await client.query(
      `INSERT INTO deposit_addresses (user_id, address, derivation_index)
       VALUES ($1, $2, $3)
       ON CONFLICT (address) DO NOTHING`,
      [userId, address.toLowerCase(), derivationIndex]
    );

    await client.query('COMMIT');

    logger.info({ userId, address, derivationIndex }, 'Generated new deposit address');
    return { address: address.toLowerCase(), derivationIndex };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
