// Click Win WebSocket Client Manager
// Handles connection, auto-reconnect, heartbeat, and message queueing

import { WS_EVENTS } from '@click-win/shared/src/constants';

type WsEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
type MessageHandler = (data: unknown) => void;

interface QueuedMessage {
  event: string;
  payload: unknown;
  timestamp: number;
}

interface WsManagerOptions {
  url: string;
  token: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempt = 0;
  private maxReconnectDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;
  private _isConnected = false;
  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;
  private onErrorCallback?: (error: Event) => void;

  constructor(options: WsManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30_000;
    this.heartbeatInterval = options.heartbeatInterval ?? 25_000;
    this.onOpenCallback = options.onOpen;
    this.onCloseCallback = options.onClose;
    this.onErrorCallback = options.onError;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  connect(): void {
    if (this.isDestroyed) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const separator = this.url.includes('?') ? '&' : '?';
      const wsUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        this.flushQueue();
        this.onOpenCallback?.();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.event === 'pong') return;

          const handlers = this.listeners.get(message.event);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data ?? message.payload));
          }

          // Also fire wildcard listeners
          const wildcardHandlers = this.listeners.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(message));
          }
        } catch {
          // Non-JSON message, ignore
        }
      };

      this.ws.onclose = () => {
        this._isConnected = false;
        this.stopHeartbeat();
        this.onCloseCallback?.();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error: Event) => {
        this.onErrorCallback?.(error);
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushQueue(): void {
    const now = Date.now();
    const validMessages = this.messageQueue.filter(
      (msg) => now - msg.timestamp < 30_000
    );
    this.messageQueue = [];

    for (const msg of validMessages) {
      this.sendRaw(msg.event, msg.payload);
    }
  }

  private sendRaw(event: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data: payload }));
    }
  }

  send(event: string, payload: unknown = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw(event, payload);
    } else {
      this.messageQueue.push({
        event,
        payload,
        timestamp: Date.now(),
      });
    }
  }

  on(event: WsEventType | string, handler: MessageHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: MessageHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  updateToken(token: string): void {
    this.token = token;
    if (this._isConnected) {
      this.ws?.close();
      // Reconnect will happen automatically via onclose
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.messageQueue = [];
    this._isConnected = false;
  }
}

// Singleton-ish factory so we don't accidentally create multiple connections
let instance: WebSocketManager | null = null;

export function createWsManager(options: WsManagerOptions): WebSocketManager {
  if (instance) {
    instance.destroy();
  }
  instance = new WebSocketManager(options);
  return instance;
}

export function getWsManager(): WebSocketManager | null {
  return instance;
}

export function destroyWsManager(): void {
  instance?.destroy();
  instance = null;
}

export { WebSocketManager };
export type { WsManagerOptions, MessageHandler, WsEventType };
