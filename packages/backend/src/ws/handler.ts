import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import pino from 'pino';
import { processClick, getAuctionState } from '../services/auction.service';
import { getClickBalance } from '../services/user.service';
import { WS_EVENTS, AUCTION_STATES } from '../../../../shared/src/constants';
import type {
  WsClickPayload,
  WsAuctionStatePayload,
  WsAuctionClickPayload,
  WsAuctionEndedPayload,
  WsBalancePayload,
  WsReferralBonusPayload,
  WsErrorPayload,
} from '../../../../shared/src/types';

const logger = pino({ name: 'ws-handler' });

// Connection tracking
interface WsClient {
  socket: WebSocket;
  userId: string;
  walletAddress: string;
  subscribedAuctions: Set<string>;
}

// Maps: userId -> WsClient[] (user can have multiple tabs)
const userConnections = new Map<string, WsClient[]>();
// Maps: auctionId -> Set<string> (userIds subscribed to auction)
const auctionSubscribers = new Map<string, Set<string>>();

export function getConnectionCount(): number {
  let count = 0;
  for (const clients of userConnections.values()) {
    count += clients.length;
  }
  return count;
}

export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.length || 0;
}

function addConnection(client: WsClient): void {
  const existing = userConnections.get(client.userId) || [];
  existing.push(client);
  userConnections.set(client.userId, existing);
}

function removeConnection(client: WsClient): void {
  // Remove from user connections
  const existing = userConnections.get(client.userId);
  if (existing) {
    const filtered = existing.filter((c) => c.socket !== client.socket);
    if (filtered.length === 0) {
      userConnections.delete(client.userId);
    } else {
      userConnections.set(client.userId, filtered);
    }
  }

  // Remove from auction subscriptions
  for (const auctionId of client.subscribedAuctions) {
    const subscribers = auctionSubscribers.get(auctionId);
    if (subscribers) {
      subscribers.delete(client.userId);
      if (subscribers.size === 0) {
        auctionSubscribers.delete(auctionId);
      }
    }
  }
}

function subscribeToAuction(client: WsClient, auctionId: string): void {
  client.subscribedAuctions.add(auctionId);
  const subscribers = auctionSubscribers.get(auctionId) || new Set();
  subscribers.add(client.userId);
  auctionSubscribers.set(auctionId, subscribers);
}

function sendToSocket(socket: WebSocket, event: string, data: unknown): void {
  if (socket.readyState === 1) { // OPEN
    try {
      socket.send(JSON.stringify({ event, data }));
    } catch (err) {
      logger.error({ err }, 'Failed to send WS message');
    }
  }
}

// ============ Broadcast Functions ============

export function broadcastToAuction(
  auctionId: string,
  event: string,
  data: unknown,
): void {
  const subscribers = auctionSubscribers.get(auctionId);
  if (!subscribers) return;

  for (const userId of subscribers) {
    const clients = userConnections.get(userId);
    if (clients) {
      for (const client of clients) {
        if (client.subscribedAuctions.has(auctionId)) {
          sendToSocket(client.socket, event, data);
        }
      }
    }
  }
}

export function broadcastToUser(
  userId: string,
  event: string,
  data: unknown,
): void {
  const clients = userConnections.get(userId);
  if (!clients) return;

  for (const client of clients) {
    sendToSocket(client.socket, event, data);
  }
}

export function broadcastAuctionEnded(payload: WsAuctionEndedPayload): void {
  broadcastToAuction(payload.auctionId, WS_EVENTS.AUCTION_ENDED, payload);
}

export function broadcastReferralBonus(
  userId: string,
  payload: WsReferralBonusPayload,
): void {
  broadcastToUser(userId, WS_EVENTS.REFERRAL_BONUS, payload);
}

export function broadcastBalanceUpdate(
  userId: string,
  payload: WsBalancePayload,
): void {
  broadcastToUser(userId, WS_EVENTS.BALANCE_UPDATED, payload);
}

// ============ Message Handlers ============

