/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Turbopack configuration
  // CRITICAL: Do not import @hashgraph/sdk on client-side - only use it through hashconnect
  // This prevents duplicate bundling that causes "Identifier 'n' has already been declared" errors
  experimental: {
    // Turbopack handles chunking automatically - we just need to avoid duplicate imports
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
