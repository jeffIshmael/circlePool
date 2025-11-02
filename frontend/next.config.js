/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC minification if causing conflicts (optional)
  // swcMinify: false,

  // 🔹 Experimental optimization for package imports
  experimental: {
    optimizePackageImports: ['@hashgraph/sdk'],
  },

  // Note: We don't transpile @hashgraph/hedera-wallet-connect to avoid including Reown adapter
  // We only use the dapp connector which is imported directly from dist/lib/dapp
  // transpilePackages: ['@hashgraph/hedera-wallet-connect'], // Disabled to avoid Reown adapter issues

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

  // 🔹 Optional Turbopack placeholder for future usage
  turbopack: {},

  // 🔹 Webpack customization
  webpack: (config, { isServer }) => {
    // Ensure stable chunk IDs to prevent mismatched bundles in production
    config.optimization.moduleIds = 'deterministic';
    config.optimization.chunkIds = 'deterministic';

    if (!isServer) {
      // Avoid Node.js core module polyfills (which break client builds)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
      };
    }

    // Ignore the problematic Reown adapter parts of @hashgraph/hedera-wallet-connect
    // We only use the dapp connector which doesn't depend on Reown adapter
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent importing the Reown adapter by aliasing problematic imports
      '@hashgraph/hedera-wallet-connect/dist/reown': false,
      '@hashgraph/hedera-wallet-connect/dist/reown/adapter': false,
      '@hashgraph/hedera-wallet-connect/dist/reown/utils': false,
    };

    return config;
  },

      // 🔹 Exclude heavy SDKs from output tracing
      outputFileTracingExcludes: {
        '*': [
          'node_modules/@hashgraph/sdk/**',
          'node_modules/@hashgraph/hedera-wallet-connect/**',
          'node_modules/@reown/**',
          'node_modules/@walletconnect/**',
        ],
      },
};

module.exports = nextConfig;
