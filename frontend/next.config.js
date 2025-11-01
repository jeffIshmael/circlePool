const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Use webpack with splitChunks to ensure @hashgraph/sdk is in a single shared chunk
  // This prevents duplicate bundling by making both hashconnect and our code use the same chunk
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: Split chunks to ensure @hashgraph/sdk is ONLY in one shared chunk
      // This is the key - force @hashgraph/sdk into a single chunk that everything uses
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // CRITICAL: Force @hashgraph/sdk into a single shared chunk
            // Both hashconnect and our direct imports will use this chunk
            hashgraphSDK: {
              test: /[\\/]node_modules[\\/]@hashgraph[\\/]sdk[\\/]/,
              name: 'hashgraph-sdk-shared',
              priority: 100, // Highest priority - force this rule
              enforce: true, // Force this chunk to be created
              reuseExistingChunk: true, // Always reuse if it exists
            },
            // hashconnect in its own chunk (but uses the shared @hashgraph/sdk chunk)
            hashconnect: {
              test: /[\\/]node_modules[\\/]hashconnect[\\/]/,
              name: 'hashconnect',
              priority: 90,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Shared dependencies (Protobuf, Long.js) in common chunk
            commonDeps: {
              test: /[\\/]node_modules[\\/](protobufjs|long|@protobufjs)[\\/]/,
              name: 'common-deps',
              priority: 80,
              enforce: true,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }
    
    // Exclude Node.js modules from client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },

  // 🔹 Prevent browser caching of Next.js static chunks
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
