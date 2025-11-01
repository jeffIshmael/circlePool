/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC minification if causing conflicts (optional)
  // swcMinify: false,

  // 🔹 Experimental optimization for package imports
  experimental: {
    optimizePackageImports: ['@hashgraph/sdk', 'hashconnect'],
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

    return config;
  },

  // 🔹 Exclude heavy SDKs from output tracing
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@hashgraph/sdk/**',
      'node_modules/hashconnect/**',
    ],
  },
};

module.exports = nextConfig;
