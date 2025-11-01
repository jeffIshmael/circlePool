import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Disable code splitting for problematic packages
  experimental: {
    // This prevents Next.js from splitting these packages into separate chunks
    optimizePackageImports: ['@hashgraph/sdk', 'hashconnect'],
  },
  
  // Configure Turbopack
  turbopack: {},
  
  // Webpack config as fallback
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
  
  // Prevent output file tracing issues
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@hashgraph/sdk/**',
      'node_modules/hashconnect/**',
    ],
  },
};

export default nextConfig;