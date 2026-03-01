'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { BNB_CHAIN_ID } from '@click-win/shared/src/constants';

// ---------- Context type (same interface as before) ----------
interface WalletContextValue {
  walletAddress: string | null;
  isConnected: boolean;
  chainId: number;
  isMetaMaskInstalled: boolean; // kept for backward compat, always true with AppKit
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToBNBChain: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ---------- Provider ----------
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId: accountChainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();

  // ---------- Connect (opens AppKit modal) ----------
  const connectWallet = useCallback(async () => {
    await open({ view: 'Connect' });
  }, [open]);

  // ---------- Disconnect ----------
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // ---------- Sign message ----------
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      const signature = await signMessageAsync({ message });
      return signature;
    },
    [signMessageAsync]
  );

  // ---------- Switch to BNB Chain ----------
  const switchToBNBChain = useCallback(async () => {
    await switchChainAsync({ chainId: BNB_CHAIN_ID });
  }, [switchChainAsync]);

  // ---------- Memoised value ----------
  const value = useMemo<WalletContextValue>(
    () => ({
      walletAddress: address ?? null,
      isConnected,
      chainId: accountChainId ?? 0,
      isMetaMaskInstalled: true, // AppKit supports many wallets, not just MetaMask
      connectWallet,
      disconnectWallet,
      signMessage,
      switchToBNBChain,
    }),
    [
      address,
      isConnected,
      accountChainId,
      connectWallet,
      disconnectWallet,
      signMessage,
      switchToBNBChain,
    ]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return ctx;
}

export { WalletContext };
export type { WalletContextValue };