async function handleSubscribe(
  client: WsClient,
  payload: { auctionId: string },
): Promise<void> {
  const { auctionId } = payload;
  if (!auctionId) {
    sendToSocket(client.socket, WS_EVENTS.ERROR, {
      code: 'INVALID_PAYLOAD',
      message: 'auctionId is required for subscribe.',
    });
    return;
  }

  subscribeToAuction(client, auctionId);

  // Send current auction state
  const state = await getAuctionState(auctionId);
  if (state) {
    sendToSocket(client.socket, WS_EVENTS.AUCTION_STATE, state);
  } else {
    sendToSocket(client.socket, WS_EVENTS.ERROR, {
      code: 'AUCTION_NOT_FOUND',
      message: `Auction ${auctionId} not found.`,
    });
  }

  logger.debug({ userId: client.userId, auctionId }, 'Client subscribed to auction');
}

async function handleClick(
  client: WsClient,
  payload: WsClickPayload,
): Promise<void> {
  const { auctionId } = payload;

  if (!auctionId) {
    sendToSocket(client.socket, WS_EVENTS.ERROR, {
      code: 'INVALID_PAYLOAD',
      message: 'auctionId is required for click.',
    });
    return;
  }

  const result = await processClick(
    client.userId,
    client.walletAddress,
    auctionId,
  );

  if (!result.success) {
    sendToSocket(client.socket, WS_EVENTS.ERROR, {
      code: result.errorCode || 'CLICK_FAILED',
      message: `Click failed: ${result.errorCode}`,
    } as WsErrorPayload);
    return;
  }

  if (!result.auctionState) return;

  const state = result.auctionState;

  // Broadcast click event to all subscribers
  const clickPayload: WsAuctionClickPayload = {
    userId: client.userId,
    walletAddress: client.walletAddress,
    discount: state.discountPerClick,
    timer: state.timerRemaining,
    clickCount: state.clickCount,
  };
  broadcastToAuction(auctionId, WS_EVENTS.AUCTION_CLICK, clickPayload);

  // Send updated state to all subscribers
  broadcastToAuction(auctionId, WS_EVENTS.AUCTION_STATE, state);

  // Send updated balance to the clicking user
  const balance = await getClickBalance(client.userId);
  broadcastToUser(client.userId, WS_EVENTS.BALANCE_UPDATED, {
    clicks: balance.availableClicks,
    totalPurchased: balance.totalPurchased,
  } as WsBalancePayload);
}

// ============ WebSocket Registration ============

export async function registerWebSocket(fastify: FastifyInstance): Promise<void> {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    // Verify JWT from query parameter or header
    let userId: string;
    let walletAddress: string;

    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.send(JSON.stringify({
          event: WS_EVENTS.ERROR,
          data: { code: 'AUTH_REQUIRED', message: 'Token required as query parameter.' },
        }));
        socket.close(4001, 'Authentication required');
        return;
      }

      const decoded = fastify.jwt.verify<{ userId: string; walletAddress: string }>(token);
      userId = decoded.userId;
      walletAddress = decoded.walletAddress;
    } catch (err) {
      socket.send(JSON.stringify({
        event: WS_EVENTS.ERROR,
        data: { code: 'AUTH_FAILED', message: 'Invalid or expired token.' },
      }));
      socket.close(4001, 'Authentication failed');
      return;
    }

    const client: WsClient = {
      socket,
      userId,
      walletAddress,
      subscribedAuctions: new Set(),
    };

    addConnection(client);
    logger.info({ userId, connections: getConnectionCount() }, 'WS client connected');

    socket.on('message', async (rawMessage: Buffer | string) => {
      try {
        const msgStr = typeof rawMessage === 'string' ? rawMessage : rawMessage.toString();
        const message = JSON.parse(msgStr) as { event: string; data?: any };

        switch (message.event) {
          case WS_EVENTS.SUBSCRIBE:
            await handleSubscribe(client, message.data || {});
            break;
          case WS_EVENTS.CLICK:
            await handleClick(client, message.data || {});
            break;
          default:
            sendToSocket(socket, WS_EVENTS.ERROR, {
              code: 'UNKNOWN_EVENT',
              message: `Unknown event: ${message.event}`,
            });
        }
      } catch (err) {
        logger.error({ err, userId }, 'WS message handling error');
        sendToSocket(socket, WS_EVENTS.ERROR, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process message.',
        });
      }
    });

    socket.on('close', () => {
      removeConnection(client);
      logger.info({ userId, connections: getConnectionCount() }, 'WS client disconnected');
    });

    socket.on('error', (err: Error) => {
      logger.error({ err, userId }, 'WS socket error');
      removeConnection(client);
    });
  });
}
