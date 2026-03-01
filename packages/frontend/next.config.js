const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,

  webpack: (config, { isServer }) => {
    // -----------------------------------------------------------
    // Fix: ethers v6 ships both CJS and ESM builds. The ESM build
    // has import-chain issues with @noble/* packages (incomplete
    // ESM builds, missing named exports). Force webpack to use
    // the CJS build for ethers and @noble/* packages.
    // -----------------------------------------------------------
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force ethers to use CJS build (avoids @noble/* ESM issues)
      'ethers': path.resolve(__dirname, '../../node_modules/ethers/lib.commonjs/ethers.js'),
      // wagmi connectors optional peer deps – stub them out
      // (AppKit handles wallet connections via its own bridge)
      'porto/internal': false,
      'porto': false,
      '@coinbase/wallet-sdk': false,
      '@metamask/sdk': false,
      '@walletconnect/ethereum-provider': false,
      '@safe-global/safe-apps-provider': false,
      '@safe-global/safe-apps-sdk': false,
      '@base-org/account': false,
    };

    // Allow .js extension imports to resolve without requiring
    // the extension to literally match a file on disk.
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // WalletConnect / AppKit optional dependencies – not needed at runtime
    // but cause build warnings if not externalised.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
    }

    return config;
  },
};

module.exports = nextConfig;
