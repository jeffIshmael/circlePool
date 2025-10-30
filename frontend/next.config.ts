import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has TypeScript errors. Use sparingly and fix types over time.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
