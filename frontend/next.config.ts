import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Use webpack instead of Turbopack to handle the SDK duplication issue
  // Turbopack doesn't yet support the alias resolution we need
  webpack: (config, { isServer }) => {
    // Force all @hashgraph/sdk imports to use the same version
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hashgraph/sdk': require.resolve('@hashgraph/sdk'),
    };
    
    return config;
  },
};

export default nextConfig;