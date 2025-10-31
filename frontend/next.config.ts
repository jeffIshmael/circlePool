import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Force all @hashgraph/sdk imports to use the same version
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hashgraph/sdk': require.resolve('@hashgraph/sdk'),
    };
    
    // Fix for Node.js modules not available in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        http2: false,
        zlib: false,
        path: false,
        os: false,
        'node:http2': false,
        'node:net': false,
        'node:tls': false,
        'node:dns': false,
        'node:crypto': false,
        'node:stream': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
        'node:path': false,
        'node:os': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;