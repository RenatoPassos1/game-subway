'use client';

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { bsc } from '@reown/appkit/networks';
import { WagmiProvider, type Config } from 'wagmi';
import { wagmiAdapter, projectId } from '../config/appkit';

const queryClient = new QueryClient();

const metadata = {
  name: 'Click Win',
  description: 'Click-to-earn auction platform on BNB Smart Chain',
  url: 'https://clickwin.fun',
  icons: ['https://clickwin.fun/favicon.svg'],
};

// Singleton – only runs once on the client
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [bsc],
  defaultNetwork: bsc,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
});

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
