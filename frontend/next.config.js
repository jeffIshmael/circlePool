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
      // Client-side: Configure splitChunks to ensure @hashgraph/sdk is properly deduplicated
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // CRITICAL: Force @hashgraph/sdk into hashconnect's chunk to prevent duplicate bundling
            // This ensures both hashconnect and our code use the exact same @hashgraph/sdk instance
            hashconnect: {
              test: /[\\/]node_modules[\\/](hashconnect|@hashgraph[\\/]sdk)[\\/]/,
              name: 'hashconnect-with-sdk',
              priority: 1000, // Highest priority
              enforce: true, // Force creation even if minChunks not met
              reuseExistingChunk: true, // Always reuse if exists
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
      
      // Also use resolve.alias to ensure same module resolution
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@hashgraph/sdk': require.resolve('@hashgraph/sdk'),
      };
      
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        http2: false,
        zlib: false,
        path: false,
        os: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
      
      // Ignore Node.js-specific modules from @hashgraph/sdk
      config.plugins = config.plugins || [];
      config.plugins.push(
        new (require('webpack')).IgnorePlugin({
          resourceRegExp: /^(grpc|@grpc\/grpc-js|http2)$/,
        })
      );
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