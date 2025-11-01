/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Turbopack configuration (used for both dev and build)
  // NOTE: Turbopack doesn't support webpack config - all settings must use Turbopack APIs
  
  // 🔹 Experimental optimization for package imports
  // NOTE: Disabled for @hashgraph/sdk and hashconnect to prevent duplicate bundling
  // These packages are lazy-loaded dynamically and should not be optimized
  // Turbopack is used by default in Next.js 16 - no additional config needed
  experimental: {
    // optimizePackageImports: ['@hashgraph/sdk', 'hashconnect'], // Disabled to prevent chunk conflicts
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
