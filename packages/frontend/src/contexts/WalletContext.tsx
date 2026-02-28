'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BNB_CHAIN_ID } from '@click-win/shared/src/constants';

// ---------- ethers v6 browser provider types ----------
// We type the subset we use so the component works even if ethers isn't yet
// installed (it just won't connect). Runtime usage is dynamic import.

interface EthersLike {
  BrowserProvider: new (provider: unknown) => {
    getSigner(): Promise<{
      getAddress(): Promise<string>;
      signMessage(message: string): Promise<string>;
    }>;
    getNetwork(): Promise<{ chainId: bigint }>;
  };
}

// ---------- MetaMask window type ----------
interface MetaMaskEthereum {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskEthereum;
  }
}

// ---------- Context type ----------
interface WalletContextValue {
  walletAddress: string | null;
  isConnected: boolean;
  chainId: number;
  isMetaMaskInstalled: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToBNBChain: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ---------- BNB Chain params ----------
const BNB_CHAIN_HEX = `0x${BNB_CHAIN_ID.toString(16)}`;
const BNB_CHAIN_PARAMS = {
  chainId: BNB_CHAIN_HEX,
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

// ---------- Provider ----------
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [ethersLib, setEthersLib] = useState<EthersLike | null>(null);

  const isMetaMaskInstalled =
    typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;

  // Lazy-load ethers to avoid SSR issues
  useEffect(() => {
    import('ethers').then((mod) => {
      setEthersLib(mod as unknown as EthersLike);
    }).catch(() => {
      // ethers not available
    });
  }, []);

  // ---------- Account / chain change listeners ----------
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainHex = args[0] as string;
      setChainId(parseInt(chainHex, 16));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // ---------- Auto-reconnect on page load ----------
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    (async () => {
      try {
        const accounts = (await ethereum.request({
          method: 'eth_accounts',
        })) as string[];
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
        const chainHex = (await ethereum.request({
          method: 'eth_chainId',
        })) as string;
        setChainId(parseInt(chainHex, 16));
      } catch {
        // Silent fail on auto-connect
      }
    })();
  }, []);

  // ---------- Connect ----------
  const connectWallet = useCallback(async () => {
    const ethereum = window.ethereum;
    if (!ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    const accounts = (await ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask.');
    }

    setWalletAddress(accounts[0]);

    const chainHex = (await ethereum.request({
      method: 'eth_chainId',
    })) as string;
    setChainId(parseInt(chainHex, 16));
  }, []);

  // ---------- Disconnect ----------
  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setChainId(0);
  }, []);

  // ---------- Sign message ----------
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      const ethereum = window.ethereum;
      if (!ethereum) throw new Error('MetaMask is not installed.');
      if (!ethersLib) throw new Error('ethers library not loaded.');

      const provider = new ethersLib.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      return signer.signMessage(message);
    },
    [ethersLib]
  );

  // ---------- Switch to BNB Chain ----------
  const switchToBNBChain = useCallback(async () => {
    const ethereum = window.ethereum;
    if (!ethereum) throw new Error('MetaMask is not installed.');

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BNB_CHAIN_HEX }],
      });
    } catch (switchError: unknown) {
      // Chain not added - try adding it
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BNB_CHAIN_PARAMS],
        });
      } else {
        throw switchError;
      }
    }

    setChainId(BNB_CHAIN_ID);
  }, []);

  // ---------- Memoised value ----------
  const value = useMemo<WalletContextValue>(
    () => ({
      walletAddress,
      isConnected: !!walletAddress,
      chainId,
      isMetaMaskInstalled,
      connectWallet,
      disconnectWallet,
      signMessage,
      switchToBNBChain,
    }),
    [
      walletAddress,
      chainId,
      isMetaMaskInstalled,
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
