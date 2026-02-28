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
    };

    // Allow .js extension imports to resolve without requiring
    // the extension to literally match a file on disk.
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;
