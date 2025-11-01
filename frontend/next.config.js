/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Turbopack configuration
  // Using SDK singleton pattern to ensure @hashgraph/sdk is imported only once
  // This prevents duplicate bundling that causes "Identifier 'n' has already been declared" errors
  
  experimental: {
    // Turbopack handles chunking automatically
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