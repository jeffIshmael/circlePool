/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: swcMinify is deprecated in Next.js 16
  experimental: {
    optimizePackageImports: ['@hashgraph/sdk', 'hashconnect'],
  },
  turbopack:{},
  webpack: (config, { isServer }) => {
    if (!isServer) {
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
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@hashgraph/sdk/**',
      'node_modules/hashconnect/**',
    ],
  },
};

module.exports = nextConfig;
