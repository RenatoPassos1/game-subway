import { ethers } from 'ethers';
import { Pool } from 'pg';
import Redis from 'ioredis';
import pino from 'pino';
import { RpcClient } from './rpc';
import { config } from './config';

const logger = pino({ name: 'scanner', level: config.logLevel });

// ERC-20 Transfer event signature
const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');

export interface DetectedDeposit {
  txHash: string;
  from: string;
  to: string;
  amount: string; // in human-readable decimals (e.g. "10.5")
  token: 'BNB' | 'USDT';
  blockNumber: number;
}

/**
 * BlockScanner monitors the BNB Chain for native BNB transfers and
 * USDT (BEP-20) Transfer events to deposit addresses we control.
 */
export class BlockScanner {
  private rpc: RpcClient;
  private pg: Pool;
  private redis: Redis;
  private monitoredAddresses: Set<string> = new Set();
  private lastScannedBlock = 0;
  private running = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(rpc: RpcClient, pg: Pool, redis: Redis) {
    this.rpc = rpc;
    this.pg = pg;
    this.redis = redis;
  }

  /**
   * Load all monitored deposit addresses from PostgreSQL.
   */
  async loadMonitoredAddresses(): Promise<void> {
    const result = await this.pg.query<{ address: string }>(
      'SELECT address FROM deposit_addresses'
    );
    this.monitoredAddresses.clear();
    for (const row of result.rows) {
      this.monitoredAddresses.add(row.address.toLowerCase());
    }
    logger.info(
      { count: this.monitoredAddresses.size },
      'Loaded monitored deposit addresses'
    );
  }

  /**
   * Add a single address to the monitoring set (e.g. when a new one is generated).
   */
  addAddress(address: string): void {
    this.monitoredAddresses.add(address.toLowerCase());
    logger.debug({ address: address.toLowerCase() }, 'Added address to monitoring set');
  }

