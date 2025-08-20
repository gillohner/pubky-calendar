import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignore ESLint errors during build for Docker production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build for Docker production
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
