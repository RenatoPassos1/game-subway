import { ethers } from 'ethers';
import pino from 'pino';
import { config } from './config';

const logger = pino({ name: 'rpc', level: config.logLevel });

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const RATE_LIMIT_MIN_INTERVAL_MS = 100; // at most 10 req/s

export class RpcClient {
  private primaryProvider: ethers.JsonRpcProvider;
  private fallbackProvider: ethers.JsonRpcProvider | null = null;
  private activeProvider: ethers.JsonRpcProvider;
  private usingFallback = false;
  private lastRequestTime = 0;
  private consecutiveFailures = 0;
  private lastKnownBlock = 0;

  constructor() {
    this.primaryProvider = new ethers.JsonRpcProvider(
      config.bnbRpcUrl,
      config.chainId,
      { staticNetwork: true }
    );

    if (config.alchemyApiKey) {
      const alchemyUrl = `${config.alchemyRpcUrl}/${config.alchemyApiKey}`;
      this.fallbackProvider = new ethers.JsonRpcProvider(
        alchemyUrl,
        config.chainId,
        { staticNetwork: true }
      );
      logger.info('Fallback Alchemy RPC configured');
    } else {
      logger.warn('No ALCHEMY_API_KEY set; fallback RPC unavailable');
    }

    this.activeProvider = this.primaryProvider;
  }

  /**
   * Rate-limit enforcement: waits until at least RATE_LIMIT_MIN_INTERVAL_MS
   * has elapsed since the last request.
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MIN_INTERVAL_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Execute an RPC call with retry, backoff, and fallback switching.
   */
  async call<T>(fn: (provider: ethers.JsonRpcProvider) => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.enforceRateLimit();

      try {
        const result = await fn(this.activeProvider);
        this.consecutiveFailures = 0;
        return result;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.consecutiveFailures++;

        const isRateLimit =
          lastError.message.includes('429') ||
          lastError.message.includes('rate limit') ||
          lastError.message.includes('Too Many Requests');

        logger.warn(
          {
            attempt: attempt + 1,
            usingFallback: this.usingFallback,
            error: lastError.message,
            isRateLimit,
          },
          'RPC call failed, retrying'
        );

        // Switch to fallback after 2 consecutive failures
        if (this.consecutiveFailures >= 2 && !this.usingFallback) {
          this.switchToFallback();
        }

        // Exponential backoff
        const backoff = Math.min(
          BASE_BACKOFF_MS * Math.pow(2, attempt),
          MAX_BACKOFF_MS
        );
        const jitter = Math.random() * backoff * 0.3;
        await new Promise((r) => setTimeout(r, backoff + jitter));
      }
    }

    throw new Error(
      `RPC call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Switch to fallback Alchemy provider.
   */
  switchToFallback(): void {
    if (this.fallbackProvider && !this.usingFallback) {
      this.usingFallback = true;
      this.activeProvider = this.fallbackProvider;
      this.consecutiveFailures = 0;
      logger.info('Switched to fallback Alchemy RPC');
    }
  }

  /**
   * Switch back to primary provider.
   */
  switchToPrimary(): void {
    if (this.usingFallback) {
      this.usingFallback = false;
      this.activeProvider = this.primaryProvider;
      this.consecutiveFailures = 0;
      logger.info('Switched back to primary RPC');
    }
  }

  /**
   * Get the currently active provider.
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.activeProvider;
  }

  /**
   * Get latest block number with retry.
   */
  async getBlockNumber(): Promise<number> {
    const blockNumber = await this.call((p) => p.getBlockNumber());
    this.lastKnownBlock = blockNumber;
    return blockNumber;
  }

  /**
   * Get a block with full transaction objects.
   */
  async getBlock(blockNumber: number): Promise<ethers.Block | null> {
    return this.call((p) => p.getBlock(blockNumber, true));
  }

  /**
   * Get transaction receipt.
   */
  async getTransactionReceipt(
    txHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    return this.call((p) => p.getTransactionReceipt(txHash));
  }

  /**
   * Get logs for a given filter.
   */
  async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
    return this.call((p) => p.getLogs(filter));
  }

  /**
   * Health check: try to get block number from the active provider.
   * Returns true if healthy, false otherwise.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.enforceRateLimit();
      const blockNumber = await this.activeProvider.getBlockNumber();
      this.lastKnownBlock = blockNumber;
      logger.debug({ blockNumber, usingFallback: this.usingFallback }, 'RPC health OK');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ error: message, usingFallback: this.usingFallback }, 'RPC health check failed');

      // Try switching providers on health check failure
      if (!this.usingFallback) {
        this.switchToFallback();
      } else {
        this.switchToPrimary();
      }
      return false;
    }
  }

  /**
   * Get the last known block number.
   */
  getLastKnownBlock(): number {
    return this.lastKnownBlock;
  }

  /**
   * Returns true if using the fallback provider.
   */
  isUsingFallback(): boolean {
    return this.usingFallback;
  }
}