  /**
   * Get the initial block to start scanning from.
   * Priority: Redis persisted state > config.startBlock > latest chain block.
   */
  private async resolveStartBlock(): Promise<number> {
    // Check Redis for last scanned block
    const stored = await this.redis.get('watcher:lastScannedBlock');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        logger.info({ block: parsed }, 'Resuming from Redis-persisted block');
        return parsed;
      }
    }

    // Fall back to config or latest
    if (config.startBlock > 0) {
      logger.info({ block: config.startBlock }, 'Starting from configured block');
      return config.startBlock;
    }

    const latest = await this.rpc.getBlockNumber();
    logger.info({ block: latest }, 'Starting from latest chain block');
    return latest;
  }

  /**
   * Persist the last scanned block to Redis.
   */
  private async persistLastScannedBlock(): Promise<void> {
    await this.redis.set('watcher:lastScannedBlock', this.lastScannedBlock.toString());
  }

  /**
   * Start the polling loop.
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Scanner already running');
      return;
    }

    await this.loadMonitoredAddresses();
    this.lastScannedBlock = await this.resolveStartBlock();
    this.running = true;

    logger.info(
      { lastScannedBlock: this.lastScannedBlock, pollIntervalMs: config.pollIntervalMs },
      'Block scanner started'
    );

    this.poll();
  }

  /**
   * Stop the polling loop.
   */
  async stop(): Promise<void> {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    await this.persistLastScannedBlock();
    logger.info({ lastScannedBlock: this.lastScannedBlock }, 'Block scanner stopped');
  }

  /**
   * Poll loop: checks for new blocks and scans them.
   */
  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      const latestBlock = await this.rpc.getBlockNumber();

      if (latestBlock > this.lastScannedBlock) {
        // Batch scan: process up to batchSize blocks per tick
        const from = this.lastScannedBlock + 1;
        const to = Math.min(from + config.batchSize - 1, latestBlock);

        const allDeposits: DetectedDeposit[] = [];

        for (let blockNum = from; blockNum <= to; blockNum++) {
          const deposits = await this.scanBlock(blockNum);
          allDeposits.push(...deposits);
        }

        this.lastScannedBlock = to;
        await this.persistLastScannedBlock();

        if (allDeposits.length > 0) {
          logger.info(
            { count: allDeposits.length, fromBlock: from, toBlock: to },
            'Detected deposits in block range'
          );
        }

        // Emit deposits for the processor to handle
        if (allDeposits.length > 0) {
          this.onDepositsDetected?.(allDeposits);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ error: message }, 'Error in poll loop');
    }

    // Schedule next poll
    if (this.running) {
      this.pollTimer = setTimeout(() => this.poll(), config.pollIntervalMs);
    }
  }

  /**
   * Scan a single block for deposits.
   */
  async scanBlock(blockNumber: number): Promise<DetectedDeposit[]> {
    const deposits: DetectedDeposit[] = [];

    if (this.monitoredAddresses.size === 0) {
      return deposits;
    }

    // 1. Scan native BNB transfers
    const bnbDeposits = await this.scanBnbTransfers(blockNumber);
    deposits.push(...bnbDeposits);

    // 2. Scan USDT (BEP-20) Transfer events
    const usdtDeposits = await this.scanUsdtTransfers(blockNumber);
    deposits.push(...usdtDeposits);

    return deposits;
  }

  /**
   * Scan native BNB transfers in a block.
   */
  private async scanBnbTransfers(blockNumber: number): Promise<DetectedDeposit[]> {
    const deposits: DetectedDeposit[] = [];

    const block = await this.rpc.getBlock(blockNumber);
    if (!block || !block.prefetchedTransactions) {
      return deposits;
    }

    for (const tx of block.prefetchedTransactions) {
      if (!tx.to) continue; // skip contract creation

      const recipient = tx.to.toLowerCase();
      if (!this.monitoredAddresses.has(recipient)) continue;
      if (tx.value === 0n) continue; // skip zero-value tx

      const amount = ethers.formatEther(tx.value);

      deposits.push({
        txHash: tx.hash,
        from: tx.from.toLowerCase(),
        to: recipient,
        amount,
        token: 'BNB',
        blockNumber,
      });

      logger.info(
        { txHash: tx.hash, from: tx.from, to: recipient, amount, token: 'BNB' },
        'Detected BNB deposit'
      );
    }

    return deposits;
  }

  /**
   * Scan USDT BEP-20 Transfer events in a block.
   */
  private async scanUsdtTransfers(blockNumber: number): Promise<DetectedDeposit[]> {
    const deposits: DetectedDeposit[] = [];

    const filter: ethers.Filter = {
      address: config.usdtContract,
      fromBlock: blockNumber,
      toBlock: blockNumber,
      topics: [TRANSFER_EVENT_TOPIC],
    };

    const logs = await this.rpc.getLogs(filter);

    for (const log of logs) {
      // Transfer(address indexed from, address indexed to, uint256 value)
      if (!log.topics || log.topics.length < 3) continue;

      const fromRaw = log.topics[1];
      const toRaw = log.topics[2];

      // Decode addresses from 32-byte topics (strip leading zeros)
      const from = ethers.getAddress('0x' + fromRaw.slice(26)).toLowerCase();
      const to = ethers.getAddress('0x' + toRaw.slice(26)).toLowerCase();

      if (!this.monitoredAddresses.has(to)) continue;

      // USDT on BSC has 18 decimals
      const amount = ethers.formatUnits(log.data, 18);

      deposits.push({
        txHash: log.transactionHash,
        from,
        to,
        amount,
        token: 'USDT',
        blockNumber: log.blockNumber,
      });

      logger.info(
        { txHash: log.transactionHash, from, to, amount, token: 'USDT' },
        'Detected USDT deposit'
      );
    }

    return deposits;
  }

  /**
   * Callback for when deposits are detected. Set by the index orchestrator.
   */
  onDepositsDetected: ((deposits: DetectedDeposit[]) => void) | null = null;

  /**
   * Get current scanner status.
   */
  getStatus(): {
    running: boolean;
    lastScannedBlock: number;
    monitoredAddressCount: number;
  } {
    return {
      running: this.running,
      lastScannedBlock: this.lastScannedBlock,
      monitoredAddressCount: this.monitoredAddresses.size,
    };
  }

  /**
   * Get the last scanned block number.
   */
  getLastScannedBlock(): number {
    return this.lastScannedBlock;
  }
}
