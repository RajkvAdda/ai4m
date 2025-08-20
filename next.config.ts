import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Let the build succeed even if ESLint finds problems
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
