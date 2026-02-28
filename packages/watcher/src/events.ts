import Redis from 'ioredis';
import pino from 'pino';
import { config } from './config';

const logger = pino({ name: 'events', level: config.logLevel });

// Channel names for inter-service communication
export const CHANNELS = {
  BALANCE_UPDATED: 'balance:updated',
  REFERRAL_BONUS: 'referral:bonus',
  DEPOSIT_CONFIRMED: 'deposit:confirmed',
  ADDRESS_NEW: 'address:new',
} as const;

export type ChannelName = (typeof CHANNELS)[keyof typeof CHANNELS];

export interface EventMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface BalanceUpdatedPayload {
  userId: string;
  clicks: number;
  totalPurchased: number;
  depositId: string;
}

export interface ReferralBonusPayload {
  referrerId: string;
  referredId: string;
  referredWallet: string;
  clicksEarned: number;
  depositId: string;
}

export interface DepositConfirmedPayload {
  depositId: string;
  userId: string;
  txHash: string;
  amount: number;
  token: string;
  clicksCredited: number;
}

export interface AddressNewPayload {
  userId: string;
  address: string;
}

type MessageHandler = (channel: string, message: string) => void;

/**
 * Redis pub/sub event emitter for inter-service communication.
 * Uses separate Redis connections for pub and sub (required by Redis).
 */
export class EventEmitter {
  private pubClient: Redis;
  private subClient: Redis;
  private handlers: Map<string, Array<(payload: unknown) => void>> = new Map();
  private isSubscribed = false;

  constructor(redisUrl: string) {
    this.pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
    });

    this.subClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
    });

    this.pubClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis pub client error');
    });
    this.subClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis sub client error');
    });
  }

  /**
   * Connect both pub and sub clients.
   */
  async connect(): Promise<void> {
    await this.pubClient.connect();
    await this.subClient.connect();
    logger.info('Event emitter Redis connections established');
  }

  /**
   * Publish an event to a channel.
   */
  async publish<T>(channel: ChannelName, type: string, payload: T): Promise<void> {
    const message: EventMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const serialized = JSON.stringify(message);
    await this.pubClient.publish(channel, serialized);
    logger.debug({ channel, type }, 'Event published');
  }

  /**
   * Subscribe to a channel and register a handler.
   */
  async subscribe<T>(
    channel: ChannelName,
    handler: (payload: T) => void
  ): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel)!.push(handler as (payload: unknown) => void);

    if (!this.isSubscribed) {
      const messageHandler: MessageHandler = (ch, raw) => {
        try {
          const message: EventMessage = JSON.parse(raw);
          const channelHandlers = this.handlers.get(ch);
          if (channelHandlers) {
            for (const h of channelHandlers) {
              h(message.payload);
            }
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          logger.error({ channel: ch, error: errMsg }, 'Failed to process event message');
        }
      };

      this.subClient.on('message', messageHandler);
      this.isSubscribed = true;
    }

    await this.subClient.subscribe(channel);
    logger.info({ channel }, 'Subscribed to channel');
  }

  /**
   * Convenience: publish balance:updated event.
   */
  async emitBalanceUpdated(payload: BalanceUpdatedPayload): Promise<void> {
    await this.publish(CHANNELS.BALANCE_UPDATED, 'balance:updated', payload);
  }

  /**
   * Convenience: publish referral:bonus event.
   */
  async emitReferralBonus(payload: ReferralBonusPayload): Promise<void> {
    await this.publish(CHANNELS.REFERRAL_BONUS, 'referral:bonus', payload);
  }

  /**
   * Convenience: publish deposit:confirmed event.
   */
  async emitDepositConfirmed(payload: DepositConfirmedPayload): Promise<void> {
    await this.publish(CHANNELS.DEPOSIT_CONFIRMED, 'deposit:confirmed', payload);
  }

  /**
   * Get the pub client for direct Redis operations (e.g., INCRBY).
   */
  getPubClient(): Redis {
    return this.pubClient;
  }

  /**
   * Disconnect both clients.
   */
  async disconnect(): Promise<void> {
    if (this.isSubscribed) {
      await this.subClient.unsubscribe();
    }
    this.subClient.disconnect();
    this.pubClient.disconnect();
    this.handlers.clear();
    this.isSubscribed = false;
    logger.info('Event emitter disconnected');
  }
}
