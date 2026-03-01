'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getNonce, verifyAuth, getBalance, setAuthToken } from '../utils/api';
import { createWsManager, destroyWsManager } from '../utils/ws';
import { useWalletContext } from './WalletContext';
import { WS_EVENTS } from '@click-win/shared/src/constants';
import type { WsBalancePayload } from '@click-win/shared/src/types';

// ---------- Types ----------
interface AuthUser {
  id: string;
  walletAddress: string;
  referralCode: string;
  clickBalance: number;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (referralCode?: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'clickwin_token';
const USER_KEY = 'clickwin_user';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws';

// ---------- Provider ----------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, isConnected, signMessage } = useWalletContext();

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(TOKEN_KEY);
    // Sync module-level authToken IMMEDIATELY so any child effect
    // (e.g. DepositPanel) that fires on the first render cycle
    // already has the token available for API requests.
    if (stored) setAuthToken(stored);
    return stored;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!token && !!user;

  // ---------- Persist token / user ----------
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // ---------- Restore auth token on mount ----------
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // ---------- WebSocket connection ----------
  useEffect(() => {
    if (!token) {
      destroyWsManager();
      return;
    }

    const ws = createWsManager({
      url: WS_URL,
      token,
      onOpen: () => {
        // Connected
      },
      onClose: () => {
        // Will auto-reconnect
      },
    });

    // Listen for balance updates
    const offBalance = ws.on(WS_EVENTS.BALANCE_UPDATED, (data) => {
      const payload = data as WsBalancePayload;
      setUser((prev: AuthUser | null) => {
        if (!prev) return prev;
        return { ...prev, clickBalance: payload.clicks };
      });
    });

    // Listen for referral bonus
    const offReferral = ws.on(WS_EVENTS.REFERRAL_BONUS, (data) => {
      const payload = data as { clicksEarned: number };
      setUser((prev: AuthUser | null) => {
        if (!prev) return prev;
        return { ...prev, clickBalance: prev.clickBalance + payload.clicksEarned };
      });
    });

    ws.connect();

    return () => {
      offBalance();
      offReferral();
      destroyWsManager();
    };
  }, [token]);

  // ---------- Auto-logout when wallet disconnects ----------
  // Skip the first render: on hard refresh, wallet hasn't reconnected yet
  // but user is loaded from localStorage. Without this guard the effect
  // would immediately clear the token before MetaMask has a chance to
  // return accounts via eth_accounts.
  const walletInitRef = useRef(false);
  useEffect(() => {
    if (!walletInitRef.current) {
      walletInitRef.current = true;
      return;
    }
    if (!isConnected && user) {
      // Wallet actually disconnected after being connected - clear auth
      setToken(null);
      setUser(null);
    }
  }, [isConnected]);

  // ---------- Login ----------
  const login = useCallback(
    async (referralCode?: string) => {
      if (!walletAddress) {
        throw new Error('Wallet not connected.');
      }

      setIsLoading(true);
      try {
        // 1. Get nonce from server
        const { nonce } = await getNonce(walletAddress);

        // 2. Sign nonce with wallet
        const message = `Click Win Authentication\n\nNonce: ${nonce}\nAddress: ${walletAddress}`;
        const signature = await signMessage(message);

        // 3. Verify signature with server
        const response = await verifyAuth({
          address: walletAddress,
          signature,
          nonce,
          referralCode,
        });

        // 4. Store token and user
        // Set module-level authToken IMMEDIATELY so child effects
        // (e.g. DepositPanel) that fire on the same render cycle
        // already have the token available for API requests.
        setAuthToken(response.token);
        setToken(response.token);
        setUser(response.user);
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress, signMessage]
  );

  // ---------- Logout ----------
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    destroyWsManager();
  }, []);

  // ---------- Refresh balance ----------
  const refreshBalance = useCallback(async () => {
    if (!token) return;

    try {
      const balance = await getBalance();
      setUser((prev: AuthUser | null) => {
        if (!prev) return prev;
        return { ...prev, clickBalance: balance.available_clicks };
      });
    } catch {
      // Silently fail - balance will update via WS
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshBalance,
    }),
    [token, user, isAuthenticated, isLoading, login, logout, refreshBalance]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}

export { AuthContext };
export type { AuthContextValue, AuthUser };
