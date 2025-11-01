/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Using webpack instead of Turbopack to avoid module deduplication issues
  // This ensures @hashgraph/sdk is properly deduplicated when imported both
  // by hashconnect and our code
  experimental: {
    // Disable Turbopack - use webpack instead
    turbopack: false,
  },

  // 🔹 Webpack configuration for proper module deduplication
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: Configure splitChunks to ensure @hashgraph/sdk is in a shared chunk
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Force @hashgraph/sdk into a single shared chunk
            hashgraphSDK: {
              test: /[\\/]node_modules[\\/]@hashgraph[\\/]sdk[\\/]/,
              name: 'hashgraph-sdk-shared',
              priority: 1000,
              enforce: true,
              reuseExistingChunk: true,
            },
            // hashconnect in its own chunk
            hashconnect: {
              test: /[\\/]node_modules[\\/]hashconnect[\\/]/,
              name: 'hashconnect',
              priority: 900,
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
      };
    }
    
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