const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Use webpack with aggressive splitChunks to prevent duplicate bundling
  // CRITICAL: Force @hashgraph/sdk into a single shared chunk with highest priority
  // This ensures both hashconnect and our code use the exact same chunk
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: Aggressive chunk splitting to prevent duplicate @hashgraph/sdk
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // CRITICAL: Force @hashgraph/sdk into ONE shared chunk with highest priority
            hashgraphSDK: {
              test: /[\\/]node_modules[\\/]@hashgraph[\\/]sdk[\\/]/,
              name: 'hashgraph-sdk-shared',
              priority: 1000, // Highest priority - always create this chunk first
              enforce: true, // Force creation even if minChunks not met
              reuseExistingChunk: true, // Always reuse if exists
              chunks: 'all',
            },
            // hashconnect in its own chunk (will use the shared @hashgraph/sdk chunk)
            hashconnect: {
              test: /[\\/]node_modules[\\/]hashconnect[\\/]/,
              name: 'hashconnect',
              priority: 900,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Shared dependencies (Protobuf, Long.js) in common chunk
            commonDeps: {
              test: /[\\/]node_modules[\\/](protobufjs|long|@protobufjs)[\\/]/,
              name: 'common-deps-shared',
              priority: 800,
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
      
      // Also use resolve.alias to ensure same module path
      config.resolve.alias = {
        ...config.resolve.alias,
        '@hashgraph/sdk': path.resolve(__dirname, 'node_modules/@hashgraph/sdk'),
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