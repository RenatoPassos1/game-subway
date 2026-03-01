import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc } from '@reown/appkit/networks';

// Get a free projectId at https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? '';

if (!projectId) {
  console.warn(
    '[AppKit] NEXT_PUBLIC_REOWN_PROJECT_ID is not set. ' +
    'Get a free one at https://cloud.reown.com'
  );
}

export const appKitNetworks = [bsc] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [bsc],
});
