import { ethers } from 'ethers';
import { Pool } from 'pg';
import pino from 'pino';
import { RpcClient } from './rpc';
import { config } from './config';

const logger = pino({ name: 'reconciliation', level: config.logLevel });

// ERC-20 Transfer event signature
const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');

interface Discrepancy {
  type: 'MISSING_DEPOSIT' | 'UNMATCHED_TX';
  txHash: string;
  to: string;
  amount: string;
  token: 'BNB' | 'USDT';
  blockNumber: number;
  details: string;
}

/**
 * Reconciliation job that periodically re-scans recent blocks to
 * catch any deposits that may have been missed by the real-time scanner.
 */
export class ReconciliationJob {
  private rpc: RpcClient;
  private pg: Pool;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private isReconciling = false;

  constructor(rpc: RpcClient, pg: Pool) {
    this.rpc = rpc;
    this.pg = pg;
  }

  /**
   * Start the periodic reconciliation job.
   */
  start(): void {
    if (this.running) {
      logger.warn('Reconciliation job already running');
      return;
    }

    this.running = true;
    this.timer = setInterval(
      () => this.runReconciliation(),
      config.reconciliationIntervalMs
    );

    logger.info(
      { intervalMs: config.reconciliationIntervalMs },
      'Reconciliation job started'
    );
  }

  /**
   * Stop the reconciliation job.
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info('Reconciliation job stopped');
  }

  /**
   * Run a single reconciliation pass.
   */
  async runReconciliation(): Promise<Discrepancy[]> {
    if (this.isReconciling) {
      logger.debug('Reconciliation already in progress, skipping');
      return [];
    }

    this.isReconciling = true;
    const startTime = Date.now();
    const discrepancies: Discrepancy[] = [];

    try {
      const currentBlock = await this.rpc.getBlockNumber();
      const fromBlock = currentBlock - config.reconciliationBlockRange;
      const toBlock = currentBlock;

      logger.info(
        { fromBlock, toBlock, range: config.reconciliationBlockRange },
        'Starting reconciliation scan'
      );

      // Load all monitored addresses
      const addressResult = await this.pg.query<{ address: string }>(
        'SELECT address FROM deposit_addresses'
      );
      const monitoredAddresses = new Set(
        addressResult.rows.map((r) => r.address.toLowerCase())
      );

      if (monitoredAddresses.size === 0) {
        logger.info('No monitored addresses, skipping reconciliation');
        return [];
      }

      // Load all known tx_hashes for this block range
      const depositResult = await this.pg.query<{ tx_hash: string }>(
        `SELECT tx_hash FROM deposits WHERE created_at >= NOW() - INTERVAL '2 hours'`
      );
      const knownTxHashes = new Set(
        depositResult.rows.map((r) => r.tx_hash.toLowerCase())
      );

      // Scan BNB transfers in the block range
      const bnbDiscrepancies = await this.reconcileBnbTransfers(
        fromBlock,
        toBlock,
        monitoredAddresses,
        knownTxHashes
      );
      discrepancies.push(...bnbDiscrepancies);

      // Scan USDT transfers in the block range
      const usdtDiscrepancies = await this.reconcileUsdtTransfers(
        fromBlock,
        toBlock,
        monitoredAddresses,
        knownTxHashes
      );
      discrepancies.push(...usdtDiscrepancies);

      const elapsed = Date.now() - startTime;

      if (discrepancies.length > 0) {
        logger.warn(
          { count: discrepancies.length, elapsed },
          'Reconciliation found discrepancies - manual review required'
        );
        for (const d of discrepancies) {
          logger.warn(
            {
              type: d.type,
              txHash: d.txHash,
              to: d.to,
              amount: d.amount,
              token: d.token,
              blockNumber: d.blockNumber,
            },
            d.details
          );
        }

        // Insert discrepancy records into audit_logs for tracking
        for (const d of discrepancies) {
          await this.pg.query(
            `INSERT INTO audit_logs (event_type, actor, payload, ip_address)
             VALUES ($1, $2, $3, $4)`,
            [
              'RECONCILIATION_DISCREPANCY',
              'watcher',
              JSON.stringify(d),
              '0.0.0.0',
            ]
          );
        }
      } else {
        logger.info(
          { elapsed, fromBlock, toBlock },
          'Reconciliation complete - no discrepancies found'
        );
      }

      return discrepancies;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ error: message }, 'Reconciliation failed');
      return discrepancies;
    } finally {
      this.isReconciling = false;
    }
  }

  /**
   * Reconcile BNB transfers in the given block range.
   */
  private async reconcileBnbTransfers(
    fromBlock: number,
    toBlock: number,
    monitoredAddresses: Set<string>,
    knownTxHashes: Set<string>
  ): Promise<Discrepancy[]> {
    const discrepancies: Discrepancy[] = [];

    // Scan block by block (BSC public RPCs don't support eth_getLogs for native)
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
      try {
        const block = await this.rpc.getBlock(blockNum);
        if (!block || !block.prefetchedTransactions) continue;

        for (const tx of block.prefetchedTransactions) {
          if (!tx.to) continue;

          const recipient = tx.to.toLowerCase();
          if (!monitoredAddresses.has(recipient)) continue;
          if (tx.value === 0n) continue;

          if (!knownTxHashes.has(tx.hash.toLowerCase())) {
            const amount = ethers.formatEther(tx.value);
            discrepancies.push({
              type: 'MISSING_DEPOSIT',
              txHash: tx.hash,
              to: recipient,
              amount,
              token: 'BNB',
              blockNumber: blockNum,
              details: `BNB transfer ${tx.hash} to ${recipient} (${amount} BNB) not found in deposits table`,
            });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          { blockNumber: blockNum, error: message },
          'Error reconciling BNB block'
        );
      }
    }

    return discrepancies;
  }

  /**
   * Reconcile USDT transfers in the given block range.
   */
  private async reconcileUsdtTransfers(
    fromBlock: number,
    toBlock: number,
    monitoredAddresses: Set<string>,
    knownTxHashes: Set<string>
  ): Promise<Discrepancy[]> {
    const discrepancies: Discrepancy[] = [];

    try {
      // Use getLogs for efficient batch scanning of Transfer events
      const filter: ethers.Filter = {
        address: config.usdtContract,
        fromBlock,
        toBlock,
        topics: [TRANSFER_EVENT_TOPIC],
      };

      const logs = await this.rpc.getLogs(filter);

      for (const log of logs) {
        if (!log.topics || log.topics.length < 3) continue;

        const toRaw = log.topics[2];
        const to = ethers.getAddress('0x' + toRaw.slice(26)).toLowerCase();

        if (!monitoredAddresses.has(to)) continue;

        if (!knownTxHashes.has(log.transactionHash.toLowerCase())) {
          const amount = ethers.formatUnits(log.data, 18);
          discrepancies.push({
            type: 'MISSING_DEPOSIT',
            txHash: log.transactionHash,
            to,
            amount,
            token: 'USDT',
            blockNumber: log.blockNumber,
            details: `USDT transfer ${log.transactionHash} to ${to} (${amount} USDT) not found in deposits table`,
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ error: message }, 'Error reconciling USDT transfers');
    }

    return discrepancies;
  }

  /**
   * Get reconciliation status.
   */
  getStatus(): { running: boolean; isReconciling: boolean } {
    return {
      running: this.running,
      isReconciling: this.isReconciling,
    };
  }
}
