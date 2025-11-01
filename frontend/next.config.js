/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Turbopack configuration
  // Note: @hashgraph/sdk is bundled with hashconnect, which can cause duplicate bundling
  // We keep both in package.json because we use @hashgraph/sdk directly in server-side code
  // Turbopack should handle deduplication automatically, but we exclude from optimization
  
  experimental: {
    // Disable package import optimization for these to prevent duplicate bundling
    // Turbopack will bundle them separately but reuse shared dependencies
    optimizePackageImports: [
      // Exclude hashconnect and @hashgraph/sdk from optimization
      // This prevents duplicate bundling when hashconnect already includes @hashgraph/sdk
    ],
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

  // 🔹 Exclude heavy SDKs from output tracing
  // This reduces build size and prevents bundling issues
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@hashgraph/sdk/**',
      'node_modules/hashconnect/**',
    ],
  },
};

module.exports = nextConfig;
