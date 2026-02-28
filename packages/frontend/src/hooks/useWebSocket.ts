// Click Win useWebSocket Hook
// Connects to WS with JWT, auto-reconnects, parses JSON messages

import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_EVENTS } from '@click-win/shared/src/constants';
import {
  createWsManager,
  destroyWsManager,
  type WebSocketManager,
  type MessageHandler,
} from '../utils/ws';

type WsEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];

interface UseWebSocketOptions {
  url: string;
  token: string | null;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  send: (event: string, payload?: unknown) => void;
  lastMessage: { event: string; data: unknown } | null;
  isConnected: boolean;
  subscribe: (event: WsEventType | string, handler: MessageHandler) => () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, token, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    event: string;
    data: unknown;
  } | null>(null);
  const wsRef = useRef<WebSocketManager | null>(null);
  const activeSubscriptions = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!enabled || !token) {
      destroyWsManager();
      wsRef.current = null;
      setIsConnected(false);
      return;
    }

    const ws = createWsManager({
      url,
      token,
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
    });

    wsRef.current = ws;

    // Global wildcard listener for lastMessage
    const offWildcard = ws.on('*', (data) => {
      const msg = data as { event?: string; data?: unknown };
      if (msg.event) {
        setLastMessage({ event: msg.event, data: msg.data });
      }
    });

    ws.connect();

    return () => {
      offWildcard();
      activeSubscriptions.current.forEach((unsub) => unsub());
      activeSubscriptions.current = [];
      destroyWsManager();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [url, token, enabled]);

  const send = useCallback((event: string, payload: unknown = {}) => {
    wsRef.current?.send(event, payload);
  }, []);

  const subscribe = useCallback(
    (event: WsEventType | string, handler: MessageHandler): (() => void) => {
      if (!wsRef.current) {
        // Return no-op if not connected yet; the handler will be missed
        return () => {};
      }

      const unsub = wsRef.current.on(event, handler);
      activeSubscriptions.current.push(unsub);

      return () => {
        unsub();
        activeSubscriptions.current = activeSubscriptions.current.filter(
          (fn) => fn !== unsub
        );
      };
    },
    []
  );

  return { send, lastMessage, isConnected, subscribe };
}
