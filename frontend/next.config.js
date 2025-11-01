/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@hashgraph/sdk', 'hashconnect'],
    turbo: false,
  },
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
