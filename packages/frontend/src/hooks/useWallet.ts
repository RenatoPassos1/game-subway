// Click Win useWallet Hook
// Wraps WalletContext with convenience logic

import { useCallback, useMemo } from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import { BNB_CHAIN_ID } from '@click-win/shared/src/constants';

interface UseWalletReturn {
  walletAddress: string | null;
  shortAddress: string;
  isConnected: boolean;
  isCorrectChain: boolean;
  chainId: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToBNBChain: () => Promise<void>;
  ensureCorrectChain: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const ctx = useWalletContext();

  const isCorrectChain = ctx.chainId === BNB_CHAIN_ID;

  const shortAddress = useMemo(() => {
    if (!ctx.walletAddress) return '';
    return `${ctx.walletAddress.slice(0, 6)}...${ctx.walletAddress.slice(-4)}`;
  }, [ctx.walletAddress]);

  const connectWallet = useCallback(async () => {
    await ctx.connectWallet();
  }, [ctx]);

  const ensureCorrectChain = useCallback(async () => {
    if (!isCorrectChain) {
      await ctx.switchToBNBChain();
    }
  }, [isCorrectChain, ctx]);

  return {
    walletAddress: ctx.walletAddress,
    shortAddress,
    isConnected: ctx.isConnected,
    isCorrectChain,
    chainId: ctx.chainId,
    connectWallet,
    disconnectWallet: ctx.disconnectWallet,
    signMessage: ctx.signMessage,
    switchToBNBChain: ctx.switchToBNBChain,
    ensureCorrectChain,
  };
}
