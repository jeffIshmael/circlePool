import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack:{},
  
  // Only add webpack config if needed for server-side builds
  webpack: (config, { isServer }) => {
    // Only modify client-side config
    if (!isServer) {
      // Fix for Node.js modules not available in browser
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
};

export default nextConfig;